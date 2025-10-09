import { Injectable, Logger } from '@nestjs/common';
import configuration from 'src/config/configuration';
import { AggregatedItemInput, NormalizedFeedItem } from 'src/rss/rss.types';

type CacheEntry = {
  value: string;
  expiresAt: number;
};

@Injectable()
export class SummarizerService {
  private readonly logger = new Logger(SummarizerService.name);

  constructor() {}

  private summaryCache = new Map<string, CacheEntry>();

  private ollamaHealthCache: {
    lastCheckedAt: number;
    healthy: boolean;
  } | null = null;

  private makeCacheKey(
    text: string,
    hint: string | undefined,
    model: string,
    apiEnabled: boolean
  ): string {
    const mode = apiEnabled ? model : 'fallback';
    return `${mode}::${hint ?? ''}::${text}`;
  }

  private getCachedSummary(key: string): string | null {
    const entry = this.summaryCache.get(key);
    if (!entry) {
      return null;
    }

    if (entry.expiresAt <= Date.now()) {
      this.summaryCache.delete(key);
      return null;
    }

    return entry.value;
  }

  private setCachedSummary(key: string, value: string): void {
    if (this.summaryCache.size >= configuration.maxCacheEntries) {
      const oldestKey = this.summaryCache.keys().next().value as
        | string
        | undefined;
      if (oldestKey) {
        this.summaryCache.delete(oldestKey);
      }
    }

    this.summaryCache.set(key, {
      value,
      expiresAt: Date.now() + configuration.cacheTTLMs,
    });
  }

  private clampLength(value: string, max: number): string {
    return value && value.length > max
      ? value.slice(0, max - 1).trimEnd() + '...'
      : value;
  }

  private fallbackSummary(text: string): string {
    const sentences = (text || '')
      .replace(/\s+/g, ' ')
      .split(/(?<=[.!?])\s+/)
      .filter(Boolean)
      .slice(0, 3)
      .join(' ');
    const fallback = sentences || text;
    return this.clampLength(
      fallback,
      configuration.summarizer.fallbackCharLimit
    );
  }

  private async ensureModelPulled(ollamaHost: string, model: string) {
    const ollamaConfig = configuration.ollama;
    if (
      this.ollamaHealthCache &&
      Date.now() - this.ollamaHealthCache.lastCheckedAt <
        ollamaConfig.timeoutMs
    ) {
      if (this.ollamaHealthCache.healthy) {
        return;
      }
    }

    try {
      const url = new URL('/api/pull', ollamaHost);
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        configuration.ollama.pullTimeoutMs
      );

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({ name: model, stream: false }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `Failed to pull model ${model}: ${response.status} ${text}`
        );
      }

      this.ollamaHealthCache = {
        healthy: true,
        lastCheckedAt: Date.now(),
      };
    } catch (error) {
      this.ollamaHealthCache = {
        healthy: false,
        lastCheckedAt: Date.now(),
      };
      throw error;
    }
  }

  private async summarize(text: string, hint?: string): Promise<string> {
    const trimmed = (text || '').trim();
    if (trimmed.length === 0) {
      return '';
    }

    const minLength = configuration.summarizer.minInputLength;
    const charLimit = configuration.summarizer.fallbackCharLimit;
    const ollamaConfig = configuration.ollama;
    const cacheKey = this.makeCacheKey(
      trimmed,
      hint,
      ollamaConfig.model,
      Boolean(ollamaConfig.enabled)
    );
    const cached = this.getCachedSummary(cacheKey);
    if (cached) {
      return cached;
    }

    if (trimmed.length < minLength || !ollamaConfig.enabled) {
      const summary = this.fallbackSummary(trimmed);
      this.setCachedSummary(cacheKey, summary);
      return summary;
    }

    const abortController = new AbortController();
    const timeoutId = setTimeout(
      () => abortController.abort(),
      ollamaConfig.timeoutMs
    );

    try {
      await this.ensureModelPulled(ollamaConfig.host, ollamaConfig.model);
      const url = new URL('/api/generate', ollamaConfig.host);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: abortController.signal,
        body: JSON.stringify({
          model: ollamaConfig.model,
          prompt:
            `Summarize the text in 2-3 sentences (<= ${charLimit} chars). ` +
            `Keep it concise and factual. ${hint ? `Context: ${hint}. ` : ''}` +
            `Text:\n${trimmed}`,
          options: {
            temperature: ollamaConfig.temperature,
          },
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama responded with ${response.status}`);
      }

      const data = (await response.json()) as
        | { response?: string }
        | undefined;

      const output = data?.response?.trim();
      const summary = this.clampLength(
        output && output.length > 0 ? output : this.fallbackSummary(trimmed),
        charLimit
      );
      this.setCachedSummary(cacheKey, summary);
      return summary;
    } catch {
      const summary = this.fallbackSummary(trimmed);
      this.setCachedSummary(cacheKey, summary);
      return summary;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async summarizeItems(
    items: NormalizedFeedItem[]
  ): Promise<(AggregatedItemInput & { summary: string })[]> {
    return Promise.all(
      items.map(async (item) => {
        const baseText = (
          item.content?.trim() ||
          item.contentSnippet ||
          item.title ||
          ''
        ).trim();
        const safeBase =
          baseText.length > 0 ? baseText : 'No summary available.';
        let summary = safeBase;

        try {
          const generated = await this.summarize(safeBase, item.title);
          summary =
            generated && generated.trim().length > 0
              ? generated.trim()
              : safeBase;
        } catch (error) {
          console.warn('Failed to summarize feed item', {
            link: item.link,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            error,
          });
        }

        return {
          title: item.title,
          link: item.link,
          source: item.source,
          pubDate: item.pubDate,
          contentSnippet: item.contentSnippet,
          content: item.content,
          summary,
        } satisfies AggregatedItemInput & { summary: string };
      })
    );
  }
}

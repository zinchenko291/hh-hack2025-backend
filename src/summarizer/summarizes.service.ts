import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import configuration from 'src/config/configuration';
import { AggregatedItemInput, NormalizedFeedItem } from 'src/rss/rss.types';

type CacheEntry = {
  value: string;
  expiresAt: number;
};

@Injectable()
export class SummarizerService {
  constructor() {}

  private summaryCache = new Map<string, CacheEntry>();

  private makeCacheKey(
    text: string,
    hint: string | undefined,
    model: string | undefined,
    apiEnabled: boolean
  ): string {
    const mode = apiEnabled ? (model ?? 'gpt-4o-mini') : 'fallback';
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
    return this.clampLength(fallback, configuration.openai.fallbackCharLimit);
  }

  private async summarize(text: string, hint?: string): Promise<string> {
    const trimmed = (text || '').trim();
    if (trimmed.length === 0) {
      return '';
    }

    const apiKey = configuration.openai.key;
    const model = configuration.openai.model;
    const cacheKey = this.makeCacheKey(trimmed, hint, model, Boolean(apiKey));
    const cached = this.getCachedSummary(cacheKey);
    if (cached) {
      return cached;
    }

    if (trimmed.length < 40 || !apiKey) {
      const summary = this.fallbackSummary(trimmed);
      this.setCachedSummary(cacheKey, summary);
      return summary;
    }

    try {
      const client = new OpenAI({ apiKey });
      const prompt =
        `Summarize the text in 2-3 sentences (up to ~360 characters). ` +
        `Keep it concise and factual. ${hint ? `Context: ${hint}. ` : ''}` +
        `Text:\n${trimmed}`;

      const response = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: 'You are a concise news editor.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 220,
      });

      const output = response.choices[0]?.message?.content?.trim();
      const summary = this.clampLength(
        output && output.length > 0 ? output : this.fallbackSummary(trimmed),
        configuration.openai.fallbackCharLimit
      );
      this.setCachedSummary(cacheKey, summary);
      return summary;
    } catch {
      const summary = this.fallbackSummary(trimmed);
      this.setCachedSummary(cacheKey, summary);
      return summary;
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

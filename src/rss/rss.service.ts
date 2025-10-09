import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Injectable } from '@nestjs/common';
import Parser from 'rss-parser';
import { NormalizedFeedItem, RSSFeed, RSSItem } from './rss.types';
import configuration from 'src/config/configuration';
import type { Redis } from 'ioredis';

@Injectable()
export class RssService {
  constructor(@InjectRedis() private readonly redis: Redis) {
    this.parser = new Parser({
      defaultRSS: 2.0,
      headers: {
        'user-agent': configuration.useragent,
      },
    });
  }

  private parser: Parser;

  private async fetchWithTimeout(url: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      configuration.feed.fetchTimeOut
    );

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'user-agent': configuration.useragent,
          accept: 'application/rss+xml, application/xml, text/xml, */*;q=0.8',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(
          'Failed to fetch feed: ' + response.status + ' ' + response.statusText
        );
      }

      return await response.text();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(
          'Timed out after ' + configuration.feed.fetchTimeOut + 'ms'
        );
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private extractHostname(url?: string): string {
    if (!url) {
      return '';
    }

    const trimmed = url.trim();
    if (!trimmed) {
      return '';
    }

    try {
      const candidate = /:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
      const hostname = new URL(candidate).hostname;
      return hostname.toLowerCase();
    } catch {
      return '';
    }
  }

  private collectContent(item: RSSItem): { snippet: string; content?: string } {
    const snippetSource =
      item.contentSnippet || item.summary || item.content || '';
    const snippet = snippetSource.replace(/\s+/g, ' ').trim();
    const content = item.content?.trim();
    return {
      snippet,
      content: content && content.length > 0 ? content : undefined,
    };
  }

  private selectPublishedDate(item: RSSItem): string {
    if (item.isoDate) {
      return item.isoDate;
    }

    if (item.pubDate) {
      const date = new Date(item.pubDate);
      if (!Number.isNaN(date.getTime())) {
        return date.toISOString();
      }
    }

    return new Date().toISOString();
  }

  private async getFromCache(feedUrl: string): Promise<NormalizedFeedItem[] | null> {
    try {
      const cached = await this.redis.get(feedUrl);
      if (!cached) {
        return null;
      }
      const parsed = JSON.parse(cached) as NormalizedFeedItem[];
      if (!Array.isArray(parsed)) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  private async saveToCache(feedUrl: string, items: NormalizedFeedItem[]): Promise<void> {
    try {
      await this.redis.set(feedUrl, JSON.stringify(items), 'PX', configuration.redis.ttlMs);
    } catch {
      // ignore cache errors
    }
  }

  async loadFeed(feedUrl: string) {
    const cached = await this.getFromCache(feedUrl);
    if (cached) {
      return cached;
    }

    const xml = await this.fetchWithTimeout(feedUrl);
    const feed: RSSFeed = await this.parser.parseString(xml);
    const feedHost =
      this.extractHostname(feed.link || feedUrl) ||
      this.extractHostname(feedUrl);

    const items = feed.items?.slice(0, configuration.feed.maxItems) ?? [];

    const result = items
      .map((item) => {
        if (!item.title || !item.link) {
          return null;
        }

        const linkHost = this.extractHostname(item.link) || feedHost;
        const { snippet, content } = this.collectContent(item);

        return {
          title: item.title.trim(),
          link: item.link,
          source: linkHost || feedHost || 'unknown',
          pubDate: this.selectPublishedDate(item),
          contentSnippet: snippet.length > 0 ? snippet : undefined,
          content,
          feedUrl,
        } as NormalizedFeedItem;
      })
      .filter((item): item is NormalizedFeedItem => item !== null);

    await this.saveToCache(feedUrl, result);

    return result;
  }
}

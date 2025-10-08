import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { RssService } from 'src/rss/rss.service';
import { AggregatedItemInput, NormalizedFeedItem } from 'src/rss/rss.types';
import { SummarizerService } from 'src/summarizer/summarizes.service';

@Injectable()
export class FeedService {
  constructor(
    private readonly rssService: RssService,
    private readonly summarizerService: SummarizerService
  ) {}

  private computeItemId(item: AggregatedItemInput): string {
    const hash = createHash('SHA3-256');
    hash.update(item.title ?? '');
    hash.update('||');
    hash.update(item.link ?? '');
    hash.update('||');
    hash.update(item.source ?? '');
    if (item.pubDate) {
      hash.update('||');
      hash.update(item.pubDate);
    }
    return hash.digest('hex');
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

  private normalizeTitle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[\p{P}\p{S}]+/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private createDedupKey(title: string, source: string, link?: string): string {
    const normalizedTitle = this.normalizeTitle(title);
    const normalizedSource =
      this.extractHostname(source) || this.extractHostname(link) || 'unknown';
    return `${normalizedTitle}::${normalizedSource}`;
  }

  private dedupeItems<T extends AggregatedItemInput>(items: T[]): T[] {
    const seen = new Set<string>();
    const unique: T[] = [];

    for (const item of items) {
      const key = this.createDedupKey(item.title, item.source, item.link);
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      unique.push(item);
    }

    return unique;
  }

  private filterItemsByQuery<T extends AggregatedItemInput>(
    items: T[],
    queryTerms: string[]
  ): T[] {
    if (!Array.isArray(queryTerms) || queryTerms.length === 0) {
      return items;
    }

    const normalizedTerms = queryTerms
      .map((term) => term.trim().toLowerCase())
      .filter(Boolean);

    if (normalizedTerms.length === 0) {
      return items;
    }

    return items.filter((item) => {
      const haystack = [item.title, item.contentSnippet, item.content]
        .map((segment) => segment?.toLowerCase() ?? '')
        .join(' ');

      return normalizedTerms.some((term) => haystack.includes(term));
    });
  }

  private sortByPublished(items: NormalizedFeedItem[]): NormalizedFeedItem[] {
    return [...items].sort((a, b) => {
      const timeA = a.pubDate ? Date.parse(a.pubDate) : 0;
      const timeB = b.pubDate ? Date.parse(b.pubDate) : 0;
      return timeB - timeA;
    });
  }

  async getSummarizedNews(feeds: string[], queryTerms?: string[]) {
    const feedResults = await Promise.allSettled(
      feeds.map((feedUrl) => this.rssService.loadFeed(feedUrl))
    );

    const collectedItems: NormalizedFeedItem[] = feedResults
      .filter((feed) => feed.status === 'fulfilled')
      .reduce((prev, curr) => [...prev, ...curr.value], []);

    if (collectedItems.length === 0) {
      return collectedItems;
    }

    const filtered = this.filterItemsByQuery(collectedItems, queryTerms ?? []);
    const uniqueItems = this.dedupeItems(filtered);
    const orderedItems = this.sortByPublished(uniqueItems);
    const summarized =
      await this.summarizerService.summarizeItems(orderedItems);

    return summarized.map((item) => ({
      id: this.computeItemId(item),
      title: item.title,
      link: item.link,
      source: item.source,
      published: item.pubDate ?? '',
      summary: item.summary ?? '',
    }));
  }
}

export interface RSSItem {
  title?: string;
  link?: string;
  isoDate?: string;
  pubDate?: string;
  content?: string;
  contentSnippet?: string;
  summary?: string;
  [key: string]: unknown;
}

export interface RSSFeed {
  link?: string;
  items?: RSSItem[];
}

export interface AggregatedItemInput {
  title: string;
  link: string;
  source: string;
  pubDate?: string;
  contentSnippet?: string;
  content?: string;
}

export interface NormalizedFeedItem extends AggregatedItemInput {
  feedUrl: string;
  content?: string;
}

import { Module } from '@nestjs/common';
import { FeedModule } from './feed/feed.module';
import { SummarizerModule } from './summarizer/summarizer.module';
import { RssModule } from './rss/rss.module';

@Module({
  imports: [FeedModule, RssModule, SummarizerModule],
})
export class AppModule {}

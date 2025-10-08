import { Module } from '@nestjs/common';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { RssModule } from 'src/rss/rss.module';
import { SummarizerModule } from 'src/summarizer/summarizer.module';

@Module({
  imports: [RssModule, SummarizerModule],
  controllers: [FeedController],
  providers: [FeedService],
})
export class FeedModule {}

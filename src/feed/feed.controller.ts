import { Body, Controller, Post } from '@nestjs/common';
import { FeedService } from './feed.service';
import FeedDto from './dto/feed.dto';

@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Post()
  async getFeedResult(@Body() fetchBody: FeedDto) {
    return await this.feedService.getSummarizedNews(fetchBody.feeds, fetchBody.queryTerms);
  }
}

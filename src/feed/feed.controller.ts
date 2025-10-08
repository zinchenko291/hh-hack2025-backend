import { Body, Controller, Post } from '@nestjs/common';
import { FeedService } from './feed.service';
import FeedPostDto from './dto/feed-post.dto';
import { ApiCreatedResponse } from '@nestjs/swagger';
import FeedDto from './dto/feed.dto';

@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Post()
  @ApiCreatedResponse({type: [FeedDto]})
  async getFeedResult(@Body() fetchBody: FeedPostDto) {
    return await this.feedService.getSummarizedNews(fetchBody.feeds, fetchBody.queryTerms);
  }
}

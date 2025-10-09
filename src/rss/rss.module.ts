import { Module } from '@nestjs/common';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { RssService } from './rss.service';

@Module({
  imports: [RedisModule],
  providers: [RssService],
  exports: [RssService],
})
export class RssModule {}

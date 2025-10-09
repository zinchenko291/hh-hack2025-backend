import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { FeedModule } from './feed/feed.module';
import { SummarizerModule } from './summarizer/summarizer.module';
import { RssModule } from './rss/rss.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RedisModule.forRootAsync({
      useFactory: () => ({ url: process.env.REDIS_URL }),
    }),
    FeedModule,
    RssModule,
    SummarizerModule,
  ],
})
export class AppModule {}

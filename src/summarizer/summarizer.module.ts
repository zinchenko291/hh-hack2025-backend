import { Module } from '@nestjs/common';
import { SummarizerService } from './summarizes.service';

@Module({
  providers: [SummarizerService],
  exports: [SummarizerService],
})
export class SummarizerModule {}

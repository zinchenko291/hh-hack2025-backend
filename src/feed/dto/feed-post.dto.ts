import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsArray, IsOptional } from 'class-validator';

@Exclude()
export default class FeedPostDto {
  @Expose()
  @ApiProperty()
  @IsArray()
  feeds: string[];

  @Expose()
  @ApiProperty({ required: false })
  @IsArray()
  @IsOptional()
  queryTerms?: string[];
}

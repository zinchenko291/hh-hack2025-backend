import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export default class FeedDto {
  @Expose()
  @ApiProperty()
  id: string

  @Expose()
  @ApiProperty()
  link: string

  @Expose()
  @ApiProperty()
  published: string

  @Expose()
  @ApiProperty()
  source: string

  @Expose()
  @ApiProperty()
  summary: string

  @Expose()
  @ApiProperty()
  title: string
}
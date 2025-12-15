import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { RecordsService } from './records.service';
import { CreateRecordDto } from './dto/create-record.dto';

@Controller('records')
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @Post()
  create(@Body() createRecordDto: CreateRecordDto) {
    return this.recordsService.create(createRecordDto);
  }

  @Get()
  findAll(@Query('userId') userId: string, @Query('date') date: string) {
    if (userId && date) {
      return this.recordsService.findAllByDate(userId, date);
    }
    return [];
  }
}


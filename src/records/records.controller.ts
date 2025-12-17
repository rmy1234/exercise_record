import { Controller, Get, Post, Body, Query, Patch, Param, Delete } from '@nestjs/common';
import { RecordsService } from './records.service';
import { CreateRecordDto } from './dto/create-record.dto';
import { CreateRecordSetDto } from './dto/create-record-set.dto';

@Controller('records')
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @Post()
  create(@Body() createRecordDto: CreateRecordDto) {
    return this.recordsService.create(createRecordDto);
  }

  @Get()
  findAll(
    @Query('userId') userId: string,
    @Query('date') date: string,
    @Query('exerciseId') exerciseId: string,
  ) {
    if (userId && date) {
      return this.recordsService.findAllByDate(userId, date);
    }
    if (userId && exerciseId) {
      return this.recordsService.findAllByExercise(userId, exerciseId);
    }
    return [];
  }

  @Post(':id/sets')
  addSet(@Param('id') recordId: string, @Body() createSetDto: Omit<CreateRecordSetDto, 'recordId'>) {
    return this.recordsService.addSet(recordId, createSetDto);
  }

  @Patch('sets/:setId')
  updateSet(@Param('setId') setId: string, @Body() updateData: Partial<CreateRecordSetDto>) {
    return this.recordsService.updateSet(setId, updateData);
  }

  @Delete('sets/:setId')
  deleteSet(@Param('setId') setId: string) {
    return this.recordsService.deleteSet(setId);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.recordsService.delete(id);
  }

  @Patch(':id/order')
  updateOrder(@Param('id') id: string, @Body('order') order: number) {
    return this.recordsService.updateOrder(id, order);
  }

  @Patch(':id/complete')
  complete(@Param('id') id: string, @Body('isCompleted') isCompleted: boolean) {
    return this.recordsService.updateComplete(id, isCompleted);
  }
}


import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { RoutinesService } from './routines.service';
import { CreateRoutineTemplateDto } from './dto/create-routine-template.dto';
import { UpdateRoutineTemplateDto } from './dto/update-routine-template.dto';

@Controller('routines')
export class RoutinesController {
  constructor(private readonly routinesService: RoutinesService) {}

  @Post()
  create(
    @Query('userId') userId: string,
    @Body() createRoutineDto: CreateRoutineTemplateDto,
  ) {
    return this.routinesService.create(userId, createRoutineDto);
  }

  @Get()
  findAll(@Query('userId') userId: string) {
    return this.routinesService.findAll(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query('userId') userId: string) {
    return this.routinesService.findOne(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Query('userId') userId: string,
    @Body() updateRoutineDto: UpdateRoutineTemplateDto,
  ) {
    return this.routinesService.update(id, userId, updateRoutineDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Query('userId') userId: string) {
    return this.routinesService.remove(id, userId);
  }
}


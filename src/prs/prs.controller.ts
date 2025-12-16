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
import { PRsService } from './prs.service';
import { CreatePRDto } from './dto/create-pr.dto';
import { UpdatePRDto } from './dto/update-pr.dto';

@Controller('prs')
export class PRsController {
  constructor(private readonly prsService: PRsService) {}

  @Post()
  create(@Body() createPRDto: CreatePRDto) {
    return this.prsService.create(createPRDto);
  }

  @Get()
  findAll(@Query('userId') userId?: string) {
    return this.prsService.findAll(userId);
  }

  @Get('latest')
  findLatest(@Query('userId') userId: string) {
    return this.prsService.findLatest(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.prsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePRDto: UpdatePRDto) {
    return this.prsService.update(id, updatePRDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.prsService.remove(id);
  }
}








import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoutineTemplateDto } from './dto/create-routine-template.dto';
import { UpdateRoutineTemplateDto } from './dto/update-routine-template.dto';

@Injectable()
export class RoutinesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createRoutineDto: CreateRoutineTemplateDto) {
    // 사용자 존재 확인
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return this.prisma.routineTemplate.create({
      data: {
        userId,
        name: createRoutineDto.name,
        exercises: createRoutineDto.exercises as any,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.routineTemplate.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const routine = await this.prisma.routineTemplate.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!routine) {
      throw new NotFoundException(`Routine with ID ${id} not found`);
    }

    return routine;
  }

  async update(id: string, userId: string, updateRoutineDto: UpdateRoutineTemplateDto) {
    const routine = await this.prisma.routineTemplate.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!routine) {
      throw new NotFoundException(`Routine with ID ${id} not found`);
    }

    return this.prisma.routineTemplate.update({
      where: { id },
      data: {
        name: updateRoutineDto.name,
        exercises: updateRoutineDto.exercises as any,
      },
    });
  }

  async remove(id: string, userId: string) {
    const routine = await this.prisma.routineTemplate.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!routine) {
      throw new NotFoundException(`Routine with ID ${id} not found`);
    }

    return this.prisma.routineTemplate.delete({
      where: { id },
    });
  }
}


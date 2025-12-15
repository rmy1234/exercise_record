import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoutineDto } from './dto/create-routine.dto';
import { UpdateRoutineDto } from './dto/update-routine.dto';

@Injectable()
export class RoutinesService {
  constructor(private prisma: PrismaService) {}

  async create(createRoutineDto: CreateRoutineDto) {
    // 사용자 존재 확인
    const user = await this.prisma.user.findUnique({
      where: { id: createRoutineDto.userId },
    });

    if (!user) {
      throw new NotFoundException(
        `User with ID ${createRoutineDto.userId} not found`,
      );
    }

    return this.prisma.routine.create({
      data: {
        userId: createRoutineDto.userId,
        name: createRoutineDto.name,
        description: createRoutineDto.description,
        exercises: createRoutineDto.exercises,
        isActive: createRoutineDto.isActive ?? true,
      },
    });
  }

  async findAll(userId?: string) {
    const where = userId ? { userId } : {};
    return this.prisma.routine.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const routine = await this.prisma.routine.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!routine) {
      throw new NotFoundException(`Routine with ID ${id} not found`);
    }

    return routine;
  }

  async update(id: string, updateRoutineDto: UpdateRoutineDto) {
    const routine = await this.prisma.routine.findUnique({
      where: { id },
    });

    if (!routine) {
      throw new NotFoundException(`Routine with ID ${id} not found`);
    }

    return this.prisma.routine.update({
      where: { id },
      data: updateRoutineDto,
    });
  }

  async remove(id: string) {
    const routine = await this.prisma.routine.findUnique({
      where: { id },
    });

    if (!routine) {
      throw new NotFoundException(`Routine with ID ${id} not found`);
    }

    return this.prisma.routine.delete({
      where: { id },
    });
  }
}



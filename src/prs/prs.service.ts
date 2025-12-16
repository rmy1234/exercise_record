import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePRDto } from './dto/create-pr.dto';
import { UpdatePRDto } from './dto/update-pr.dto';

@Injectable()
export class PRsService {
  constructor(private prisma: PrismaService) {}

  async create(createPRDto: CreatePRDto) {
    // 사용자 존재 확인
    const user = await this.prisma.user.findUnique({
      where: { id: createPRDto.userId },
    });

    if (!user) {
      throw new NotFoundException(
        `User with ID ${createPRDto.userId} not found`,
      );
    }

    return this.prisma.pR.create({
      data: {
        userId: createPRDto.userId,
        squat: createPRDto.squat,
        bench: createPRDto.bench,
        deadlift: createPRDto.deadlift,
        date: createPRDto.date || new Date(),
      },
    });
  }

  async findAll(userId?: string) {
    const where = userId ? { userId } : {};
    return this.prisma.pR.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const pr = await this.prisma.pR.findUnique({
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

    if (!pr) {
      throw new NotFoundException(`PR with ID ${id} not found`);
    }

    return pr;
  }

  async findLatest(userId: string) {
    const pr = await this.prisma.pR.findFirst({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    return pr;
  }

  async update(id: string, updatePRDto: UpdatePRDto) {
    const pr = await this.prisma.pR.findUnique({
      where: { id },
    });

    if (!pr) {
      throw new NotFoundException(`PR with ID ${id} not found`);
    }

    return this.prisma.pR.update({
      where: { id },
      data: updatePRDto,
    });
  }

  async remove(id: string) {
    const pr = await this.prisma.pR.findUnique({
      where: { id },
    });

    if (!pr) {
      throw new NotFoundException(`PR with ID ${id} not found`);
    }

    return this.prisma.pR.delete({
      where: { id },
    });
  }
}








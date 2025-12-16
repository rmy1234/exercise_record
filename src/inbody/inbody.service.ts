import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInbodyDto } from './dto/create-inbody.dto';
import { UpdateInbodyDto } from './dto/update-inbody.dto';
import { InbodyStatsDto } from './dto/inbody-stats.dto';

@Injectable()
export class InbodyService {
  constructor(private prisma: PrismaService) {}

  async create(createInbodyDto: CreateInbodyDto) {
    // 사용자 존재 확인
    const user = await this.prisma.user.findUnique({
      where: { id: createInbodyDto.userId },
    });

    if (!user) {
      throw new NotFoundException(
        `User with ID ${createInbodyDto.userId} not found`,
      );
    }

    return this.prisma.inbody.create({
      data: {
        userId: createInbodyDto.userId,
        date: createInbodyDto.date ? new Date(createInbodyDto.date) : new Date(),
        weight: createInbodyDto.weight,
        skeletalMuscle: createInbodyDto.skeletalMuscle,
        bodyFat: createInbodyDto.bodyFat,
        bodyFatPercent: createInbodyDto.bodyFatPercent,
        bmi: createInbodyDto.bmi,
        basalMetabolic: createInbodyDto.basalMetabolic,
      },
    });
  }

  async findAll(userId?: string) {
    const where = userId ? { userId } : {};
    return this.prisma.inbody.findMany({
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
    const inbody = await this.prisma.inbody.findUnique({
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

    if (!inbody) {
      throw new NotFoundException(`Inbody with ID ${id} not found`);
    }

    return inbody;
  }

  async getStats(userId: string, period: 'week' | 'month' | 'year'): Promise<InbodyStatsDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const data = await this.prisma.inbody.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: now,
        },
      },
      orderBy: { date: 'asc' },
    });

    return {
      period,
      data: data.map((item) => ({
        date: item.date.toISOString().split('T')[0],
        weight: item.weight,
        skeletalMuscle: item.skeletalMuscle,
        bodyFat: item.bodyFat ?? undefined,
        bodyFatPercent: item.bodyFatPercent ?? undefined,
        bmi: item.bmi ?? undefined,
        basalMetabolic: item.basalMetabolic ?? undefined,
      })),
    };
  }

  async update(id: string, updateInbodyDto: UpdateInbodyDto) {
    const inbody = await this.prisma.inbody.findUnique({
      where: { id },
    });

    if (!inbody) {
      throw new NotFoundException(`Inbody with ID ${id} not found`);
    }

    const updateData: any = { ...updateInbodyDto };
    if (updateInbodyDto.date) {
      updateData.date = new Date(updateInbodyDto.date);
    }

    return this.prisma.inbody.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    const inbody = await this.prisma.inbody.findUnique({
      where: { id },
    });

    if (!inbody) {
      throw new NotFoundException(`Inbody with ID ${id} not found`);
    }

    return this.prisma.inbody.delete({
      where: { id },
    });
  }
}





import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecordDto } from './dto/create-record.dto';

@Injectable()
export class RecordsService {
  constructor(private prisma: PrismaService) {}

  async create(createRecordDto: CreateRecordDto) {
    return this.prisma.record.create({
      data: {
        userId: createRecordDto.userId,
        exerciseId: createRecordDto.exerciseId,
        date: new Date(createRecordDto.date),
      },
      include: {
        exercise: true,
        sets: true,
      },
    });
  }

  async findAllByDate(userId: string, date: string) {
    // YYYY-MM-DD 형식의 문자열을 받아서 해당 날짜의 범위를 생성
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    return this.prisma.record.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
      include: {
        exercise: true,
        sets: {
          orderBy: { setNumber: 'asc' },
        },
      },
    });
  }
}


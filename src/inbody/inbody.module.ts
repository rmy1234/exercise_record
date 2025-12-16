import { Module } from '@nestjs/common';
import { InbodyService } from './inbody.service';
import { InbodyController } from './inbody.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InbodyController],
  providers: [InbodyService],
  exports: [InbodyService],
})
export class InbodyModule {}







import { Module } from '@nestjs/common';
import { PRsService } from './prs.service';
import { PRsController } from './prs.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PRsController],
  providers: [PRsService],
  exports: [PRsService],
})
export class PRsModule {}



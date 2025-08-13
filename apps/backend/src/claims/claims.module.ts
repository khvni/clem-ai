// apps/backend/src/claims/claims.module.ts
import { Module } from '@nestjs/common';
import { ClaimsController } from './claims.controller';
import { ClaimsService } from './claims.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [ClaimsController],
  providers: [ClaimsService, PrismaService], // Make services available for injection
})
export class ClaimsModule {}
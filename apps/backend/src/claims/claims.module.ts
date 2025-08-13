// apps/backend/src/claims/claims.module.ts
import { Module } from '@nestjs/common';
import { ClaimsController } from './claims.controller';
import { ClaimsService } from './claims.service';
import { PrismaService } from '../prisma.service';
import { ClaimsGateway } from './claims.gateway'; // Import the gateway

@Module({
  controllers: [ClaimsController],
  providers: [ClaimsService, PrismaService, ClaimsGateway], // Make services available for injection
  exports: [ClaimsGateway], // Export the gateway so it can be used in other modules
})
export class ClaimsModule {}
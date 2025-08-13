// apps/backend/src/claims/claims.controller.ts
import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { claimInputSchema } from './claims.state';
import { z } from 'zod';
import { ZodValidationPipe } from 'nestjs-zod';

// We just need a type alias for type-hinting in the method signature.
type CreateClaimDto = z.infer<typeof claimInputSchema>;

// DTO for updating claim status
const updateClaimStatusSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
});

type UpdateClaimStatusDto = z.infer<typeof updateClaimStatusSchema>;

@Controller('api/v1/claims')
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Post()
  // The ZodValidationPipe handles validation against the schema directly.
  create(
    @Body(new ZodValidationPipe(claimInputSchema))
    createClaimDto: CreateClaimDto,
  ) {
    return this.claimsService.processNewClaim(createClaimDto);
  }

  @Get()
  findAll() {
    return this.claimsService.findAllClaims();
  }

  @Patch(':id')
  updateStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateClaimStatusSchema))
    updateClaimStatusDto: UpdateClaimStatusDto,
  ) {
    return this.claimsService.updateClaimStatus(
      id,
      updateClaimStatusDto.status,
    );
  }
}

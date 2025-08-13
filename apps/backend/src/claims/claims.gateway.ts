// apps/backend/src/claims/claims.gateway.ts
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Claim } from '@prisma/client';

@WebSocketGateway({
  cors: {
    origin: '*', // For development, allow any origin. In production, lock this down.
  },
})
export class ClaimsGateway {
  @WebSocketServer()
  server: Server;

  // This method will be called from our ClaimsService to broadcast new claims
  emitNewClaim(claim: Claim) {
    this.server.emit('newClaim', claim);
  }
}
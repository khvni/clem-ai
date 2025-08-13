# WebSocket Integration for Real-time Claims Updates

This document explains how Socket.IO has been integrated into the claims module to enable real-time updates.

## Overview

The WebSocket integration allows the backend to immediately broadcast new claims to all connected frontend clients whenever a claim is successfully created via the POST `/api/v1/claims` endpoint.

## Architecture

### 1. ClaimsGateway (`src/claims/claims.gateway.ts`)

- **Purpose**: Handles WebSocket connections and broadcasts
- **Configuration**: Configured with CORS to allow connections from any origin (for development)
- **Key Method**: `emitNewClaim(claim: Claim)` - broadcasts a 'newClaim' event with the full claim object

### 2. ClaimsService Integration

- **Injection**: The ClaimsGateway is injected into the ClaimsService
- **Real-time Emission**: After successfully saving a new claim to the database, the service calls `claimsGateway.emitNewClaim(createdClaim)`
- **Logging**: Added logging to track when claims are emitted to WebSocket clients

### 3. Module Configuration

- **ClaimsModule**: Registers the ClaimsGateway as a provider and exports it
- **Dependencies**: Uses `@nestjs/websockets` and `@nestjs/platform-socket.io` packages

## Frontend Integration

To receive real-time updates, frontend clients should:

1. **Connect to WebSocket**: Connect to the backend WebSocket endpoint
2. **Listen for Events**: Listen for the 'newClaim' event
3. **Handle Updates**: Process incoming claim objects and update the UI accordingly

### Example Frontend Code (JavaScript/TypeScript)

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

socket.on('newClaim', (claim) => {
  console.log('New claim received:', claim);
  // Update UI with new claim
  // e.g., add to claims list, show notification, etc.
});

socket.on('connect', () => {
  console.log('Connected to WebSocket server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from WebSocket server');
});
```

## Event Details

- **Event Name**: `newClaim`
- **Payload**: Full Claim object (Prisma schema)
- **Broadcast Type**: Server-wide broadcast (all connected clients receive the event)
- **Trigger**: Automatically fired after successful claim creation

## Security Considerations

- **CORS**: Currently configured to allow any origin (`*`) for development
- **Production**: In production, restrict CORS origins to specific frontend domains
- **Authentication**: Consider adding WebSocket authentication if needed

## Testing

The integration includes unit tests that verify:
- ClaimsService properly injects ClaimsGateway
- `emitNewClaim` is called after successful claim creation
- WebSocket events are properly emitted

Run tests with: `pnpm test claims.service.spec.ts`

## Dependencies

- `@nestjs/websockets`: NestJS WebSocket support
- `@nestjs/platform-socket.io`: Socket.IO platform integration
- `socket.io`: Socket.IO server implementation

## Troubleshooting

1. **Connection Issues**: Check if the backend is running and accessible
2. **CORS Errors**: Verify CORS configuration in ClaimsGateway
3. **Missing Events**: Ensure ClaimsGateway is properly registered in ClaimsModule
4. **Build Errors**: Run `pnpm run build` to check for compilation issues

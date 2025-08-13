// apps/frontend/components/claim-dashboard.tsx
'use client';

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { formatDistanceToNow } from 'date-fns';

// Define the shape of our Claim data on the frontend
type Claim = {
  id: string;
  claimantName: string;
  status: string;
  triageResult: { assessment: string; severity: string } | null;
  settlementAmount: number | null;
  createdAt: string;
};

// This component takes the initial list of claims fetched from the server
export function ClaimDashboard({ initialClaims }: { initialClaims: Claim[] }) {
  const [claims, setClaims] = useState<Claim[]>(initialClaims);

  useEffect(() => {
    // Connect to the backend WebSocket server
    const socket = io('http://localhost:3000');

    // Listen for the 'newClaim' event
    socket.on('newClaim', (newClaim: Claim) => {
      // Add the new claim to the top of the list
      setClaims((prevClaims) => [newClaim, ...prevClaims]);
    });

    // Clean up the connection when the component unmounts
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Clem AI - Adjuster's Cockpit</h1>
      <ul className="space-y-4">
        {claims.map((claim) => (
          <li key={claim.id} className="bg-white shadow rounded-lg p-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">{claim.claimantName}</h2>
              <span className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(claim.createdAt), { addSuffix: true })}
              </span>
            </div>
            <p className="text-gray-600 mt-2">
              <span className="font-bold">Assessment:</span> {claim.triageResult?.assessment ?? 'Pending...'}
            </p>
            <div className="mt-4 flex justify-between items-baseline">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  claim.triageResult?.severity === 'High' ? 'bg-red-100 text-red-800' : 
                  claim.triageResult?.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-green-100 text-green-800'
                }`}>
                Severity: {claim.triageResult?.severity ?? 'N/A'}
              </span>
              <span className="text-lg font-bold text-blue-600">
                Settlement: ${claim.settlementAmount?.toLocaleString() ?? 'Pending'}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
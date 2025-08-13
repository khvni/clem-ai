// apps/frontend/components/claim-dashboard.tsx
'use client';

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { formatDistanceToNow } from 'date-fns';
import { Claim } from '@/types/claims';

// This component takes the initial list of claims fetched from the server
export function ClaimDashboard({ initialClaims }: { initialClaims: Claim[] }) {
  const [claims, setClaims] = useState<Claim[]>(initialClaims);
  const [updatingClaims, setUpdatingClaims] = useState<Set<string>>(new Set());

  const handleStatusUpdate = async (claimId: string, newStatus: 'APPROVED' | 'REJECTED') => {
    setUpdatingClaims(prev => new Set(prev).add(claimId));
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/v1/claims/${claimId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update claim status');
      }

      // Update the local state immediately for better UX
      setClaims(prevClaims => 
        prevClaims.map(claim => 
          claim.id === claimId 
            ? { ...claim, status: newStatus }
            : claim
        )
      );
    } catch (error) {
      console.error('Error updating claim status:', error);
      alert('Failed to update claim status. Please try again.');
    } finally {
      setUpdatingClaims(prev => {
        const newSet = new Set(prev);
        newSet.delete(claimId);
        return newSet;
      });
    }
  };

  useEffect(() => {
    // Connect to the backend WebSocket server
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000';
    const socket = io(wsUrl);

    // Listen for the 'newClaim' event
    socket.on('newClaim', (newClaim: Claim) => {
      // Add the new claim to the top of the list
      setClaims((prevClaims) => [newClaim, ...prevClaims]);
    });

    // Listen for the 'claimUpdated' event
    socket.on('claimUpdated', (updatedClaim: Claim) => {
      setClaims((prevClaims) => 
        prevClaims.map(claim => 
          claim.id === updatedClaim.id ? updatedClaim : claim
        )
      );
    });

    // Clean up the connection when the component unmounts
    return () => {
      socket.disconnect();
    };
  }, []);

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="w-full">
      {claims.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">No claims found</div>
          <div className="text-gray-400 text-sm">
            Claims will appear here once they are created. Try creating a new claim!
          </div>
        </div>
      ) : (
        <ul className="space-y-4">
          {claims.map((claim) => (
            <li key={claim.id} className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">{claim.claimantName}</h2>
                  <div className="flex items-center gap-3 mt-2">
                    {getStatusBadge(claim.status)}
                    <span className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(claim.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                
                {/* Action Buttons */}
                {claim.status === 'PENDING' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatusUpdate(claim.id, 'APPROVED')}
                      disabled={updatingClaims.has(claim.id)}
                      className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updatingClaims.has(claim.id) ? 'Updating...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(claim.id, 'REJECTED')}
                      disabled={updatingClaims.has(claim.id)}
                      className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updatingClaims.has(claim.id) ? 'Updating...' : 'Reject'}
                    </button>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 mb-2">
                    <span className="font-bold">Assessment:</span> {claim.triageResult?.assessment ?? 'Pending...'}
                  </p>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                      claim.triageResult?.severity === 'High' ? 'bg-red-100 text-red-800' : 
                      claim.triageResult?.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-green-100 text-green-800'
                    }`}>
                    Severity: {claim.triageResult?.severity ?? 'N/A'}
                  </span>
                </div>
                
                <div className="text-right">
                  <span className="text-lg font-bold text-blue-600">
                    Settlement: ${claim.settlementAmount?.toLocaleString() ?? 'Pending'}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
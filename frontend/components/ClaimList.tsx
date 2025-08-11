// frontend/components/ClaimList.tsx
'use client'; // This directive marks it as a Client Component

import { useEffect, useState } from 'react';
import { Claim } from '@/types'; // Use '@/' for absolute imports

export default function ClaimList() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClaims() {
      try {
        // Fetch data from our backend API
        const response = await fetch('http://localhost:8000/api/v1/claims');
        if (!response.ok) {
          throw new Error('Failed to fetch claims');
        }
        const data: Claim[] = await response.json();
        setClaims(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchClaims();
  }, []); // The empty array means this effect runs once on mount

  if (loading) return <p className="text-center text-gray-500">Loading claims...</p>;
  if (error) return <p className="text-center text-red-500">Error: {error}</p>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white shadow-md rounded-lg">
        <thead className="bg-gray-800 text-white">
          <tr>
            <th className="py-3 px-4 text-left">Claim #</th>
            <th className="py-3 px-4 text-left">Claimant</th>
            <th className="py-3 px-4 text-left">Status</th>
            <th className="py-3 px-4 text-left">AI Payout</th>
            <th className="py-3 px-4 text-left">Received</th>
          </tr>
        </thead>
        <tbody className="text-gray-700">
          {claims.map((claim) => (
            <tr key={claim.id} className="border-b hover:bg-gray-100">
              <td className="py-3 px-4 font-mono text-sm">{claim.claimNumber}</td>
              <td className="py-3 px-4">{claim.claimantName}</td>
              <td className="py-3 px-4">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  claim.status === 'AWAITING_APPROVAL' ? 'bg-yellow-200 text-yellow-800' :
                  claim.status === 'IN_REVIEW' ? 'bg-blue-200 text-blue-800' :
                  'bg-gray-200 text-gray-800'
                }`}>
                  {claim.status}
                </span>
              </td>
              <td className="py-3 px-4">
                {claim.aiRecommendation?.payout 
                  ? `$${claim.aiRecommendation.payout.toFixed(2)}` 
                  : 'N/A'}
              </td>
              <td className="py-3 px-4">{new Date(claim.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
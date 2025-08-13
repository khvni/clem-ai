// apps/frontend/app/page.tsx
import { ClaimDashboard } from '@/components/claim-dashboard';

// Define the type again for our server-side fetch
type Claim = {
  id: string;
  claimantName: string;
  status: string;
  triageResult: { assessment: string; severity: string } | null;
  settlementAmount: number | null;
  createdAt: string;
};

// This function fetches data ON THE SERVER when the page is requested.
async function getClaims(): Promise<Claim[]> {
  try {
    const res = await fetch('http://localhost:3000/api/v1/claims', {
      cache: 'no-store', // Don't cache the initial data
    });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error("Failed to fetch claims:", error);
    return [];
  }
}

export default async function Home() {
  const initialClaims = await getClaims();

  return (
    <main className="flex min-h-screen flex-col items-center p-24 bg-gray-50">
      <ClaimDashboard initialClaims={initialClaims} />
    </main>
  );
}
// apps/frontend/app/page.tsx
import { ClaimDashboard } from '@/components/claim-dashboard';
import Link from 'next/link';
import { Claim } from '@/types/claims';

// This function fetches data ON THE SERVER when the page is requested.
async function getClaims(): Promise<Claim[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const res = await fetch(`${apiUrl}/api/v1/claims`, {
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
      <div className="w-full max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Clem AI - Adjuster&apos;s Cockpit</h1>
          <Link
            href="/new-claim"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Create New Claim
          </Link>
        </div>
        <ClaimDashboard initialClaims={initialClaims} />
      </div>
    </main>
  );
}
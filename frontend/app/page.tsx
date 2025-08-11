// frontend/app/page.tsx
import ClaimList from '@/components/ClaimList';

export default function HomePage() {
  return (
    <main className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Clem AI Dashboard</h1>
        </div>
        
        {/* The ClaimList component will fetch and display the data */}
        <ClaimList />
        
      </div>
    </main>
  );
}
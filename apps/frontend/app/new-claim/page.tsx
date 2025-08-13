'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewClaimPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    claimant_name: '',
    policy_number: '',
    incident_date: '',
    incident_description: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      console.log('Submitting to API URL:', apiUrl);
      const response = await fetch(`${apiUrl}/api/v1/claims`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        // Redirect to dashboard after successful submission
        router.push('/');
      } else {
        const errorData = await response.json();
        alert(`Error creating claim: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error submitting claim:', error);
      alert('Failed to submit claim. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Claim</h1>
          <p className="mt-2 text-gray-600">Submit a new insurance claim for processing</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="claimant_name" className="block text-sm font-medium text-gray-700">
              Claimant Name
            </label>
            <input
              type="text"
              id="claimant_name"
              name="claimant_name"
              required
              value={formData.claimant_name}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 placeholder-gray-700 text-gray-900"
              placeholder="Enter claimant's full name"
            />
          </div>

          <div>
            <label htmlFor="policy_number" className="block text-sm font-medium text-gray-700">
              Policy Number
            </label>
            <input
              type="text"
              id="policy_number"
              name="policy_number"
              required
              value={formData.policy_number}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 placeholder-gray-700 text-gray-900"
              placeholder="Enter policy number"
            />
          </div>

          <div>
            <label htmlFor="incident_date" className="block text-sm font-medium text-gray-700">
              Incident Date
            </label>
            <input
              type="date"
              id="incident_date"
              name="incident_date"
              required
              value={formData.incident_date}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            />
          </div>

          <div>
            <label htmlFor="incident_description" className="block text-sm font-medium text-gray-700">
              Incident Description
            </label>
            <textarea
              id="incident_description"
              name="incident_description"
              required
              rows={4}
              minLength={20}
              value={formData.incident_description}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 placeholder-gray-700 text-gray-900"
              placeholder="Provide a detailed description of the incident (minimum 20 characters)"
            />
            <p className="mt-1 text-sm text-gray-500">
              Minimum 20 characters required
            </p>
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Claim'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

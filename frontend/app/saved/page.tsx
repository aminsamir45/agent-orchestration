'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../../components/ui/Navbar';
import Footer from '../../components/ui/Footer';
import apiClient from '../../lib/apiClient';

interface Design {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  data: any;
}

export default function SavedDesigns() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchDesigns = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.listDesigns();
        setDesigns(response.data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching designs:', err);
        setError('Failed to load saved designs. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDesigns();
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-4 text-gray-900">Saved Agent Designs</h1>
          
          <div className="mb-6 flex justify-between items-center">
            <p className="text-lg text-gray-600">
              View and manage your saved agent orchestration designs.
            </p>
            
            <Link 
              href="/"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Create New Design
            </Link>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-pulse flex space-x-4">
                <div className="rounded-full bg-indigo-400 h-12 w-12"></div>
                <div className="rounded-full bg-indigo-400 h-12 w-12"></div>
                <div className="rounded-full bg-indigo-400 h-12 w-12"></div>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 my-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          ) : designs.length === 0 ? (
            <div className="bg-white shadow-md rounded-lg p-8 text-center">
              <p className="text-gray-600 mb-4">You don't have any saved agent designs yet.</p>
              <Link 
                href="/"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Create Your First Design
              </Link>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul role="list" className="divide-y divide-gray-200">
                {designs.map((design) => (
                  <li key={design.id}>
                    <div className="block hover:bg-gray-50">
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-indigo-600 truncate">
                            {design.name}
                          </p>
                          <div className="ml-2 flex-shrink-0 flex">
                            <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              {new Date(design.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              {design.data?.agents?.length || 0} Agents
                            </p>
                            <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                              {design.data?.orchestrationPattern || 'Unknown pattern'}
                            </p>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <div className="flex space-x-2">
                              <button 
                                className="text-indigo-600 hover:text-indigo-900"
                                onClick={() => {/* Will implement in future tasks */}}
                              >
                                View
                              </button>
                              <button 
                                className="text-indigo-600 hover:text-indigo-900"
                                onClick={() => {/* Will implement in future tasks */}}
                              >
                                Run
                              </button>
                              <button 
                                className="text-red-600 hover:text-red-900"
                                onClick={() => {/* Will implement in future tasks */}}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
} 
'use client';

import { useState } from 'react';
import Navbar from '../components/ui/Navbar';
import Footer from '../components/ui/Footer';
import ProgressIndicator from '../components/ui/ProgressIndicator';
import SystemDescriptionInput from '../components/SystemDescriptionInput';

// Define the steps for the workflow
const WORKFLOW_STEPS = [
  {
    id: 1,
    name: 'System Description',
    description: 'Describe the agent system you want to build'
  },
  {
    id: 2,
    name: 'AI Synthesis',
    description: 'AI analyzes your requirements'
  },
  {
    id: 3,
    name: 'Tool Selection',
    description: 'Select tools and functionality for your agents'
  },
  {
    id: 4,
    name: 'Design Refinement',
    description: 'AI refines the design based on your selections'
  },
  {
    id: 5,
    name: 'Diagram Generation',
    description: 'View and interact with your agent orchestration diagram'
  },
  {
    id: 6,
    name: 'Execution',
    description: 'Run and test your designed agent system'
  }
];

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1);
  const [systemDescription, setSystemDescription] = useState('');
  
  const handleDescriptionSubmit = (description: string) => {
    setSystemDescription(description);
    setCurrentStep(2);
    // This would typically call an API to process the description
    console.log('Description submitted:', description);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-4 text-gray-900">Agent Orchestration App</h1>
          <p className="text-lg text-gray-600 mb-6">
            Design and implement custom AI agent systems through a guided, interactive process.
          </p>
          
          <div className="mb-8">
            <ProgressIndicator 
              steps={WORKFLOW_STEPS} 
              currentStep={currentStep} 
            />
          </div>
          
          {currentStep === 1 && (
            <SystemDescriptionInput onSubmit={handleDescriptionSubmit} />
          )}
          
          {currentStep > 1 && (
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">AI Processing</h2>
              <p className="text-gray-600">
                Subsequent steps will be implemented as we progress through the tasks.
              </p>
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-pulse flex space-x-4">
                  <div className="rounded-full bg-indigo-400 h-12 w-12"></div>
                  <div className="rounded-full bg-indigo-400 h-12 w-12"></div>
                  <div className="rounded-full bg-indigo-400 h-12 w-12"></div>
                </div>
                <p className="mt-4 text-sm text-gray-500">Processing your request...</p>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
} 
'use client';

import { useState } from 'react';
import Navbar from '../components/ui/Navbar';
import Footer from '../components/ui/Footer';
import ProgressIndicator from '../components/ui/ProgressIndicator';
import SystemDescriptionInput from '../components/SystemDescriptionInput';
import ToolSelectionInput from '../components/ToolSelectionInput';
import DesignRefinementInput from '../components/DesignRefinementInput';
import DiagramView from '../components/DiagramView';
import ExecutionPanel from '../components/ExecutionPanel';
import apiClient from '../lib/apiClient';

// Define the steps for the workflow
const WORKFLOW_STEPS = [
  {
    id: 1,
    name: 'System Description',
    description: 'Describe your agent system'
  },
  {
    id: 2,
    name: 'AI Synthesis',
    description: 'AI analyzes and suggests an initial design'
  },
  {
    id: 3,
    name: 'Tool Selection',
    description: 'Select tools for your agents'
  },
  {
    id: 4,
    name: 'Design Refinement',
    description: 'Fine-tune your agent system design'
  },
  {
    id: 5,
    name: 'Diagram Generation',
    description: 'Visualize your agent system'
  },
  {
    id: 6,
    name: 'Execution',
    description: 'Run and test your agent system'
  }
];

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1);
  const [systemDescription, setSystemDescription] = useState('');
  const [initialAnalysis, setInitialAnalysis] = useState<any>(null);
  const [refinedDesign, setRefinedDesign] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleDescriptionSubmit = async (description: string) => {
    try {
      setSystemDescription(description);
      setIsProcessing(true);
      setError(null);
      setCurrentStep(2); // Move to AI Synthesis step
      
      // Call the API to process the system description
      const result = await apiClient.processSystemDescription(description);
      
      setInitialAnalysis(result);
      setCurrentStep(3); // Move to Tool Selection step
    } catch (err: any) {
      console.error('Error processing system description:', err);
      setError(err.message || 'An error occurred');
      setCurrentStep(1); // Go back to description step
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleToolSelectionSubmit = async (toolSelections: string[]) => {
    try {
      setIsProcessing(true);
      setError(null);
      setCurrentStep(4); // Move to Design Refinement step
      
      // Call the API to process tool selections
      const result = await apiClient.processToolSelections(initialAnalysis, toolSelections);
      
      setRefinedDesign({
        agents: result.agents,
        orchestrationType: result.orchestrationType
      });
      
      // Move to Diagram Generation step
      setCurrentStep(5);
    } catch (err: any) {
      console.error('Error processing tool selections:', err);
      setError(err.message || 'An error occurred');
      setCurrentStep(3); // Go back to tool selection step
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleDesignRefinementSubmit = async (refinedDesign: any) => {
    try {
      setIsProcessing(true);
      setError(null);
      
      setRefinedDesign(refinedDesign);
      setCurrentStep(5); // Move to Diagram Generation step
    } catch (err: any) {
      console.error('Error processing design refinement:', err);
      setError(err.message || 'An error occurred');
      setCurrentStep(4); // Go back to design refinement step
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleGenerateDiagram = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      
      // Call the API to generate diagram
      const result = await apiClient.generateDiagram(refinedDesign);
      
      // Store diagram data and move to Execution step
      setRefinedDesign({
        ...refinedDesign,
        diagram: result
      });
      
      setCurrentStep(6);
    } catch (err: any) {
      console.error('Error generating diagram:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Render the appropriate step content
  const renderStepContent = () => {
    if (isProcessing) {
      return (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            {WORKFLOW_STEPS[currentStep - 1].name}
          </h2>
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-pulse flex space-x-4">
              <div className="rounded-full bg-indigo-400 h-12 w-12"></div>
              <div className="rounded-full bg-indigo-400 h-12 w-12"></div>
              <div className="rounded-full bg-indigo-400 h-12 w-12"></div>
            </div>
            <p className="mt-4 text-sm text-gray-500">Processing your request...</p>
          </div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
          <button
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            onClick={() => setError(null)}
          >
            Try Again
          </button>
        </div>
      );
    }
    
    switch (currentStep) {
      case 1:
        return <SystemDescriptionInput onSubmit={handleDescriptionSubmit} />;
      case 3:
        return <ToolSelectionInput initialAnalysis={initialAnalysis} onSubmit={handleToolSelectionSubmit} />;
      case 4:
        return <DesignRefinementInput initialDesign={initialAnalysis} onSubmit={handleDesignRefinementSubmit} />;
      case 5:
        return (
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Diagram Generation</h2>
            <p className="text-gray-600 mb-4">
              Your agent system design is ready. Below is a preview of your system architecture.
            </p>
            
            {refinedDesign?.diagram ? (
              <div className="mb-6">
                <DiagramView diagramData={refinedDesign.diagram} />
              </div>
            ) : (
              <div className="mb-6 p-8 border rounded-md flex items-center justify-center bg-gray-50">
                <p className="text-gray-500">
                  Click the button below to generate a visual representation of your agent orchestration.
                </p>
              </div>
            )}
            
            <button
              onClick={handleGenerateDiagram}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              disabled={!!refinedDesign?.diagram}
            >
              {refinedDesign?.diagram ? 'Diagram Generated' : 'Generate Diagram'}
            </button>
            
            {refinedDesign?.diagram && (
              <button
                onClick={() => setCurrentStep(6)}
                className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                Continue to Execution
              </button>
            )}
          </div>
        );
      case 6:
        return (
          <ExecutionPanel 
            refinedDesign={refinedDesign} 
            diagramData={refinedDesign?.diagram}
          />
        );
      default:
        return null;
    }
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
          
          {renderStepContent()}
        </div>
      </main>
      
      <Footer />
    </div>
  );
} 
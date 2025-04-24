'use client';

import React, { useState } from 'react';
import { DiagramData } from '../../lib/services/DiagramService';
import DiagramView from '../../components/DiagramView';

export default function TestDiagramPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diagramData, setDiagramData] = useState<DiagramData | null>(null);
  const [orchestrationType, setOrchestrationType] = useState('hierarchical');
  
  // Sample agents for testing
  const testAgents = [
    {
      id: 'user-agent',
      name: 'User Agent',
      description: 'Handles user interactions and queries',
      purpose: 'Interface with the user',
      capabilities: ['Natural language understanding', 'Query processing', 'Response formatting'],
      limitations: ['Cannot access external systems directly'],
      tools: ['natural-language-processing']
    },
    {
      id: 'search-agent',
      name: 'Search Agent',
      description: 'Performs web searches and retrieves information',
      purpose: 'Find relevant information from the web',
      capabilities: ['Web search', 'Result filtering', 'Information extraction'],
      limitations: ['Limited to publicly available information'],
      tools: ['web-search', 'information-extraction']
    },
    {
      id: 'reasoning-agent',
      name: 'Reasoning Agent',
      description: 'Analyzes information and makes logical inferences',
      purpose: 'Process and analyze retrieved information',
      capabilities: ['Logical reasoning', 'Pattern recognition', 'Consistency checking'],
      limitations: ['May struggle with ambiguous information'],
      tools: ['logical-reasoning']
    },
    {
      id: 'coding-agent',
      name: 'Coding Agent',
      description: 'Writes, reviews, and explains code',
      purpose: 'Generate and modify code',
      capabilities: ['Code generation', 'Code review', 'Debugging assistance'],
      limitations: ['Limited to supported programming languages'],
      tools: ['code-generation', 'static-analysis']
    }
  ];
  
  // Function to generate a diagram
  const generateDiagram = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/synthesis/diagram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agents: testAgents,
          orchestrationType: orchestrationType
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Diagram data:', data);
      
      if (data.status === 'success') {
        setDiagramData(data.data);
      } else {
        throw new Error(data.message || 'Failed to generate diagram');
      }
    } catch (err) {
      console.error('Error generating diagram:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Diagram API Test</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Generate Orchestration Diagram</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Orchestration Type</label>
          <select 
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={orchestrationType}
            onChange={(e) => setOrchestrationType(e.target.value)}
          >
            <option value="hierarchical">Hierarchical</option>
            <option value="sequential">Sequential</option>
            <option value="parallel">Parallel</option>
            <option value="collaborative">Collaborative</option>
          </select>
        </div>
        
        <button
          onClick={generateDiagram}
          disabled={isLoading}
          className={`px-4 py-2 rounded text-white font-medium ${
            isLoading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading ? 'Generating...' : 'Generate Diagram'}
        </button>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}
      </div>
      
      {diagramData && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Generated Diagram</h2>
          <DiagramView 
            diagramData={diagramData} 
            rendererType="d3"
          />
          
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <h3 className="text-md font-medium mb-2">Raw Diagram Data</h3>
            <pre className="text-xs overflow-auto max-h-60">
              {JSON.stringify(diagramData, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
} 
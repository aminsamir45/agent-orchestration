'use client';

import React, { useState, useEffect } from 'react';
import OrchestrationDiagram from '../../components/OrchestrationDiagram';
import { DiagramData, DiagramNode, DiagramEdge } from '../../lib/services/DiagramService';

// Sample diagrams for different orchestration patterns
const sampleDiagrams: Record<string, DiagramData> = {
  // Hierarchical pattern - Manager/Workers relationship
  hierarchical: {
    nodes: [
      { id: 'user', type: 'user', label: 'User', size: 1.5, 
        style: { color: '#9c27b0' } },
      { id: 'manager', type: 'agent', label: 'Manager Agent', size: 2, category: 'planner',
        style: { color: '#4285F4', shape: 'circle' } },
      { id: 'search', type: 'agent', label: 'Search Agent', category: 'retrieval',
        style: { color: '#3367D6', shape: 'circle' } },
      { id: 'reasoning', type: 'agent', label: 'Reasoning Agent', category: 'reasoning',
        style: { color: '#5E97F6', shape: 'circle' } },
      { id: 'coding', type: 'agent', label: 'Coding Agent', category: 'tool',
        style: { color: '#3F51B5', shape: 'circle' } },
      { id: 'memory', type: 'memory', label: 'Shared Memory', 
        style: { color: '#FBBC05', shape: 'cylinder' } },
      { id: 'tools', type: 'tool', label: 'Tool Repository', 
        style: { color: '#34A853', shape: 'square' } }
    ],
    edges: [
      { id: 'e1', source: 'user', target: 'manager', label: 'Request', type: 'control',
        style: { lineStyle: 'solid', bidirectional: false, color: '#EA4335' } },
      { id: 'e2', source: 'manager', target: 'user', label: 'Response', type: 'data',
        style: { lineStyle: 'solid', bidirectional: false, color: '#4285F4' } },
      { id: 'e3', source: 'manager', target: 'search', label: 'Search Tasks', type: 'control',
        style: { lineStyle: 'solid', bidirectional: false, color: '#EA4335' } },
      { id: 'e4', source: 'manager', target: 'reasoning', label: 'Analysis Tasks', type: 'control',
        style: { lineStyle: 'solid', bidirectional: false, color: '#EA4335' } },
      { id: 'e5', source: 'manager', target: 'coding', label: 'Coding Tasks', type: 'control',
        style: { lineStyle: 'solid', bidirectional: false, color: '#EA4335' } },
      { id: 'e6', source: 'search', target: 'manager', label: 'Search Results', type: 'data',
        style: { lineStyle: 'solid', bidirectional: false, color: '#4285F4' } },
      { id: 'e7', source: 'reasoning', target: 'manager', label: 'Analysis Results', type: 'data',
        style: { lineStyle: 'solid', bidirectional: false, color: '#4285F4' } },
      { id: 'e8', source: 'coding', target: 'manager', label: 'Code Results', type: 'data',
        style: { lineStyle: 'solid', bidirectional: false, color: '#4285F4' } },
      { id: 'e9', source: 'manager', target: 'memory', label: 'Access/Update', type: 'read-write',
        style: { lineStyle: 'dashed', bidirectional: true, color: '#FBBC05' } },
      { id: 'e10', source: 'coding', target: 'tools', label: 'Use Tools', type: 'read',
        style: { lineStyle: 'dotted', bidirectional: false, color: '#34A853' } }
    ],
    groups: [
      { id: 'g1', label: 'Worker Agents', nodes: ['search', 'reasoning', 'coding'],
        style: { color: '#E8F0FE' } }
    ],
    layout: 'hierarchical'
  },
  
  // Sequential pattern - Pipeline processing
  sequential: {
    nodes: [
      { id: 'input', type: 'user', label: 'User Input', size: 1.5,
        style: { color: '#9c27b0' } },
      { id: 'parser', type: 'agent', label: 'Parser Agent', category: 'nlu',
        style: { color: '#4285F4', shape: 'circle' } },
      { id: 'retriever', type: 'agent', label: 'Retrieval Agent', category: 'retrieval',
        style: { color: '#3367D6', shape: 'circle' } },
      { id: 'analyzer', type: 'agent', label: 'Analyzer Agent', category: 'reasoning',
        style: { color: '#5E97F6', shape: 'circle' } },
      { id: 'generator', type: 'agent', label: 'Generator Agent', category: 'reasoning',
        style: { color: '#8AB4F8', shape: 'circle' } },
      { id: 'output', type: 'data', label: 'Response Output', 
        style: { color: '#EA4335', shape: 'square' } },
      { id: 'kb', type: 'memory', label: 'Knowledge Base', 
        style: { color: '#FBBC05', shape: 'cylinder' } }
    ],
    edges: [
      { id: 'e1', source: 'input', target: 'parser', label: 'Raw Query', type: 'data',
        style: { lineStyle: 'solid', bidirectional: false, color: '#4285F4' } },
      { id: 'e2', source: 'parser', target: 'retriever', label: 'Parsed Query', type: 'data',
        style: { lineStyle: 'solid', bidirectional: false, color: '#4285F4' } },
      { id: 'e3', source: 'retriever', target: 'analyzer', label: 'Retrieved Information', type: 'data',
        style: { lineStyle: 'solid', bidirectional: false, color: '#4285F4' } },
      { id: 'e4', source: 'analyzer', target: 'generator', label: 'Analysis Results', type: 'data',
        style: { lineStyle: 'solid', bidirectional: false, color: '#4285F4' } },
      { id: 'e5', source: 'generator', target: 'output', label: 'Generated Response', type: 'data',
        style: { lineStyle: 'solid', bidirectional: false, color: '#4285F4' } },
      { id: 'e6', source: 'retriever', target: 'kb', label: 'Query', type: 'read',
        style: { lineStyle: 'dotted', bidirectional: false, color: '#34A853' } },
      { id: 'e7', source: 'kb', target: 'retriever', label: 'Results', type: 'data',
        style: { lineStyle: 'solid', bidirectional: false, color: '#4285F4' } }
    ],
    layout: 'dagre' // Left-to-right for sequential flow
  },
  
  // Parallel pattern - Concurrent processing
  parallel: {
    nodes: [
      { id: 'user', type: 'user', label: 'User', size: 1.5,
        style: { color: '#9c27b0' } },
      { id: 'dispatcher', type: 'agent', label: 'Dispatcher Agent', size: 2, category: 'planner',
        style: { color: '#4285F4', shape: 'circle' } },
      { id: 'web', type: 'agent', label: 'Web Search Agent', category: 'retrieval',
        style: { color: '#3367D6', shape: 'circle' } },
      { id: 'db', type: 'agent', label: 'Database Agent', category: 'retrieval',
        style: { color: '#5E97F6', shape: 'circle' } },
      { id: 'doc', type: 'agent', label: 'Document Agent', category: 'retrieval',
        style: { color: '#8AB4F8', shape: 'circle' } },
      { id: 'aggregator', type: 'agent', label: 'Result Aggregator', category: 'reasoning',
        style: { color: '#673AB7', shape: 'circle' } },
      { id: 'internet', type: 'service', label: 'Internet',
        style: { color: '#EA4335', shape: 'cloud' } },
      { id: 'database', type: 'memory', label: 'Database',
        style: { color: '#FBBC05', shape: 'cylinder' } },
      { id: 'docs', type: 'data', label: 'Document Store',
        style: { color: '#34A853', shape: 'square' } }
    ],
    edges: [
      { id: 'e1', source: 'user', target: 'dispatcher', label: 'Query', type: 'control',
        style: { lineStyle: 'solid', bidirectional: false, color: '#EA4335' } },
      { id: 'e2', source: 'dispatcher', target: 'web', label: 'Search Request', type: 'control',
        style: { lineStyle: 'solid', bidirectional: false, color: '#EA4335' } },
      { id: 'e3', source: 'dispatcher', target: 'db', label: 'DB Query', type: 'control',
        style: { lineStyle: 'solid', bidirectional: false, color: '#EA4335' } },
      { id: 'e4', source: 'dispatcher', target: 'doc', label: 'Doc Request', type: 'control',
        style: { lineStyle: 'solid', bidirectional: false, color: '#EA4335' } },
      { id: 'e5', source: 'web', target: 'internet', label: 'Search', type: 'read',
        style: { lineStyle: 'dotted', bidirectional: false, color: '#34A853' } },
      { id: 'e6', source: 'db', target: 'database', label: 'Query', type: 'read',
        style: { lineStyle: 'dotted', bidirectional: false, color: '#34A853' } },
      { id: 'e7', source: 'doc', target: 'docs', label: 'Retrieve', type: 'read',
        style: { lineStyle: 'dotted', bidirectional: false, color: '#34A853' } },
      { id: 'e8', source: 'web', target: 'aggregator', label: 'Web Results', type: 'data',
        style: { lineStyle: 'solid', bidirectional: false, color: '#4285F4' } },
      { id: 'e9', source: 'db', target: 'aggregator', label: 'DB Results', type: 'data',
        style: { lineStyle: 'solid', bidirectional: false, color: '#4285F4' } },
      { id: 'e10', source: 'doc', target: 'aggregator', label: 'Doc Results', type: 'data',
        style: { lineStyle: 'solid', bidirectional: false, color: '#4285F4' } },
      { id: 'e11', source: 'aggregator', target: 'user', label: 'Combined Results', type: 'data',
        style: { lineStyle: 'solid', bidirectional: false, color: '#4285F4' } }
    ],
    groups: [
      { id: 'g1', label: 'Search Services', nodes: ['web', 'db', 'doc'],
        style: { color: '#E8F0FE' } },
      { id: 'g2', label: 'External Resources', nodes: ['internet', 'database', 'docs'],
        style: { color: '#FEF7E0' } }
    ],
    layout: 'force'
  },
  
  // Collaborative pattern - Peer agents working together
  collaborative: {
    nodes: [
      { id: 'user', type: 'user', label: 'User', size: 1.5,
        style: { color: '#9c27b0' } },
      { id: 'coordinator', type: 'agent', label: 'Coordinator Agent', category: 'planner',
        style: { color: '#4285F4', shape: 'circle' } },
      { id: 'research', type: 'agent', label: 'Research Agent', category: 'retrieval',
        style: { color: '#3367D6', shape: 'circle' } },
      { id: 'critic', type: 'agent', label: 'Critic Agent', category: 'reasoning',
        style: { color: '#5E97F6', shape: 'circle' } },
      { id: 'writer', type: 'agent', label: 'Writer Agent', category: 'reasoning',
        style: { color: '#8AB4F8', shape: 'circle' } },
      { id: 'memory', type: 'memory', label: 'Shared Memory', size: 2,
        style: { color: '#FBBC05', shape: 'cylinder' } }
    ],
    edges: [
      { id: 'e1', source: 'user', target: 'coordinator', label: 'Task', type: 'control',
        style: { lineStyle: 'solid', bidirectional: false, color: '#EA4335' } },
      { id: 'e2', source: 'coordinator', target: 'user', label: 'Result', type: 'data',
        style: { lineStyle: 'solid', bidirectional: false, color: '#4285F4' } },
      { id: 'e3', source: 'research', target: 'memory', label: 'Write Findings', type: 'write',
        style: { lineStyle: 'solid', bidirectional: false, color: '#FBBC05' } },
      { id: 'e4', source: 'critic', target: 'memory', label: 'Write Feedback', type: 'write',
        style: { lineStyle: 'solid', bidirectional: false, color: '#FBBC05' } },
      { id: 'e5', source: 'writer', target: 'memory', label: 'Write Content', type: 'write',
        style: { lineStyle: 'solid', bidirectional: false, color: '#FBBC05' } },
      { id: 'e6', source: 'memory', target: 'research', label: 'Read Context', type: 'read',
        style: { lineStyle: 'dotted', bidirectional: false, color: '#34A853' } },
      { id: 'e7', source: 'memory', target: 'critic', label: 'Read Content', type: 'read',
        style: { lineStyle: 'dotted', bidirectional: false, color: '#34A853' } },
      { id: 'e8', source: 'memory', target: 'writer', label: 'Read Feedback', type: 'read',
        style: { lineStyle: 'dotted', bidirectional: false, color: '#34A853' } },
      { id: 'e9', source: 'coordinator', target: 'memory', label: 'Monitor', type: 'read-write',
        style: { lineStyle: 'dashed', bidirectional: true, color: '#673AB7' } },
      { id: 'e10', source: 'research', target: 'critic', label: 'Collaborate', type: 'control',
        style: { lineStyle: 'dashed', bidirectional: true, color: '#673AB7' } },
      { id: 'e11', source: 'critic', target: 'writer', label: 'Collaborate', type: 'control',
        style: { lineStyle: 'dashed', bidirectional: true, color: '#673AB7' } },
      { id: 'e12', source: 'writer', target: 'research', label: 'Collaborate', type: 'control',
        style: { lineStyle: 'dashed', bidirectional: true, color: '#673AB7' } }
    ],
    layout: 'force'
  }
};

export default function OrchestrationDiagramPage() {
  const [selectedDiagram, setSelectedDiagram] = useState<string>('hierarchical');
  const [theme, setTheme] = useState<'default' | 'dark' | 'forest' | 'neutral'>('default');
  const [renderer, setRenderer] = useState<'mermaid' | 'd3'>('d3');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  
  // Check if dependencies are loaded
  useEffect(() => {
    const checkDependencies = async () => {
      try {
        // Import libraries dynamically to check if they load properly
        await Promise.all([
          import('mermaid'),
          import('d3')
        ]);
        setIsLoaded(true);
      } catch (error) {
        console.error('Failed to load diagram dependencies:', error);
        setLoadError('Failed to load diagram dependencies. Please check your internet connection and try again.');
      }
    };
    
    checkDependencies();
  }, []);
  
  // Display loading or error state
  if (!isLoaded) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Agent Orchestration Diagram</h1>
        <div className="bg-white rounded-lg shadow p-8">
          {loadError ? (
            <div className="text-center">
              <div className="text-red-500 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-red-800 mb-4">{loadError}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading diagram tools...</p>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Descriptions for each orchestration pattern
  const patternDescriptions: Record<string, string> = {
    hierarchical: 'A manager agent delegates tasks to specialized worker agents and consolidates their results. This pattern is ideal for complex tasks requiring multiple specialized skills.',
    sequential: 'Agents process information in a pipeline, with each agent performing a specific transformation before passing data to the next agent. Suitable for multi-stage processing workflows.',
    parallel: 'Multiple agents work simultaneously on different aspects of a task, with results aggregated at the end. Effective for tasks that can be naturally decomposed into independent sub-tasks.',
    collaborative: 'Agents work as peers with access to shared memory, collaborating to solve problems together. Well-suited for creative tasks requiring diverse perspectives.'
  };
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Agent Orchestration Patterns</h1>
      
      {/* Tabs for different orchestration patterns */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex" aria-label="Tabs">
            {Object.keys(sampleDiagrams).map((key) => (
              <button
                key={key}
                onClick={() => setSelectedDiagram(key)}
                className={`
                  py-4 px-6 font-medium text-sm capitalize border-b-2 focus:outline-none
                  ${selectedDiagram === key 
                    ? 'border-indigo-500 text-indigo-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                {key} Pattern
              </button>
            ))}
          </nav>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Configuration</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Renderer</label>
              <div className="flex space-x-4">
                <button
                  onClick={() => setRenderer('mermaid')}
                  className={`px-3 py-2 text-sm rounded ${
                    renderer === 'mermaid' 
                      ? 'bg-indigo-100 text-indigo-700' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Mermaid
                </button>
                <button
                  onClick={() => setRenderer('d3')}
                  className={`px-3 py-2 text-sm rounded ${
                    renderer === 'd3' 
                      ? 'bg-indigo-100 text-indigo-700' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  D3 (Interactive)
                </button>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Theme</label>
              <select 
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={theme}
                onChange={(e) => setTheme(e.target.value as any)}
              >
                <option value="default">Light</option>
                <option value="dark">Dark</option>
                <option value="forest">Forest</option>
                <option value="neutral">Neutral</option>
              </select>
            </div>
            
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">Pattern Description</h3>
              <div className="p-3 bg-gray-50 rounded text-sm">
                <p>{patternDescriptions[selectedDiagram]}</p>
              </div>
            </div>
          </div>
          
          {/* Legend */}
          <div className="bg-white rounded-lg shadow p-4 mt-4">
            <h2 className="text-lg font-semibold mb-4">Legend</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <span className="inline-block w-4 h-4 rounded-full bg-blue-500 mr-2"></span>
                <span>Agent Nodes</span>
              </div>
              <div className="flex items-center">
                <span className="inline-block w-4 h-4 rounded bg-green-500 mr-2"></span>
                <span>Tool Nodes</span>
              </div>
              <div className="flex items-center">
                <span className="inline-block w-4 h-4 rounded-full bg-purple-500 mr-2"></span>
                <span>User Nodes</span>
              </div>
              <div className="flex items-center">
                <span className="inline-block w-4 h-4 bg-yellow-500 mr-2" style={{borderRadius: '50% 50% 0 0'}}></span>
                <span>Memory Nodes</span>
              </div>
              <div className="border-t my-2"></div>
              <div className="flex items-center">
                <svg width="24" height="8" className="mr-2">
                  <line x1="0" y1="4" x2="24" y2="4" stroke="#EA4335" strokeWidth="2"/>
                </svg>
                <span>Control Flow</span>
              </div>
              <div className="flex items-center">
                <svg width="24" height="8" className="mr-2">
                  <line x1="0" y1="4" x2="24" y2="4" stroke="#4285F4" strokeWidth="2"/>
                </svg>
                <span>Data Flow</span>
              </div>
              <div className="flex items-center">
                <svg width="24" height="8" className="mr-2">
                  <line x1="0" y1="4" x2="24" y2="4" stroke="#34A853" strokeWidth="2" strokeDasharray="2,2"/>
                </svg>
                <span>Read Access</span>
              </div>
              <div className="flex items-center">
                <svg width="24" height="8" className="mr-2">
                  <line x1="0" y1="4" x2="24" y2="4" stroke="#FBBC05" strokeWidth="2"/>
                </svg>
                <span>Write Access</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-span-1 md:col-span-3">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">{selectedDiagram.charAt(0).toUpperCase() + selectedDiagram.slice(1)} Orchestration Pattern</h2>
            <OrchestrationDiagram 
              key={`${selectedDiagram}-${renderer}-${theme}`}
              data={sampleDiagrams[selectedDiagram]} 
              theme={theme}
              initialRenderer={renderer}
              height={600}
            />
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Orchestration Pattern Comparison</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-700 mb-2">When to Use Hierarchical Pattern</h3>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Tasks require coordination of multiple specialized agents</li>
              <li>Clear division of responsibility is needed</li>
              <li>Central planning and result consolidation is important</li>
              <li>Example: Content creation with research, writing, and editing agents</li>
            </ul>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-medium text-green-700 mb-2">When to Use Sequential Pattern</h3>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Information needs systematic, step-by-step processing</li>
              <li>Each stage adds value or transforms the data</li>
              <li>Output of one agent directly feeds into the next</li>
              <li>Example: Text processing pipeline (parse, retrieve, analyze, generate)</li>
            </ul>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-medium text-purple-700 mb-2">When to Use Parallel Pattern</h3>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Task can be decomposed into independent subtasks</li>
              <li>Efficiency and throughput are priorities</li>
              <li>Results need to be aggregated from multiple sources</li>
              <li>Example: Multi-source search across web, database, and documents</li>
            </ul>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-medium text-yellow-700 mb-2">When to Use Collaborative Pattern</h3>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Complex problems requiring diverse perspectives</li>
              <li>Creative tasks with iterative refinement</li>
              <li>Agents need to build on each other's work</li>
              <li>Example: Collaborative document writing with research, critique, and editing</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 
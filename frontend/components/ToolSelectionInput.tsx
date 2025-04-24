import { useState, useEffect } from 'react';
import GuidancePanel from './ui/GuidancePanel';
import apiClient from '../lib/apiClient';

// Common AI agent tools
const AVAILABLE_TOOLS = [
  {
    id: 'web-search',
    name: 'Web Search',
    description: 'Search the internet for information',
    category: 'Information Retrieval'
  },
  {
    id: 'knowledge-base',
    name: 'Knowledge Base',
    description: 'Access and query structured knowledge bases',
    category: 'Information Retrieval'
  },
  {
    id: 'document-reader',
    name: 'Document Reader',
    description: 'Read and extract information from documents (PDF, DOC, etc.)',
    category: 'Information Retrieval'
  },
  {
    id: 'text-analysis',
    name: 'Text Analysis',
    description: 'Analyze text for sentiment, entities, keywords, etc.',
    category: 'Processing'
  },
  {
    id: 'language-translation',
    name: 'Language Translation',
    description: 'Translate text between languages',
    category: 'Processing'
  },
  {
    id: 'code-generation',
    name: 'Code Generation',
    description: 'Generate code in various programming languages',
    category: 'Development'
  },
  {
    id: 'code-execution',
    name: 'Code Execution',
    description: 'Execute code in a sandboxed environment',
    category: 'Development'
  },
  {
    id: 'email-sender',
    name: 'Email Sender',
    description: 'Send emails on behalf of the user',
    category: 'Communication'
  },
  {
    id: 'calendar-management',
    name: 'Calendar Management',
    description: 'View, create, and manage calendar events',
    category: 'Productivity'
  },
  {
    id: 'task-management',
    name: 'Task Management',
    description: 'Create and manage tasks and to-do lists',
    category: 'Productivity'
  },
  {
    id: 'image-generation',
    name: 'Image Generation',
    description: 'Generate images based on text descriptions',
    category: 'Creative'
  },
  {
    id: 'image-analysis',
    name: 'Image Analysis',
    description: 'Analyze images for objects, text, faces, etc.',
    category: 'Processing'
  },
  {
    id: 'data-visualization',
    name: 'Data Visualization',
    description: 'Create charts and graphs from data',
    category: 'Presentation'
  },
  {
    id: 'speech-to-text',
    name: 'Speech to Text',
    description: 'Convert spoken language to written text',
    category: 'Input/Output'
  },
  {
    id: 'text-to-speech',
    name: 'Text to Speech',
    description: 'Convert written text to spoken language',
    category: 'Input/Output'
  }
];

// Group tools by category
const TOOL_CATEGORIES = AVAILABLE_TOOLS.reduce((acc, tool) => {
  if (!acc[tool.category]) {
    acc[tool.category] = [];
  }
  acc[tool.category].push(tool);
  return acc;
}, {} as Record<string, typeof AVAILABLE_TOOLS>);

interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  capabilities: string[];
}

interface ToolSelectionInputProps {
  initialAnalysis: {
    recommendedTools: string[];
    agents: any[];
    summary: string;
  };
  onSubmit: (toolSelections: string[], analysis: any) => void;
}

export default function ToolSelectionInput({
  initialAnalysis,
  onSubmit
}: ToolSelectionInputProps) {
  const [tools, setTools] = useState<Tool[]>([
    {
      id: 'web-search',
      name: 'Web Search',
      description: 'Search the web for real-time information and data',
      category: 'Information Retrieval',
      capabilities: ['Web search', 'Information retrieval', 'Current data access']
    },
    {
      id: 'document-analysis',
      name: 'Document Analysis',
      description: 'Extract information and insights from documents',
      category: 'Data Processing',
      capabilities: ['Text extraction', 'Semantic analysis', 'Document summarization']
    },
    {
      id: 'code-generation',
      name: 'Code Generation',
      description: 'Generate code in various programming languages',
      category: 'Development',
      capabilities: ['Code writing', 'Syntax validation', 'Best practices']
    },
    {
      id: 'data-visualization',
      name: 'Data Visualization',
      description: 'Create visual representations of data',
      category: 'Reporting',
      capabilities: ['Chart generation', 'Interactive visualization', 'Data mapping']
    },
    {
      id: 'language-translation',
      name: 'Language Translation',
      description: 'Translate text between different languages',
      category: 'Communication',
      capabilities: ['Multi-language support', 'Context preservation', 'Colloquialism handling']
    },
    {
      id: 'database-query',
      name: 'Database Query',
      description: 'Execute and optimize database queries',
      category: 'Data Management',
      capabilities: ['SQL generation', 'Query optimization', 'Database schema understanding']
    },
    {
      id: 'text-to-speech',
      name: 'Text to Speech',
      description: 'Convert text to natural-sounding speech',
      category: 'Communication',
      capabilities: ['Voice synthesis', 'Pronunciation control', 'Multiple voice options']
    },
    {
      id: 'image-recognition',
      name: 'Image Recognition',
      description: 'Identify objects and patterns in images',
      category: 'Computer Vision',
      capabilities: ['Object detection', 'Scene understanding', 'Visual pattern recognition']
    },
    {
      id: 'task-management',
      name: 'Task Management',
      description: 'Plan, schedule, and track tasks and workflows',
      category: 'Productivity',
      capabilities: ['Task creation', 'Scheduling', 'Progress tracking']
    },
    {
      id: 'sentiment-analysis',
      name: 'Sentiment Analysis',
      description: 'Determine the emotional tone of text',
      category: 'Communication',
      capabilities: ['Emotion detection', 'Opinion mining', 'Brand monitoring']
    }
  ]);
  
  const [selectedTools, setSelectedTools] = useState<string[]>(initialAnalysis.recommendedTools || []);
  const [filter, setFilter] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Get all unique tool categories
  const categories = Array.from(new Set(tools.map(tool => tool.category)));

  // Filter tools based on search, category, and filter
  const filteredTools = tools.filter(tool => {
    const matchesSearch = searchTerm === '' || 
      tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = activeCategory === null || 
      tool.category === activeCategory;
    
    const matchesFilter = filter === '' || 
      (filter === 'recommended' && initialAnalysis.recommendedTools?.includes(tool.id));
    
    return matchesSearch && matchesCategory && matchesFilter;
  });

  const toggleToolSelection = (toolId: string) => {
    setSelectedTools(prev => 
      prev.includes(toolId) 
        ? prev.filter(id => id !== toolId)
        : [...prev, toolId]
    );
  };

  const handleSubmit = async () => {
    if (selectedTools.length === 0) {
      return; // Require at least one tool selection
    }

    setIsSubmitting(true);
    
    try {
      onSubmit(selectedTools, initialAnalysis);
    } catch (error) {
      console.error('Error submitting tool selections:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow">
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Select Tools for Your Agent System</h2>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">System Analysis Summary</h3>
          <div className="bg-gray-50 p-4 rounded border">
            <p>{initialAnalysis.summary}</p>
            
            {initialAnalysis.agents?.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium">Suggested Agents:</h4>
                <ul className="list-disc pl-5 mt-2">
                  {initialAnalysis.agents.map((agent, index) => (
                    <li key={index}>{agent.name} - {agent.role}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {initialAnalysis.recommendedTools?.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium">Recommended Tools:</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  {initialAnalysis.recommendedTools.map(toolId => {
                    const tool = tools.find(t => t.id === toolId);
                    return tool ? (
                      <span key={toolId} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                        {tool.name}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Available Tools</h3>
            <div className="flex items-center space-x-2">
              <select 
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="">All Tools</option>
                <option value="recommended">Recommended Tools</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="relative">
              <input
                type="text"
                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md"
                placeholder="Search tools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <svg 
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path 
                  fillRule="evenodd" 
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" 
                  clipRule="evenodd" 
                />
              </svg>
            </div>
          </div>
          
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className={`px-3 py-1 text-sm rounded-full ${
                activeCategory === null 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setActiveCategory(null)}
            >
              All Categories
            </button>
            
            {categories.map(category => (
              <button
                key={category}
                className={`px-3 py-1 text-sm rounded-full ${
                  activeCategory === category 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {filteredTools.map(tool => (
            <div 
              key={tool.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedTools.includes(tool.id) 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => toggleToolSelection(tool.id)}
            >
              <div className="flex justify-between items-start">
                <h4 className="font-medium text-lg">{tool.name}</h4>
                <div className="flex items-center">
                  {initialAnalysis.recommendedTools?.includes(tool.id) && (
                    <span className="mr-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                      Recommended
                    </span>
                  )}
                  <div className={`w-5 h-5 rounded-full border ${
                    selectedTools.includes(tool.id) 
                      ? 'border-blue-500 bg-blue-500' 
                      : 'border-gray-300'
                  }`}>
                    {selectedTools.includes(tool.id) && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-gray-600 text-sm mt-1">{tool.description}</p>
              <div className="mt-2">
                <span className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-800 rounded">
                  {tool.category}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {tool.capabilities.map((capability, index) => (
                  <span key={index} className="inline-block px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                    {capability}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 border-t pt-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="font-medium">Selected: </span>
              <span className="text-blue-600">{selectedTools.length} tools</span>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || selectedTools.length === 0}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                isSubmitting || selectedTools.length === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? 'Processing...' : 'Continue with Selected Tools'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
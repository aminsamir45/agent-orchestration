import { useState, useRef, useEffect } from 'react';
import DiagramView from './DiagramView';
import apiClient from '../lib/apiClient';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  agentId?: string;
  timestamp: Date;
}

interface ExecutionPanelProps {
  refinedDesign: any;
  diagramData: any;
}

export default function ExecutionPanel({ refinedDesign, diagramData }: ExecutionPanelProps) {
  const [designName, setDesignName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savedDesignId, setSavedDesignId] = useState<string | null>(null);
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'system',
      content: 'Your agent system is ready to use. Send a message to start.',
      timestamp: new Date()
    }
  ]);
  const [isExecuting, setIsExecuting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSaveDesign = async () => {
    if (!designName.trim()) {
      return; // Require a name
    }

    try {
      setIsSaving(true);
      
      const designData = {
        name: designName,
        agents: refinedDesign.agents,
        orchestrationPatterns: refinedDesign.orchestrationPatterns,
        diagram: diagramData
      };
      
      const result = await apiClient.saveDesign(designName, designData);
      
      setSavedDesignId(result.id);
      setIsSaved(true);
      
      // Add system message acknowledging save
      setMessages(prev => [
        ...prev,
        {
          role: 'system',
          content: `Design saved successfully with ID: ${result.id}`,
          timestamp: new Date()
        }
      ]);
    } catch (error) {
      console.error('Error saving design:', error);
      
      // Add error message
      setMessages(prev => [
        ...prev,
        {
          role: 'system',
          content: 'Failed to save design. Please try again.',
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExecute = async () => {
    if (!userInput.trim() || isExecuting) {
      return;
    }

    // Add user message to chat
    const userMessage: Message = {
      role: 'user',
      content: userInput,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsExecuting(true);

    try {
      if (!savedDesignId) {
        // Save design if not already saved
        if (!designName.trim()) {
          throw new Error('Please name and save your design before executing');
        }
        
        const designData = {
          name: designName,
          agents: refinedDesign.agents,
          orchestrationPatterns: refinedDesign.orchestrationPatterns,
          diagram: diagramData
        };
        
        const saveResult = await apiClient.saveDesign(designName, designData);
        setSavedDesignId(saveResult.id);
        setIsSaved(true);
        
        // Execute with newly saved design
        const executionResult = await apiClient.executeAgentSystem(saveResult.id, userInput);
        
        // Process execution results
        handleExecutionResult(executionResult);
      } else {
        // Execute with existing saved design
        const executionResult = await apiClient.executeAgentSystem(savedDesignId, userInput);
        
        // Process execution results
        handleExecutionResult(executionResult);
      }
    } catch (error: any) {
      console.error('Execution error:', error);
      
      // Add error message
      setMessages(prev => [
        ...prev,
        {
          role: 'system',
          content: `Error: ${error.message || 'Failed to execute. Please try again.'}`,
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleExecutionResult = (result: any) => {
    // Process the agent execution trace
    if (result.agentTrace && Array.isArray(result.agentTrace)) {
      // Add each agent's response as a separate message
      result.agentTrace.forEach((trace: any) => {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: trace.output || 'Agent processed the request',
            agentId: trace.agentId,
            timestamp: new Date()
          }
        ]);
      });
    }
    
    // Add final response
    if (result.finalResponse) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: result.finalResponse,
          timestamp: new Date()
        }
      ]);
    }
  };

  const getAgentNameById = (agentId?: string) => {
    if (!agentId || !refinedDesign.agents) return 'Agent';
    
    const agent = refinedDesign.agents.find((a: any) => a.id === agentId);
    return agent ? agent.name : 'Agent';
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow overflow-hidden">
      <div className="border-b p-4">
        <h2 className="text-2xl font-bold mb-2">Agent System Execution</h2>
        <p className="text-gray-600">
          Interact with your agent system and see how it responds to your requests.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
        <div className="bg-gray-50 rounded-lg border p-4">
          <h3 className="text-lg font-semibold mb-4">System Design</h3>
          
          <div className="mb-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Save Your Design
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={designName}
                  onChange={(e) => setDesignName(e.target.value)}
                  disabled={isSaved}
                  placeholder="Enter a name for your design"
                  className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 flex-grow"
                />
                <button
                  onClick={handleSaveDesign}
                  disabled={isSaved || isSaving || !designName.trim()}
                  className={`ml-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                    isSaved 
                      ? 'bg-green-600'
                      : isSaving || !designName.trim()
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isSaved ? 'Saved' : isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
          
          <div className="h-[400px] overflow-auto border rounded-md bg-white">
            {diagramData ? (
              <DiagramView diagramData={diagramData} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No diagram available
              </div>
            )}
          </div>
          
          <div className="mt-4">
            <h4 className="font-medium mb-2">System Composition</h4>
            <div className="text-sm text-gray-600">
              <p><strong>Agents:</strong> {refinedDesign?.agents?.length || 0}</p>
              <p><strong>Orchestration Patterns:</strong> {refinedDesign?.orchestrationPatterns?.length || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Agent Interaction</h3>
          
          <div className="h-[400px] bg-gray-50 rounded-md p-3 overflow-y-auto mb-4">
            {messages.map((message, index) => (
              <div key={index} className={`mb-3 ${
                message.role === 'user' 
                  ? 'text-right' 
                  : message.role === 'system'
                    ? 'text-center'
                    : 'text-left'
              }`}>
                <div className={`inline-block rounded-lg px-4 py-2 max-w-[80%] ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : message.role === 'system'
                      ? 'bg-gray-200 text-gray-800 text-sm'
                      : 'bg-gray-300 text-gray-800'
                }`}>
                  {message.role === 'assistant' && message.agentId && (
                    <div className="text-xs font-semibold mb-1 text-blue-800">
                      {getAgentNameById(message.agentId)}
                    </div>
                  )}
                  <div>{message.content}</div>
                  <div className="text-xs opacity-75 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="relative">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Type your request..."
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleExecute();
                }
              }}
              disabled={isExecuting}
            />
            <button
              onClick={handleExecute}
              disabled={isExecuting || !userInput.trim()}
              className={`absolute right-2 top-2 p-1 rounded-full ${
                isExecuting || !userInput.trim()
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-blue-600 hover:text-blue-800'
              }`}
            >
              {isExecuting ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
          
          <div className="mt-4 text-sm text-gray-500">
            <p>
              Send a request to your agent system and see how it responds. Your agents will process your request according to the configured orchestration pattern.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 
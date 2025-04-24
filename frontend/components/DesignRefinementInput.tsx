import { useState, useEffect } from 'react';
import apiClient from '../lib/apiClient';

interface Agent {
  id: string;
  name: string;
  role: string;
  capabilities: string[];
  inputs: string[];
  outputs: string[];
}

interface OrchestrationPattern {
  id: string;
  name: string;
  description: string;
  agentIds: string[];
  flowType: 'sequential' | 'parallel' | 'conditional';
  conditions?: {
    if: string;
    then: string[];
    else?: string[];
  }[];
}

interface DesignRefinementInputProps {
  initialDesign: {
    agents: Agent[];
    orchestrationPatterns: OrchestrationPattern[];
    summary: string;
  };
  onSubmit: (refinedDesign: any) => void;
}

export default function DesignRefinementInput({
  initialDesign,
  onSubmit
}: DesignRefinementInputProps) {
  const [design, setDesign] = useState(initialDesign);
  const [activeTab, setActiveTab] = useState<'agents' | 'orchestration' | 'summary'>('agents');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Form states for new agent
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentRole, setNewAgentRole] = useState('');
  const [newAgentCapability, setNewAgentCapability] = useState('');
  const [newAgentCapabilities, setNewAgentCapabilities] = useState<string[]>([]);
  const [newAgentInput, setNewAgentInput] = useState('');
  const [newAgentInputs, setNewAgentInputs] = useState<string[]>([]);
  const [newAgentOutput, setNewAgentOutput] = useState('');
  const [newAgentOutputs, setNewAgentOutputs] = useState<string[]>([]);

  // Form states for new orchestration pattern
  const [newPatternName, setNewPatternName] = useState('');
  const [newPatternDescription, setNewPatternDescription] = useState('');
  const [newPatternAgentIds, setNewPatternAgentIds] = useState<string[]>([]);
  const [newPatternFlowType, setNewPatternFlowType] = useState<'sequential' | 'parallel' | 'conditional'>('sequential');
  
  // Clear validation errors when design changes
  useEffect(() => {
    setValidationErrors([]);
  }, [design]);

  const validateDesign = (): boolean => {
    const errors: string[] = [];

    if (design.agents.length === 0) {
      errors.push('At least one agent is required');
    }

    design.agents.forEach(agent => {
      if (!agent.name) errors.push(`Agent ${agent.id} must have a name`);
      if (!agent.role) errors.push(`Agent ${agent.id} must have a role`);
      if (agent.capabilities.length === 0) errors.push(`Agent ${agent.id} must have at least one capability`);
    });

    if (design.orchestrationPatterns.length === 0) {
      errors.push('At least one orchestration pattern is required');
    }

    design.orchestrationPatterns.forEach(pattern => {
      if (!pattern.name) errors.push(`Pattern ${pattern.id} must have a name`);
      if (pattern.agentIds.length < 2) errors.push(`Pattern ${pattern.id} must include at least two agents`);
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleAddAgent = () => {
    if (!newAgentName || !newAgentRole || newAgentCapabilities.length === 0) {
      setValidationErrors(['Please fill in all required agent fields']);
      return;
    }

    const newAgent: Agent = {
      id: `agent-${Date.now()}`,
      name: newAgentName,
      role: newAgentRole,
      capabilities: [...newAgentCapabilities],
      inputs: [...newAgentInputs],
      outputs: [...newAgentOutputs]
    };

    setDesign({
      ...design,
      agents: [...design.agents, newAgent]
    });

    // Reset form
    setNewAgentName('');
    setNewAgentRole('');
    setNewAgentCapability('');
    setNewAgentCapabilities([]);
    setNewAgentInput('');
    setNewAgentInputs([]);
    setNewAgentOutput('');
    setNewAgentOutputs([]);
    setValidationErrors([]);
  };

  const handleRemoveAgent = (agentId: string) => {
    // Remove agent
    const updatedAgents = design.agents.filter(agent => agent.id !== agentId);
    
    // Remove agent from orchestration patterns
    const updatedPatterns = design.orchestrationPatterns.map(pattern => ({
      ...pattern,
      agentIds: pattern.agentIds.filter(id => id !== agentId)
    }));

    setDesign({
      ...design,
      agents: updatedAgents,
      orchestrationPatterns: updatedPatterns
    });
  };

  const handleAddOrchestrationPattern = () => {
    if (!newPatternName || !newPatternDescription || newPatternAgentIds.length < 2) {
      setValidationErrors(['Please fill in all required orchestration pattern fields and select at least two agents']);
      return;
    }

    const newPattern: OrchestrationPattern = {
      id: `pattern-${Date.now()}`,
      name: newPatternName,
      description: newPatternDescription,
      agentIds: [...newPatternAgentIds],
      flowType: newPatternFlowType,
      conditions: newPatternFlowType === 'conditional' ? [{ if: '', then: [] }] : undefined
    };

    setDesign({
      ...design,
      orchestrationPatterns: [...design.orchestrationPatterns, newPattern]
    });

    // Reset form
    setNewPatternName('');
    setNewPatternDescription('');
    setNewPatternAgentIds([]);
    setNewPatternFlowType('sequential');
    setValidationErrors([]);
  };

  const handleRemoveOrchestrationPattern = (patternId: string) => {
    const updatedPatterns = design.orchestrationPatterns.filter(
      pattern => pattern.id !== patternId
    );

    setDesign({
      ...design,
      orchestrationPatterns: updatedPatterns
    });
  };

  const handleAddCapability = () => {
    if (newAgentCapability.trim()) {
      setNewAgentCapabilities([...newAgentCapabilities, newAgentCapability.trim()]);
      setNewAgentCapability('');
    }
  };

  const handleRemoveCapability = (capability: string) => {
    setNewAgentCapabilities(newAgentCapabilities.filter(cap => cap !== capability));
  };

  const handleAddInput = () => {
    if (newAgentInput.trim()) {
      setNewAgentInputs([...newAgentInputs, newAgentInput.trim()]);
      setNewAgentInput('');
    }
  };

  const handleRemoveInput = (input: string) => {
    setNewAgentInputs(newAgentInputs.filter(i => i !== input));
  };

  const handleAddOutput = () => {
    if (newAgentOutput.trim()) {
      setNewAgentOutputs([...newAgentOutputs, newAgentOutput.trim()]);
      setNewAgentOutput('');
    }
  };

  const handleRemoveOutput = (output: string) => {
    setNewAgentOutputs(newAgentOutputs.filter(o => o !== output));
  };

  const handleAgentSelection = (agentId: string) => {
    if (newPatternAgentIds.includes(agentId)) {
      setNewPatternAgentIds(newPatternAgentIds.filter(id => id !== agentId));
    } else {
      setNewPatternAgentIds([...newPatternAgentIds, agentId]);
    }
  };

  const handleSubmit = async () => {
    if (!validateDesign()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      onSubmit(design);
    } catch (error) {
      console.error('Error submitting refined design:', error);
      setValidationErrors(['Failed to submit design. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow">
      <div className="mb-4">
        <div className="flex border-b">
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'agents' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('agents')}
          >
            Agents
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'orchestration' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('orchestration')}
          >
            Orchestration
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'summary' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('summary')}
          >
            Summary
          </button>
        </div>
      </div>

      {validationErrors.length > 0 && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700">
          <h3 className="font-bold">Validation Errors:</h3>
          <ul className="list-disc pl-5">
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Agents Tab */}
      {activeTab === 'agents' && (
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Agent Configuration</h2>
          
          {/* Existing Agents */}
          {design.agents.length > 0 && (
            <div className="mb-6">
              <h3 className="text-md font-medium mb-2">Current Agents</h3>
              <div className="space-y-4">
                {design.agents.map((agent) => (
                  <div key={agent.id} className="p-3 border rounded bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold">{agent.name}</h4>
                        <p className="text-sm text-gray-600">{agent.role}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveAgent(agent.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                    
                    <div className="mt-2">
                      <h5 className="text-sm font-medium">Capabilities:</h5>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {agent.capabilities.map((capability, index) => (
                          <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                            {capability}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {agent.inputs.length > 0 && (
                      <div className="mt-2">
                        <h5 className="text-sm font-medium">Inputs:</h5>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {agent.inputs.map((input, index) => (
                            <span key={index} className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                              {input}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {agent.outputs.length > 0 && (
                      <div className="mt-2">
                        <h5 className="text-sm font-medium">Outputs:</h5>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {agent.outputs.map((output, index) => (
                            <span key={index} className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                              {output}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Add New Agent Form */}
          <div className="border rounded p-4">
            <h3 className="text-md font-medium mb-4">Add New Agent</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Agent Name*
                </label>
                <input
                  type="text"
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter agent name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Agent Role*
                </label>
                <input
                  type="text"
                  value={newAgentRole}
                  onChange={(e) => setNewAgentRole(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter agent role"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Capabilities*
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={newAgentCapability}
                    onChange={(e) => setNewAgentCapability(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add a capability"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCapability();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCapability}
                    className="ml-2 mt-1 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                
                {newAgentCapabilities.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {newAgentCapabilities.map((capability, index) => (
                      <div key={index} className="flex items-center bg-blue-100 rounded px-2 py-1">
                        <span className="text-blue-800 text-sm">{capability}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCapability(capability)}
                          className="ml-1 text-blue-500 hover:text-blue-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Inputs
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={newAgentInput}
                    onChange={(e) => setNewAgentInput(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add an input"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddInput();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddInput}
                    className="ml-2 mt-1 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                
                {newAgentInputs.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {newAgentInputs.map((input, index) => (
                      <div key={index} className="flex items-center bg-green-100 rounded px-2 py-1">
                        <span className="text-green-800 text-sm">{input}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveInput(input)}
                          className="ml-1 text-green-500 hover:text-green-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Outputs
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={newAgentOutput}
                    onChange={(e) => setNewAgentOutput(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add an output"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddOutput();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddOutput}
                    className="ml-2 mt-1 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                
                {newAgentOutputs.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {newAgentOutputs.map((output, index) => (
                      <div key={index} className="flex items-center bg-purple-100 rounded px-2 py-1">
                        <span className="text-purple-800 text-sm">{output}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveOutput(output)}
                          className="ml-1 text-purple-500 hover:text-purple-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div>
                <button
                  type="button"
                  onClick={handleAddAgent}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  Add Agent
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Orchestration Tab */}
      {activeTab === 'orchestration' && (
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Orchestration Configuration</h2>
          
          {/* Existing Patterns */}
          {design.orchestrationPatterns.length > 0 && (
            <div className="mb-6">
              <h3 className="text-md font-medium mb-2">Current Orchestration Patterns</h3>
              <div className="space-y-4">
                {design.orchestrationPatterns.map((pattern) => (
                  <div key={pattern.id} className="p-3 border rounded bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold">{pattern.name}</h4>
                        <p className="text-sm text-gray-600">{pattern.description}</p>
                        <p className="text-sm font-medium mt-1">Flow Type: <span className="text-blue-600">{pattern.flowType}</span></p>
                      </div>
                      <button
                        onClick={() => handleRemoveOrchestrationPattern(pattern.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                    
                    <div className="mt-2">
                      <h5 className="text-sm font-medium">Agents Involved:</h5>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {pattern.agentIds.map((agentId) => {
                          const agent = design.agents.find(a => a.id === agentId);
                          return agent ? (
                            <span key={agentId} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                              {agent.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Add New Pattern Form */}
          <div className="border rounded p-4">
            <h3 className="text-md font-medium mb-4">Add New Orchestration Pattern</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Pattern Name*
                </label>
                <input
                  type="text"
                  value={newPatternName}
                  onChange={(e) => setNewPatternName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter pattern name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description*
                </label>
                <textarea
                  value={newPatternDescription}
                  onChange={(e) => setNewPatternDescription(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe how this pattern works"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Flow Type
                </label>
                <select
                  value={newPatternFlowType}
                  onChange={(e) => setNewPatternFlowType(e.target.value as any)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="sequential">Sequential</option>
                  <option value="parallel">Parallel</option>
                  <option value="conditional">Conditional</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Select Agents*
                </label>
                <div className="mt-2 space-y-2">
                  {design.agents.length === 0 ? (
                    <p className="text-sm text-red-500">Please create agents first</p>
                  ) : (
                    design.agents.map((agent) => (
                      <div key={agent.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`agent-${agent.id}`}
                          checked={newPatternAgentIds.includes(agent.id)}
                          onChange={() => handleAgentSelection(agent.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor={`agent-${agent.id}`}
                          className="ml-2 block text-sm text-gray-900"
                        >
                          {agent.name} ({agent.role})
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              <div>
                <button
                  type="button"
                  onClick={handleAddOrchestrationPattern}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  disabled={design.agents.length === 0}
                >
                  Add Pattern
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Tab */}
      {activeTab === 'summary' && (
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Design Summary</h2>
          
          <div className="mb-4">
            <h3 className="text-md font-medium mb-2">Agents ({design.agents.length})</h3>
            <ul className="list-disc pl-5">
              {design.agents.map((agent) => (
                <li key={agent.id}>
                  <strong>{agent.name}</strong> - {agent.role}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="mb-4">
            <h3 className="text-md font-medium mb-2">Orchestration Patterns ({design.orchestrationPatterns.length})</h3>
            <ul className="list-disc pl-5">
              {design.orchestrationPatterns.map((pattern) => (
                <li key={pattern.id}>
                  <strong>{pattern.name}</strong> - {pattern.flowType} flow with {pattern.agentIds.length} agents
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="text-md font-medium mb-2">Design Validation</h3>
            {validateDesign() ? (
              <p className="text-green-600">✓ Your design is valid and ready to submit</p>
            ) : (
              <div>
                <p className="text-red-600 mb-2">Please fix the following issues:</p>
                <ul className="list-disc pl-5 text-red-600">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="p-4 border-t flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || validationErrors.length > 0}
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
            isSubmitting || validationErrors.length > 0
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Design'}
        </button>
      </div>
    </div>
  );
} 
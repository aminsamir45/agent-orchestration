// Agent System Types

export interface Agent {
  id: string;
  name: string;
  description: string;
  purpose: string;
  capabilities: string[];
  limitations: string[];
  tools: string[];
}

export interface AgentComponent {
  id: string;
  type: 'agent';
  data: Agent;
}

export enum OrchestrationType {
  SEQUENTIAL = 'sequential',
  PARALLEL = 'parallel',
  CONDITIONAL = 'conditional',
  SUPERVISORY = 'supervisory',
  HIERARCHICAL = 'hierarchical',
  COLLABORATIVE = 'collaborative'
}

export interface InitialAnalysis {
  summary: string;
  suggestedAgents: Agent[];
  suggestedOrchestration: OrchestrationType;
  reasoning: string;
}

export interface ToolSelections {
  selectedTools: string[];
  agentUpdates: Agent[];
}

export interface AgentDesign {
  id: string;
  name: string;
  description: string;
  agents: Agent[];
  orchestrationType: OrchestrationType;
  diagram?: DiagramData;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiagramNode {
  id: string;
  label: string;
  type: string;
  role?: string;
  category?: string;
  description?: string;
  size?: number;
  style?: {
    shape?: string;
    color?: string;
  };
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
  style?: {
    lineStyle?: string;
    thickness?: number;
    color?: string;
    bidirectional?: boolean;
  };
}

export interface DiagramGroup {
  id: string;
  label: string;
  nodes: string[];
  style?: {
    color?: string;
  };
}

export interface DiagramData {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  layout: string;
  groups?: DiagramGroup[];
}

export interface FilteredMemory {
  recentMessages: string[];
  relevantFacts: string[];
  actionHistory: string[];
} 
import mermaid from 'mermaid';
import * as d3 from 'd3';

// --- Unified Diagram Types (Align with backend/src/types/index.ts) ---

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
  // D3 simulation properties (optional, managed by D3)
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

// --- End of Unified Diagram Types ---

/**
 * Configuration options for the DiagramService
 */
export interface DiagramConfig {
  container: string | HTMLElement;
  type?: 'mermaid' | 'd3';
  theme?: 'default' | 'dark' | 'forest' | 'neutral';
  width?: number;
  height?: number;
}

/**
 * Service for generating and managing interactive diagrams showing agent relationships
 * (This is the primary, consolidated DiagramService)
 */
export class DiagramService {
  private container: HTMLElement;
  private config: DiagramConfig;
  private currentDiagram: DiagramData | null = null;
  private renderType: 'mermaid' | 'd3';
  private simulation?: d3.Simulation<DiagramNode, DiagramEdge>; // Store D3 simulation

  /**
   * Initialize the DiagramService
   */
  constructor(config: DiagramConfig) {
    this.config = {
      width: 800,
      height: 600,
      theme: 'default',
      type: 'mermaid',
      ...config
    };

    this.renderType = this.config.type || 'mermaid';

    // Get container element
    if (typeof this.config.container === 'string') {
      const el = document.getElementById(this.config.container);
      if (!el) {
        throw new Error(`Container element with ID "${this.config.container}" not found`);
      }
      this.container = el;
    } else {
      this.container = this.config.container;
    }

    // Initialize Mermaid
    this.initMermaid();
  }

  /**
   * Initialize Mermaid.js with configuration
   */
  private initMermaid(): void {
    try {
      mermaid.initialize({
        startOnLoad: false,
        theme: this.config.theme,
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true,
          curve: 'cardinal',
        },
        securityLevel: 'loose'
      });
    } catch (error) {
      console.error('Failed to initialize Mermaid.js:', error);
      throw new Error('Failed to initialize Mermaid.js');
    }
  }

  /**
   * Set the diagram data
   */
  public setData(data: DiagramData): void {
    this.currentDiagram = data;
  }

  /**
   * Convert diagram data to Mermaid syntax
   */
  private generateMermaidSyntax(): string {
    if (!this.currentDiagram) {
      return 'graph TD\n  A[No Data] --> B[Please set diagram data]';
    }

    const { nodes, edges } = this.currentDiagram; // Use edges
    let syntax = 'graph TD\n'; // Default Top-Down, can be adjusted

    // Add nodes
    nodes.forEach(node => {
      const shape = this.getNodeShape(node.type);
      const nodeLabel = node.label.replace(/"/g, '#quot;'); // Escape quotes for mermaid
      syntax += `  ${node.id}${shape}${nodeLabel}}\n`; // Use label
    });

    // Add relationships (edges)
    edges.forEach(edge => {
      const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
      const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
      const arrow = this.getRelationshipArrow(edge.direction, edge.type);
      const edgeLabel = edge.label ? `|${edge.label.replace(/"/g, '#quot;')}|` : ''; // Escape quotes
      syntax += `  ${sourceId} ${arrow}${edgeLabel} ${targetId}\n`;
    });

    // Add group subgraphs if they exist
    if (this.currentDiagram.groups && this.currentDiagram.groups.length > 0) {
      this.currentDiagram.groups.forEach(group => {
        syntax += `\n  subgraph ${group.id} [${group.name.replace(/"/g, '#quot;')}]
`;
        group.nodeIds.forEach(nodeId => {
          syntax += `    ${nodeId}\n`;
        });
        syntax += '  end\n';
      });
    }

    return syntax;
  }

  /**
   * Get the appropriate node shape based on agent type
   */
  private getNodeShape(type: string): string {
    switch (type.toLowerCase()) {
      case 'user':
        return '[/';
      case 'data':
        return '[('
      case 'processing':
        return '[>';
      case 'decision':
        return '{';
      default:
        return '[';
    }
  }

  /**
   * Get the appropriate arrow type for relationships
   */
  private getRelationshipArrow(direction?: string, type?: string): string { // Made optional
    let arrow = '--';
    
    // Handle direction
    if (direction === 'forward') {
      arrow += '>';
    } else if (direction === 'backward') {
      arrow = '<' + arrow;
    } else if (direction === 'bidirectional') {
      arrow = '<' + arrow + '>';
    } else {
      // Default to forward if direction is unspecified
      arrow += '>';
    }
    
    // Handle relationship type styling
    if (type === 'data-flow') {
      arrow = '===' + arrow.replace(/--/g, ''); // Thicker line for data
    } else if (type === 'control') {
      arrow = arrow.replace(/--/g, '-.-'); // Dashed line for control
    } else if (type === 'parallel') {
      arrow = '-.->'; // Mermaid dashed arrow
    } else if (type === 'conditional') {
      arrow = '==>'; // Mermaid thick arrow
    }
    
    return arrow;
  }

  /**
   * Render the diagram using Mermaid.js
   */
  private renderWithMermaid(): void {
    if (!this.currentDiagram) {
      this.container.innerHTML = '<div class="error">No diagram data</div>';
      return;
    }
    
    const { nodes, edges } = this.currentDiagram;
    
    // Generate a Mermaid diagram string
    let mermaidString = 'graph TD;\n';
    
    // Add nodes
    nodes.forEach(node => {
      const nodeId = node.id;
      const nodeLabel = node.label;
      const nodeType = node.type?.toLowerCase() || 'default';
      
      // Determine node style based on type
      let nodeStyle = '';
      switch (nodeType) {
        case 'agent':
          nodeStyle = 'class=agent';
          break;
        case 'tool':
          nodeStyle = 'class=tool';
          break;
        case 'input':
          nodeStyle = 'class=input';
          break;
        case 'output':
          nodeStyle = 'class=output';
          break;
        case 'user':
          nodeStyle = 'class=user';
          break;
        case 'data':
          nodeStyle = 'class=data';
          break;
        default:
          nodeStyle = 'class=default';
      }
      
      mermaidString += `  ${nodeId}["${nodeLabel}"] ${nodeStyle};\n`;
    });
    
    // Add edges
    edges.forEach(edge => {
      const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
      const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
      const edgeLabel = edge.label || '';
      
      let arrowStyle = '-->';
      if (edge.style?.bidirectional) {
        arrowStyle = '<-->';
      }
      
      mermaidString += `  ${sourceId} ${arrowStyle} ${targetId}["${edgeLabel}"];\n`;
    });
    
    // Add node styling
    mermaidString += `
      classDef agent fill:#4F46E5,stroke:#1E40AF,color:white;
      classDef tool fill:#059669,stroke:#047857,color:white;
      classDef input fill:#7C3AED,stroke:#5B21B6,color:white;
      classDef output fill:#DB2777,stroke:#BE185D,color:white;
      classDef user fill:#2563EB,stroke:#1D4ED8,color:white;
      classDef data fill:#F59E0B,stroke:#D97706,color:white;
      classDef default fill:#6B7280,stroke:#4B5563,color:white;
    `;
    
    // Create new container for mermaid
    const mermaidContainer = document.createElement('div');
    mermaidContainer.style.width = '100%';
    mermaidContainer.style.height = '100%';
    
    // Clear container and add mermaid div
    this.container.innerHTML = '';
    this.container.appendChild(mermaidContainer);
    
    // Initialize mermaid and render
    try {
      mermaid.initialize({
        startOnLoad: false,
        theme: this.config.theme === 'dark' ? 'dark' : 'default',
        flowchart: {
          htmlLabels: true,
          curve: 'basis'
        },
        securityLevel: 'loose' // Needed for click handling
      });
      
      mermaid.render('mermaid-diagram', mermaidString, (svgCode) => {
        mermaidContainer.innerHTML = svgCode;
      });
    } catch (error) {
      console.error('Error rendering Mermaid diagram:', error);
      mermaidContainer.innerHTML = `<div class="error">Error rendering diagram: ${error.message}</div>`;
    }
  }

  /**
   * Render the diagram using D3.js
   */
  private renderWithD3(): void {
    if (!this.currentDiagram) {
      this.container.innerHTML = '<div class="error">No diagram data</div>';
      return;
    }

    const { nodes, edges } = this.currentDiagram;
    
    // Clear the container
    this.container.innerHTML = '';
    
    const width = this.config.width || 800;
    const height = this.config.height || 600;

    // Create SVG element
    const svg = d3.select(this.container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('background-color', '#f9fafb'); // Light gray background

    // Add definitions for markers (arrowheads)
    const defs = svg.append('defs');
    defs.append('marker')
        .attr('id', 'arrowhead')
        .attr('viewBox', '-0 -5 10 10')
        .attr('refX', 25) // Adjust based on node radius + desired gap
        .attr('refY', 0)
        .attr('orient', 'auto')
        .attr('markerWidth', 8)
        .attr('markerHeight', 8)
        .attr('xoverflow', 'visible')
        .append('svg:path')
        .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
        .attr('fill', '#6b7280') // Default arrow color
        .style('stroke', 'none');

    // Create a group for zoom/pan
    const g = svg.append('g');
    
    // Add groups layer (if any groups exist)
    const groupsLayer = g.append('g').attr('class', 'groups');
    this.addGroupsToGraph(groupsLayer, this.currentDiagram.groups);

    // Create force simulation
    // Ensure edges source/target are IDs for simulation
    const linksForSimulation = edges.map(e => ({
        ...e,
        source: e.source,
        target: e.target
    }));

    this.simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink<DiagramNode, DiagramEdge>(linksForSimulation)
            .id(d => d.id)
            .distance(180)) // Increased distance
        .force('charge', d3.forceManyBody().strength(-600)) // Stronger repulsion
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(50)); // Prevent overlap

    // Draw links (edges) first
    const link = g.append('g')
        .attr('class', 'links')
        .selectAll('path')
        .data(edges)
        .enter()
        .append('path')
        .attr('stroke-width', 2)
        .attr('stroke', d => this.getEdgeColor(d.type))
        .attr('marker-end', 'url(#arrowhead)')
        .attr('fill', 'none')
        .attr('stroke-dasharray', d => d.type === 'parallel' ? '5,5' : null);

    // Draw nodes
    const node = g.append('g')
        .attr('class', 'nodes')
        .selectAll('g')
        .data(nodes)
        .enter()
        .append('g')
        .call(d3.drag<SVGGElement, DiagramNode>() // Type the drag behavior
            .on('start', this.dragstarted.bind(this))
            .on('drag', this.dragged.bind(this))
            .on('end', this.dragended.bind(this)));

    // Add node circles
    node.append('circle')
        .attr('r', 30) // Node radius
        .attr('fill', d => this.getNodeColor(d.type))
        .attr('stroke', d => d3.color(this.getNodeColor(d.type))?.darker(0.5).toString() || '#000')
        .attr('stroke-width', 2);

    // Add node labels (text)
    node.append('text')
        .text(d => d.label)
        .attr('x', 0)
        .attr('y', 0)
        .attr('dy', '.35em') // Center vertically
        .attr('text-anchor', 'middle') // Center horizontally
        .attr('fill', 'white')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .style('pointer-events', 'none'); // Prevent text interfering with drag
        
     // Add edge labels
    const edgeLabelGroup = g.append("g")
        .attr("class", "edge-labels")
        .selectAll("text")
        .data(edges.filter(e => e.label))
        .enter()
        .append("text")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("fill", "#374151") // gray-700
        .attr("font-size", "10px")
        .attr("font-weight", "medium")
        .style("pointer-events", "none") // Prevent interference
        .text(d => d.label || ''); // Provide default empty string if label is undefined

    // Add tooltips (titles) to nodes
    node.append('title')
        .text(d => `${d.label} (${d.type})${d.description ? '\n' + d.description : ''}`);

    // Update positions on simulation tick
    this.simulation.on('tick', () => {
        link.attr('d', d => {
            // Ensure source/target are node objects with positions
            const sx = (d.source as DiagramNode).x ?? 0;
            const sy = (d.source as DiagramNode).y ?? 0;
            const tx = (d.target as DiagramNode).x ?? 0;
            const ty = (d.target as DiagramNode).y ?? 0;

            // Simple straight line for now, adjust marker refX/Y if changing to curves
            return `M ${sx} ${sy} L ${tx} ${ty}`;
        });

        node.attr('transform', d => `translate(${d.x ?? 0}, ${d.y ?? 0})`);
        
        edgeLabelGroup.attr('transform', d => {
            const sx = (d.source as DiagramNode).x ?? 0;
            const sy = (d.source as DiagramNode).y ?? 0;
            const tx = (d.target as DiagramNode).x ?? 0;
            const ty = (d.target as DiagramNode).y ?? 0;
            return `translate(${(sx + tx) / 2}, ${(sy + ty) / 2})`;
        });
    });

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 4]) // Min/max zoom levels
        .on('zoom', (event) => {
            g.attr('transform', event.transform.toString());
        });

    svg.call(zoom);
  }

  // Drag handler functions
  private dragstarted(event: d3.D3DragEvent<SVGGElement, DiagramNode, any>, d: DiagramNode) {
    if (!event.active && this.simulation) this.simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  private dragged(event: d3.D3DragEvent<SVGGElement, DiagramNode, any>, d: DiagramNode) {
    d.fx = event.x;
    d.fy = event.y;
  }

  private dragended(event: d3.D3DragEvent<SVGGElement, DiagramNode, any>, d: DiagramNode) {
    if (!event.active && this.simulation) this.simulation.alphaTarget(0);
    // Optional: Allow node to settle naturally after drag
    // d.fx = null;
    // d.fy = null;
  }

  /**
   * Get node color based on agent type
   */
  private getNodeColor(type: string): string {
    switch (type?.toLowerCase()) { // Added null check
      case 'agent': return '#4F46E5'; // indigo-600
      case 'tool': return '#059669'; // emerald-600
      case 'input': return '#7C3AED'; // violet-600
      case 'output': return '#DB2777'; // pink-600
      case 'user': return '#2563EB'; // blue-600
      case 'data': return '#F59E0B'; // amber-500
      case 'decision': return '#DC2626'; // red-600
      default: return '#6B7280'; // gray-500
    }
  }
  
  /**
   * Get edge color based on edge type
   */
   private getEdgeColor(type?: string): string {
      switch (type?.toLowerCase()) {
         case 'control': return '#ef4444'; // red-500
         case 'data-flow': return '#22c55e'; // green-500
         case 'sequential': return '#3b82f6'; // blue-500
         case 'parallel': return '#10b981'; // emerald-500
         case 'conditional': return '#f59e0b'; // amber-500
         default: return '#6b7280'; // gray-500
      }
   }

  /**
   * Render the diagram with the current data
   */
  public async render(): Promise<void> {
    if (this.renderType === 'mermaid') {
      await this.renderWithMermaid();
    } else {
      this.renderWithD3();
    }
  }

  /**
   * Switch rendering mode between Mermaid and D3
   */
  public switchRenderer(type: 'mermaid' | 'd3'): void {
    this.renderType = type;
  }

  /**
   * Export the diagram as PNG
   */
  public exportAsPNG(): string {
    const svgElement = this.container.querySelector('svg');
    if (!svgElement) {
      throw new Error('No SVG element found to export');
    }

    // Create a canvas element
    const canvas = document.createElement('canvas');
    const svgSize = svgElement.getBoundingClientRect();
    canvas.width = (this.config.width || svgSize.width) * 2; // Increase resolution
    canvas.height = (this.config.height || svgSize.height) * 2;
    canvas.style.width = `${canvas.width / 2}px`;
    canvas.style.height = `${canvas.height / 2}px`;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(2, 2); // Scale context for higher resolution
    
    // Set background color (optional, defaults to transparent)
    ctx.fillStyle = '#ffffff'; // White background
    ctx.fillRect(0, 0, canvas.width / 2, canvas.height / 2);
    
    // Convert SVG to data URL and draw onto canvas
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const DOMURL = window.URL || window.webkitURL || window;
    const url = DOMURL.createObjectURL(svgBlob);
    
    const img = new Image();
    
    const promise = new Promise<string>((resolve, reject) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        DOMURL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = (err) => {
        DOMURL.revokeObjectURL(url);
        reject('Failed to load SVG image for PNG conversion');
      };
    });
    
    img.src = url;
    // This function now ideally returns a Promise<string>
    // For simplicity here, returning placeholder. Await promise outside.
    console.warn("exportAsPNG is async now, returning placeholder. Handle promise.");
    return "data:image/png;base64,..."; // Placeholder
  }

  /**
   * Export the diagram as SVG
   */
  public exportAsSVG(): string {
    const svgElement = this.container.querySelector('svg');
    if (!svgElement) {
      throw new Error('No SVG element found to export');
    }
    
    // Clone the SVG element to avoid modifying the original
    const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
    
    // Add XML namespace attributes for proper rendering
    svgClone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svgClone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");

    // Optionally add styles if they are not inline
    // Consider embedding styles if necessary
    
    const svgData = new XMLSerializer().serializeToString(svgClone);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const DOMURL = window.URL || window.webkitURL || window;
    
    return DOMURL.createObjectURL(svgBlob);
  }

  /**
   * Export the diagram as PDF (placeholder - would require PDF library)
   */
  public exportAsPDF(): void {
    // In a real implementation, this would use a PDF library
    console.warn('PDF export requires additional libraries');
    alert('PDF export not implemented in this version');
  }

  private addGroupsToGraph(groupsContainer: d3.Selection<SVGGElement, unknown, null, undefined>, groups?: DiagramGroup[]): void {
    if (!groups || !this.currentDiagram?.nodes) return;
    
    groups.forEach(group => {
      // Find nodes that belong to this group
      const groupNodeIds = group.nodes;
      const nodePositions = this.currentDiagram!.nodes
        .filter(node => groupNodeIds.includes(node.id))
        .map(node => ({
          x: node.x || 0,
          y: node.y || 0,
          r: 20 // Default node radius
        }));
      
      if (nodePositions.length === 0) return;
      
      // Calculate group bounds
      const padding = 20;
      const minX = Math.min(...nodePositions.map(p => p.x)) - padding;
      const minY = Math.min(...nodePositions.map(p => p.y)) - padding;
      const maxX = Math.max(...nodePositions.map(p => p.x + p.r)) + padding;
      const maxY = Math.max(...nodePositions.map(p => p.y + p.r)) + padding;
      
      // Draw group
      const rect = groupsContainer.append('rect')
        .attr('x', minX)
        .attr('y', minY)
        .attr('width', maxX - minX)
        .attr('height', maxY - minY)
        .attr('rx', 8)
        .attr('ry', 8)
        .attr('fill', group.style?.color || '#f0f0f0')
        .attr('fill-opacity', 0.2)
        .attr('stroke', '#ddd')
        .attr('stroke-width', 1);
      
      // Add label
      groupsContainer.append('text')
        .attr('x', minX + 10)
        .attr('y', minY + 20)
        .text(group.label)
        .attr('fill', '#666')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold');
    });
  }
}

/**
 * Helper function to lighten a color by percentage
 */
function lightenColor(color: string, percent: number): string {
  // Simple implementation for reference
  const num = parseInt(color.replace('#', ''), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + percent);
  const g = Math.min(255, ((num >> 8) & 0xff) + percent);
  const b = Math.min(255, (num & 0xff) + percent);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Helper function to darken a color by percentage
 */
function darkenColor(color: string, percent: number): string {
  // Simple implementation for reference
  const num = parseInt(color.replace('#', ''), 16);
  const r = Math.max(0, ((num >> 16) & 0xff) - percent);
  const g = Math.max(0, ((num >> 8) & 0xff) - percent);
  const b = Math.max(0, (num & 0xff) - percent);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
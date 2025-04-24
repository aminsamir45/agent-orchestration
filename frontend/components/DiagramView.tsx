import React, { useEffect, useRef, useState } from 'react';
// Import the service and types
import { DiagramService, DiagramData, DiagramNode, DiagramEdge, DiagramConfig } from '../lib/services/DiagramService';

// --- Unified Diagram Types ---
// Already defined in DiagramService.ts, potentially import from a shared location
// Re-exporting here for clarity within this component file, but could be removed
// if using shared types.
export type { DiagramNode, DiagramEdge, DiagramData };
// --- End of Unified Diagram Types ---

interface DiagramViewProps {
  diagramData: DiagramData;
  rendererType: 'mermaid' | 'd3';
  theme?: DiagramConfig['theme']; // Allow parent to pass theme
}

const DiagramView: React.FC<DiagramViewProps> = ({ diagramData, rendererType, theme }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [service, setService] = useState<DiagramService | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize and update service when container or renderer type changes
  useEffect(() => {
    if (!containerRef.current) return;

    try {
      // Create diagram service
      const newService = new DiagramService({
        container: containerRef.current,
        type: rendererType,
        theme: theme || 'default'
      });

      // Set diagram data
      newService.setData(diagramData);
      
      // Render the diagram
      newService.render();
      
      // Store service in state
      setService(newService);
      setError(null);

    } catch (err: any) {
      console.error('Error initializing diagram:', err);
      setError(`Failed to initialize diagram: ${err.message}`);
    }

    // No explicit cleanup needed
  }, [containerRef.current, rendererType, theme]);

  // Update diagram data when it changes
  useEffect(() => {
    if (!service) return;
    
    try {
      // Update diagram data
      service.setData(diagramData);
      
      // Re-render with updated data
      service.switchRenderer(rendererType);
      service.render();
      
    } catch (err: any) {
      console.error('Error updating diagram:', err);
      setError(`Failed to update diagram: ${err.message}`);
    }
  }, [diagramData, service]);

  // Handle diagram export
  const exportDiagram = (format: 'svg' | 'png') => {
    if (!service) {
      setError('Cannot export: Diagram service not initialized');
      return;
    }

    try {
      let dataUrl;

      if (format === 'svg') {
        dataUrl = service.exportAsSVG();
      } else {
        dataUrl = service.exportAsPNG();
      }

      // Create download link
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `diagram.${format}`;
      link.click();

    } catch (err: any) {
      console.error(`Error exporting diagram as ${format}:`, err);
      setError(`Failed to export diagram: ${err.message}`);
    }
  };

  // Helper function to get node color based on type (can be removed if not used directly)
  // Colors are now primarily handled within DiagramService
  const getNodeColor = (type?: string) => { 
    switch (type?.toLowerCase()) {
      case 'agent': return '#4F46E5';
      case 'tool': return '#059669';
      case 'input': return '#7C3AED'; 
      case 'output': return '#DB2777';
      case 'user': return '#2563EB'; 
      case 'data': return '#F59E0B'; 
      case 'decision': return '#DC2626';
      default: return '#6B7280';
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col">
      {error && (
        <div className="bg-red-100 text-red-700 p-2 rounded mb-2">
          {error}
        </div>
      )}
      
      {/* Node type legend */}
      <div className="absolute top-2 right-2 bg-white/80 dark:bg-gray-800/80 p-2 rounded shadow z-10 text-xs">
        <div className="text-sm font-bold mb-1">Node Types</div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center">
            <span className="w-3 h-3 inline-block bg-indigo-600 rounded-full mr-1"></span>
            <span>Agent</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 inline-block bg-emerald-600 rounded-full mr-1"></span>
            <span>Tool</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 inline-block bg-blue-600 rounded-full mr-1"></span>
            <span>User</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 inline-block bg-amber-500 rounded-full mr-1"></span>
            <span>Data</span>
          </div>
        </div>
      </div>
      
      {/* Export buttons */}
      <div className="absolute bottom-2 right-2 flex gap-2 z-10">
        <button 
          onClick={() => exportDiagram('svg')}
          className="bg-indigo-600 text-white px-3 py-1 rounded text-sm"
        >
          Export SVG
        </button>
        <button 
          onClick={() => exportDiagram('png')}
          className="bg-indigo-600 text-white px-3 py-1 rounded text-sm"
        >
          Export PNG
        </button>
      </div>
      
      {/* Diagram container */}
      <div 
        ref={containerRef} 
        className="flex-grow w-full border border-gray-200 dark:border-gray-700 rounded overflow-hidden"
      />
    </div>
  );
};

export default DiagramView; 
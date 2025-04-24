import React, { useState } from 'react';
// Now importing DiagramView which handles the actual rendering via DiagramService
import DiagramView, { DiagramData } from './DiagramView'; 
import { DiagramConfig } from '../lib/services/DiagramService'; // Keep config for theme type

interface OrchestrationDiagramProps {
  data: DiagramData;
  width?: number;
  height?: number;
  theme?: DiagramConfig['theme'];
  initialRenderer?: 'mermaid' | 'd3';
}

export default function OrchestrationDiagram({ 
  data, 
  width, 
  height = 400,
  theme = 'default',
  initialRenderer = 'd3'
}: OrchestrationDiagramProps) {
  const [renderer, setRenderer] = useState<'mermaid' | 'd3'>(initialRenderer);

  return (
    <div className="w-full">
      {/* Renderer selector */}
      <div className="mb-4 flex justify-end">
        <div className="inline-flex rounded-md shadow-sm">
          <button
            onClick={() => setRenderer('mermaid')}
            className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
              renderer === 'mermaid'
                ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Mermaid
          </button>
          <button
            onClick={() => setRenderer('d3')}
            className={`px-4 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
              renderer === 'd3'
                ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            D3 (Interactive)
          </button>
        </div>
      </div>

      {/* DiagramView will manage the actual rendering */}
      <DiagramView 
        diagramData={data} 
        rendererType={renderer}
        theme={theme}
      />
    </div>
  );
} 
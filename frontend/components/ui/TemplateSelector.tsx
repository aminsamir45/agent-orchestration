import { useState } from 'react';

interface Template {
  id: string;
  name: string;
  description: string;
  content: string;
}

interface TemplateSelectorProps {
  templates: Template[];
  onSelectTemplate: (template: Template) => void;
}

export default function TemplateSelector({ templates, onSelectTemplate }: TemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setIsOpen(false);
    onSelectTemplate(template);
  };

  return (
    <div className="relative">
      <button
        type="button"
        className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedTemplate ? selectedTemplate.name : 'Load template'}
        <svg
          className="-mr-1 ml-2 h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-full rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="template-button">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                role="menuitem"
              >
                <div className="font-medium">{template.name}</div>
                <div className="text-xs text-gray-500">{template.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 
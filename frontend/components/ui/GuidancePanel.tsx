import { useState } from 'react';

interface GuidancePanelProps {
  title: string;
  children: React.ReactNode;
}

export default function GuidancePanel({ title, children }: GuidancePanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white shadow sm:rounded-lg overflow-hidden">
      <div className="border-b border-gray-200">
        <button
          type="button"
          className="w-full p-4 flex items-center justify-between text-left focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="font-medium text-gray-900">{title}</span>
          <span className="ml-6 flex-shrink-0">
            <svg
              className={`h-5 w-5 transform transition-transform duration-200 ease-in-out ${isOpen ? 'rotate-180' : 'rotate-0'}`}
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
          </span>
        </button>
      </div>
      <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 overflow-y-auto' : 'max-h-0 overflow-hidden'}`}>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
} 
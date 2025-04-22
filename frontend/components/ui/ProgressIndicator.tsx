interface Step {
  id: number;
  name: string;
  description: string;
}

interface ProgressIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export default function ProgressIndicator({ steps, currentStep }: ProgressIndicatorProps) {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="space-y-4 md:flex md:space-y-0 md:space-x-8">
        {steps.map((step) => (
          <li key={step.id} className="md:flex-1">
            <div 
              className={`flex flex-col py-2 pl-4 border-l-4 ${
                step.id < currentStep
                  ? 'border-indigo-500 md:border-l-0 md:border-t-4'
                  : step.id === currentStep
                  ? 'border-indigo-500 md:border-l-0 md:border-t-4'
                  : 'border-gray-200 md:border-l-0 md:border-t-4'
              } md:pt-4 md:pb-0 md:pl-0`}
            >
              <span 
                className={`text-xs font-semibold uppercase tracking-wide ${
                  step.id < currentStep
                    ? 'text-indigo-600'
                    : step.id === currentStep
                    ? 'text-indigo-600'
                    : 'text-gray-500'
                }`}
              >
                {`Step ${step.id}`}
              </span>
              <span className="text-sm font-medium">
                {step.name}
              </span>
              <span className="text-xs text-gray-500 hidden md:inline">
                {step.description}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
} 
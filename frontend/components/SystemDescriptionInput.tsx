import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import FileUpload from './ui/FileUpload';
import GuidancePanel from './ui/GuidancePanel';
import TemplateSelector from './ui/TemplateSelector';

// Dynamic import for the markdown editor to avoid SSR issues
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then(mod => mod.default),
  { ssr: false }
);

const TEMPLATES = [
  {
    id: 'task-agent',
    name: 'Task Management Agent',
    description: 'An agent system for organizing and managing tasks with reminders',
    content: `# Task Management Agent System

I want to build an agent system that helps users manage their tasks and projects. The system should:

- Allow users to create, update, and delete tasks
- Support categorizing tasks by project or tag
- Send reminders based on due dates and priorities
- Integrate with calendar systems
- Use natural language for task creation and queries
- Learn from user behavior to suggest task prioritization
- Support both text and voice interfaces

The system should have components for understanding natural language, managing a task database, and generating notifications. I'd like it to work across devices and possibly integrate with existing productivity tools.`
  },
  {
    id: 'research-assistant',
    name: 'Research Assistant',
    description: 'An agent system for conducting research across multiple sources',
    content: `# Research Assistant Agent System

I need to build a research assistant agent system that can help with academic and professional research. The system should:

- Search and retrieve information from academic databases, websites, and PDFs
- Summarize articles and extract key insights
- Organize findings by topic and relevance
- Track citations and generate bibliographies
- Compare different viewpoints on a topic
- Identify research gaps or opportunities
- Generate questions for further investigation

The system should consist of multiple specialized agents for searching, reading, summarizing, and organizing. It should maintain context across research sessions and adapt to user feedback on relevance and quality.`
  },
  {
    id: 'customer-support',
    name: 'Customer Support Assistant',
    description: 'An agent system for handling customer inquiries and support tickets',
    content: `# Customer Support Assistant Agent System

I want to create an agent system for handling customer support inquiries. The system should:

- Understand and categorize incoming customer questions
- Retrieve relevant information from knowledge bases and documentation
- Generate accurate and helpful responses
- Escalate complex issues to human agents when necessary
- Learn from successful interactions to improve future responses
- Handle multiple languages
- Support both chat and email interfaces

The system should have components for intent classification, information retrieval, response generation, and learning from feedback. It should integrate with existing CRM systems and ticket management tools.`
  },
  {
    id: 'code-assistant',
    name: 'Coding Assistant',
    description: 'An agent system to help with software development tasks',
    content: `# Coding Assistant Agent System

I'd like to build an agent system that helps software developers with coding tasks. The system should:

- Understand code in multiple programming languages
- Answer questions about APIs and frameworks
- Generate code snippets based on natural language descriptions
- Debug issues by analyzing error messages and code
- Refactor code for improved performance or readability
- Explain complex code sections in plain language
- Suggest best practices and identify potential issues

The system should have specialized agents for different languages and frameworks, and be able to maintain context across a development session. It should integrate with common IDEs and development tools.`
  },
  {
    id: 'content-creator',
    name: 'Content Creation Assistant',
    description: 'An agent system for generating and editing various types of content',
    content: `# Content Creation Assistant Agent System

I need to build an agent system that helps with content creation across different formats. The system should:

- Generate blog posts, social media content, and email newsletters
- Edit and improve existing content for clarity and engagement
- Adapt content for different audiences and platforms
- Create accompanying visuals or suggest imagery
- Schedule content publication across platforms
- Analyze performance metrics and suggest improvements
- Maintain consistent brand voice and messaging

The system should include specialized agents for different content types, an editing agent, a scheduling agent, and an analytics agent. It should learn from user feedback and content performance data.`
  }
];

const MAX_CHARS = 5000;

interface SystemDescriptionInputProps {
  onSubmit: (description: string) => void;
}

export default function SystemDescriptionInput({ onSubmit }: SystemDescriptionInputProps) {
  const [description, setDescription] = useState<string>('');
  const [charCount, setCharCount] = useState(0);
  
  useEffect(() => {
    // Update character count when description changes
    setCharCount(description.length);
  }, [description]);
  
  const handleDescriptionChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      // Limit input to MAX_CHARS
      if (value.length <= MAX_CHARS) {
        setDescription(value);
      }
    }
  }, []);
  
  const handleUpload = useCallback((content: string) => {
    // Truncate content if it exceeds MAX_CHARS
    const truncated = content.substring(0, MAX_CHARS);
    setDescription(truncated);
  }, []);
  
  const handleTemplateSelect = useCallback((template: { content: string }) => {
    setDescription(template.content);
  }, []);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim()) {
      onSubmit(description);
    }
  };
  
  const charCountColor = 
    charCount > MAX_CHARS * 0.9 
      ? 'text-red-500' 
      : charCount > MAX_CHARS * 0.75 
        ? 'text-yellow-500' 
        : 'text-green-500';
        
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Describe Your Agent System</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            System Description
          </label>
          
          <div className="mb-2 flex flex-col sm:flex-row sm:justify-between sm:items-center">
            <p className="text-sm text-gray-500 mb-2 sm:mb-0">
              Provide a detailed description of the agent system you want to build.
            </p>
            
            <div className="flex space-x-4">
              <TemplateSelector 
                templates={TEMPLATES} 
                onSelectTemplate={handleTemplateSelect} 
              />
            </div>
          </div>
          
          <div data-color-mode="light">
            <MDEditor
              value={description}
              onChange={handleDescriptionChange}
              height={400}
              preview="edit"
            />
          </div>
          
          <div className="mt-2 flex justify-between items-center">
            <span className={`text-sm ${charCountColor}`}>
              {charCount}/{MAX_CHARS} characters
            </span>
            
            <FileUpload onUpload={handleUpload} />
          </div>
        </div>
        
        <div className="mt-6 mb-6">
          <GuidancePanel title="Tips for Effective Agent System Descriptions">
            <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600">
              <li><strong>Be specific about goals:</strong> Clearly define what you want your agent system to accomplish.</li>
              <li><strong>Describe user interactions:</strong> Explain how users will interact with the system and what they expect from it.</li>
              <li><strong>Outline key capabilities:</strong> List the main functions and capabilities needed.</li>
              <li><strong>Consider integrations:</strong> Mention any external systems or data sources it should connect with.</li>
              <li><strong>Define constraints:</strong> Note any limitations or requirements (e.g., privacy, speed, accessibility).</li>
              <li><strong>Provide examples:</strong> Include sample use cases or scenarios to illustrate your needs.</li>
            </ul>
          </GuidancePanel>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!description.trim() || charCount > MAX_CHARS}
            className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 ${
              !description.trim() || charCount > MAX_CHARS
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            }`}
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  );
} 
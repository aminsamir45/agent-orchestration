# Agent Orchestration App

A powerful application that helps users design and implement custom AI agent systems through a guided, interactive process. The app translates user requirements into visual diagrams and implementation details for orchestrating multiple AI agents.

## Key Features

- 🔄 **Guided Workflow**: Step-by-step process to define agent requirements
- 🤖 **AI-Powered Analysis**: Intelligent synthesis of user inputs using Gemini
- 🔍 **Tool Selection**: Interactive checklist for specifying required functionality
- 📊 **Diagram Generation**: Automatic creation of agent orchestration diagrams
- ▶️ **Execution Support**: Local execution of created agent systems
- 💾 **Local Storage**: Save and manage agent designs locally

## How It Works

1. **Describe Your System**: Input detailed description of the agentic system you want to build
2. **Review AI Synthesis**: Our AI analyzes your requirements
3. **Select Tools & Functionality**: Choose from a checklist of capabilities and tools
4. **Generate Diagram**: Our multi-agent backend creates a comprehensive orchestration diagram
5. **Run Your Agent**: Option to execute the designed system locally

## Technical Stack

- **Frontend**: React/Next.js with responsive design
- **Backend**: Node.js/Express.js
- **AI Integration**: Gemini API
- **Agent Frameworks**: LangChain, LangGraph, MCP
- **Visualization**: Dynamic diagram generation with interactive elements

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Gemini API key

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/agent-orchestration.git
   cd agent-orchestration
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with your API keys:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. Start the development server:
   ```
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`

## Usage Examples

### Creating a Document Retrieval Agent System

1. Describe your need: "I want to build an agent system that can search through my company documentation, answer questions, and continuously learn from user interactions."

2. Select tools: Knowledge retrieval, RAG, conversational capabilities, etc.

3. Generate an orchestration diagram showing how the different agents should interact.

4. Run locally to test with your own documents.

### Building a Multi-Agent Research Assistant

1. Describe your need: "I need a system with multiple specialized agents that help with research - one for searching academic papers, one for summarizing content, and one for generating insights."

2. Select tools: Web search, PDF parsing, text summarization, etc.

3. Generate an orchestration diagram that shows a hierarchical structure with a controller agent and specialist agents.

4. Run locally to test research capabilities.

## Project Structure

```
agent-orchestration/
├── public/
│   └── assets/
├── src/
│   ├── components/
│   │   ├── AgentDesigner/
│   │   ├── DiagramViewer/
│   │   └── ToolSelector/
│   ├── pages/
│   ├── services/
│   │   ├── ai/
│   │   ├── orchestration/
│   │   └── storage/
│   └── utils/
├── scripts/
├── .env
├── package.json
└── README.md
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by the growing need for simplified agent orchestration
- Built with the power of Gemini, LangChain, and LangGraph
- Special thanks to all contributors
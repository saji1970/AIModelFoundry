import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Button,
  Alert,
  List,
  ListItem,
  ListItemText,
  TextField,
  IconButton,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  SmartToy as AIIcon,
  Send as SendIcon,
  Code as CodeIcon,
  AutoFixHigh as AutoFixIcon,
  Help as HelpIcon,
  Close as CloseIcon,
  Terminal as TerminalIcon,
} from '@mui/icons-material';
import MonacoEditor from '../editor/MonacoEditor';
import { useTheme } from '@mui/material/styles';

interface CodePlaygroundProps {
  initialModel?: string | null;
  initialAgent?: string | null;
  projectId?: string | null;
  userRole?: 'owner' | 'admin' | 'collaborator' | 'viewer';
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const CodePlayground: React.FC<CodePlaygroundProps> = ({ initialModel, initialAgent, projectId, userRole }) => {
  const [language, setLanguage] = useState('python');
  const [monacoTheme, setMonacoTheme] = useState('vs-dark');
  const [code, setCode] = useState(`# Welcome to the AI Model Foundry Code Playground!

# This playground supports various AI/ML frameworks and languages
# Choose from the dropdown to explore different examples:

# - Python: Basic PyTorch neural network
# - JavaScript/TypeScript: Simple neural network implementation
# - Java: Neural network in Java
# - LangChain + FastAPI: General-purpose web agent
# - AutoGen + CrewAI: Multi-agent reasoning system
# - Haystack: Search and document Q&A pipeline
# - OpenAgents: Full UI + backend agent framework
# - ChatGPT: OpenAI API integration with conversation history
# - Google Gemini: Multi-modal AI with vision and code generation
# - DeepSeek: Advanced AI model with code analysis capabilities
# - Dust.tt: AI Agent Platform for creating and deploying agents

# Current example: Python with PyTorch
import torch
import torch.nn as nn

class SimpleModel(nn.Module):
    def __init__(self, input_size, hidden_size, output_size):
        super(SimpleModel, self).__init__()
        self.layer1 = nn.Linear(input_size, hidden_size)
        self.layer2 = nn.Linear(hidden_size, output_size)
        self.relu = nn.ReLU()
    
    def forward(self, x):
        x = self.relu(self.layer1(x))
        x = self.layer2(x)
        return x

# Example usage
model = SimpleModel(input_size=10, hidden_size=64, output_size=1)
print("Model created successfully!")

# You can experiment with different AI/ML code here
def train_model(model, data_loader, epochs=10):
    criterion = nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters())
    
    for epoch in range(epochs):
        for batch_x, batch_y in data_loader:
            optimizer.zero_grad()
            outputs = model(batch_x)
            loss = criterion(outputs, batch_y)
            loss.backward()
            optimizer.step()
        
        print(f"Epoch {epoch+1}/{epochs}, Loss: {loss.item():.4f}")

print("Training function defined!")
print("Try switching to different frameworks and models using the dropdown above!")`);

  const [output, setOutput] = useState('');
  const [aiModel, setAiModel] = useState('chatgpt');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'output' | 'terminal'>('editor');
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildCommand, setBuildCommand] = useState<string>('');
  const [editBuildCommand, setEditBuildCommand] = useState<string>('');
  const [isEditingBuild, setIsEditingBuild] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);

  const theme = useTheme();

  const languageOptions = [
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
  ];

  useEffect(() => {
    // Set initial code based on props if provided
    if (initialModel) {
      setLanguage('python');
      setCode(`# Model: ${initialModel}
# This is your model code playground
# You can develop and test your model implementation here

import numpy as np
import torch
from transformers import AutoModel, AutoTokenizer

class ${initialModel.replace(/[^a-zA-Z0-9]/g, '')}Model:
    def __init__(self):
        self.model = None
        self.tokenizer = None
        
    def load_model(self):
        # Load your model here
        pass
        
    def predict(self, input_data):
        # Implement your prediction logic
        pass
        
    def train(self, training_data):
        # Implement your training logic
        pass

# Example usage
model = ${initialModel.replace(/[^a-zA-Z0-9]/g, '')}Model()
model.load_model()
`);
    } else if (initialAgent) {
      setLanguage('python');
      setCode(`# Agent: ${initialAgent}
# This is your AI agent code playground
# You can develop and test your agent implementation here

from typing import List, Dict, Any
import openai
import json

class ${initialAgent.replace(/[^a-zA-Z0-9]/g, '')}Agent:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.client = openai.OpenAI(api_key=api_key)
        
    def process_input(self, user_input: str) -> str:
        # Implement your agent's processing logic
        response = self.client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful AI assistant."},
                {"role": "user", "content": user_input}
            ]
        )
        return response.choices[0].message.content
        
    def execute_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        # Implement task execution logic
        pass
        
    def learn_from_feedback(self, feedback: str):
        # Implement learning mechanism
        pass

# Example usage
agent = ${initialAgent.replace(/[^a-zA-Z0-9]/g, '')}Agent("your-api-key-here")
result = agent.process_input("Hello, how can you help me?")
print(result)
`);
    }

    // Fetch build command if projectId is provided
    if (projectId) {
      fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/api/projects/${projectId}/build-command`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      })
        .then(res => res.json())
        .then(data => {
          setBuildCommand(data.build_command || '');
          setEditBuildCommand(data.build_command || '');
        });
    }
  }, [initialModel, initialAgent, projectId]);

  const handleRunCode = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8001'}/playground/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: code,
          language: language,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
    setOutput(`Running ${language} code...
    
Output:
${data.output}`);
        } else {
          setOutput(`Running ${language} code...

Error:
${data.error}

Output:
${data.output}`);
        }
      } else {
        const errorData = await response.json();
        setOutput(`Error executing code:
${errorData.error}`);
      }
    } catch (error) {
      setOutput(`Network error: Could not reach backend. Please check if the backend is running.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAIChat = async () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8001'}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: chatInput,
          context: code,
          language: language,
          model: aiModel,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
        };
        setChatMessages(prev => [...prev, assistantMessage]);
      } else {
        const errorMessage: ChatMessage = {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        };
        setChatMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAIGenerate = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8001'}/ai/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: `Generate ${language} code for: ${chatInput}`,
          language: language,
          model: aiModel,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCode(data.code);
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: `Generated code:\n\`\`\`${language}\n${data.code}\n\`\`\``,
          timestamp: new Date(),
        };
        setChatMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('AI generation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleAIChat();
    }
  };

  const getLanguageCode = (lang: string) => {
    const codeExamples = {
      python: `# Python Example
import torch
import torch.nn as nn

class SimpleModel(nn.Module):
    def __init__(self, input_size, hidden_size, output_size):
        super(SimpleModel, self).__init__()
        self.layer1 = nn.Linear(input_size, hidden_size)
        self.layer2 = nn.Linear(hidden_size, output_size)
        self.relu = nn.ReLU()
    
    def forward(self, x):
        x = self.relu(self.layer1(x))
        x = self.layer2(x)
        return x

model = SimpleModel(input_size=10, hidden_size=64, output_size=1)
print("Model created successfully!")`,
      
      javascript: `// JavaScript Example
class SimpleModel {
    constructor(inputSize, hiddenSize, outputSize) {
        this.inputSize = inputSize;
        this.hiddenSize = hiddenSize;
        this.outputSize = outputSize;
        this.weights1 = this.initializeWeights(inputSize, hiddenSize);
        this.weights2 = this.initializeWeights(hiddenSize, outputSize);
    }
    
    initializeWeights(rows, cols) {
        return Array.from({length: rows}, () => 
            Array.from({length: cols}, () => Math.random() - 0.5)
        );
    }
    
    forward(input) {
        const hidden = this.relu(this.multiply(input, this.weights1));
        return this.multiply(hidden, this.weights2);
    }
    
    relu(x) {
        return x.map(val => Math.max(0, val));
    }
    
    multiply(a, b) {
        // Simple matrix multiplication
        return a.map(row => 
            b[0].map((_, colIndex) => 
                row.reduce((sum, val, rowIndex) => 
                    sum + val * b[rowIndex][colIndex], 0
                )
            )
        );
    }
}

const model = new SimpleModel(10, 64, 1);
console.log("Model created successfully!");`,
      
      typescript: `// TypeScript Example
interface ModelConfig {
    inputSize: number;
    hiddenSize: number;
    outputSize: number;
}

class SimpleModel {
    private weights1: number[][];
    private weights2: number[][];
    
    constructor(config: ModelConfig) {
        this.weights1 = this.initializeWeights(config.inputSize, config.hiddenSize);
        this.weights2 = this.initializeWeights(config.hiddenSize, config.outputSize);
    }
    
    private initializeWeights(rows: number, cols: number): number[][] {
        return Array.from({length: rows}, () => 
            Array.from({length: cols}, () => Math.random() - 0.5)
        );
    }
    
    public forward(input: number[]): number[] {
        const hidden = this.relu(this.multiply(input, this.weights1));
        return this.multiply(hidden, this.weights2);
    }
    
    private relu(x: number[]): number[] {
        return x.map(val => Math.max(0, val));
    }
    
    private multiply(a: number[], b: number[][]): number[] {
        return b[0].map((_, colIndex) => 
            a.reduce((sum, val, rowIndex) => 
                sum + val * b[rowIndex][colIndex], 0
            )
        );
    }
}

const model = new SimpleModel({inputSize: 10, hiddenSize: 64, outputSize: 1});
console.log("Model created successfully!");`,
      
      java: `// Java Example
import java.util.*;

public class SimpleModel {
    private double[][] weights1;
    private double[][] weights2;
    
    public SimpleModel(int inputSize, int hiddenSize, int outputSize) {
        this.weights1 = initializeWeights(inputSize, hiddenSize);
        this.weights2 = initializeWeights(hiddenSize, outputSize);
    }
    
    private double[][] initializeWeights(int rows, int cols) {
        double[][] weights = new double[rows][cols];
        Random random = new Random();
        for (int i = 0; i < rows; i++) {
            for (int j = 0; j < cols; j++) {
                weights[i][j] = random.nextDouble() - 0.5;
            }
        }
        return weights;
    }
    
    public double[] forward(double[] input) {
        double[] hidden = relu(multiply(input, weights1));
        return multiply(hidden, weights2);
    }
    
    private double[] relu(double[] x) {
        double[] result = new double[x.length];
        for (int i = 0; i < x.length; i++) {
            result[i] = Math.max(0, x[i]);
        }
        return result;
    }
    
    private double[] multiply(double[] a, double[][] b) {
        double[] result = new double[b[0].length];
        for (int j = 0; j < b[0].length; j++) {
            for (int i = 0; i < a.length; i++) {
                result[j] += a[i] * b[i][j];
            }
        }
        return result;
    }
    
    public static void main(String[] args) {
        SimpleModel model = new SimpleModel(10, 64, 1);
        System.out.println("Model created successfully!");
    }
}`,
      
      langchain: `# LangChain + FastAPI Example
from langchain.agents import initialize_agent, Tool
from langchain.llms import OpenAI
from langchain.tools import DuckDuckGoSearchRun
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os

# Initialize FastAPI app
app = FastAPI(title="AI Agent API")

# Initialize LangChain components
llm = OpenAI(temperature=0)
search = DuckDuckGoSearchRun()

# Define tools
tools = [
    Tool(
        name="Search",
        func=search.run,
        description="Useful for searching the internet for current information"
    )
]

# Initialize agent
agent = initialize_agent(tools, llm, agent="zero-shot-react-description", verbose=True)

# API Models
class QueryRequest(BaseModel):
    query: str

class QueryResponse(BaseModel):
    response: str

@app.post("/query", response_model=QueryResponse)
async def process_query(request: QueryRequest):
    try:
        result = agent.run(request.query)
        return QueryResponse(response=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)`,
      
      autogen: `# AutoGen + CrewAI Example
from crewai import Agent, Task, Crew, Process
from langchain.tools import DuckDuckGoSearchRun
from langchain.llms import OpenAI
import os

# Initialize tools and LLM
search_tool = DuckDuckGoSearchRun()
llm = OpenAI(temperature=0.7)

# Create specialized agents
researcher = Agent(
    role='Research Analyst',
    goal='Conduct thorough research on given topics',
    backstory='Expert at finding and analyzing information',
    tools=[search_tool],
    llm=llm,
    verbose=True
)

writer = Agent(
    role='Content Writer',
    goal='Create engaging and informative content',
    backstory='Skilled writer with expertise in various domains',
    tools=[],
    llm=llm,
    verbose=True
)

reviewer = Agent(
    role='Content Reviewer',
    goal='Review and improve content quality',
    backstory='Experienced editor with attention to detail',
    tools=[],
    llm=llm,
    verbose=True
)

# Define tasks
research_task = Task(
    description="Research the latest developments in AI and machine learning",
    agent=researcher
)

writing_task = Task(
    description="Write a comprehensive article based on the research",
    agent=writer
)

review_task = Task(
    description="Review and improve the article for clarity and accuracy",
    agent=reviewer
)

# Create crew
crew = Crew(
    agents=[researcher, writer, reviewer],
    tasks=[research_task, writing_task, review_task],
    process=Process.sequential
)

# Execute the crew
result = crew.kickoff()
print("Crew execution result:", result)`,
      
      haystack: `# Haystack Example
from haystack import Pipeline
from haystack.nodes import BM25Retriever, PromptNode, PromptTemplate
from haystack.document_stores import InMemoryDocumentStore
from haystack.schema import Document
import os

# Initialize document store
document_store = InMemoryDocumentStore(use_bm25=True)

# Add sample documents
documents = [
    Document(content="Python is a programming language known for its simplicity and readability."),
    Document(content="Machine learning is a subset of artificial intelligence."),
    Document(content="Deep learning uses neural networks with multiple layers."),
    Document(content="Natural language processing helps computers understand human language.")
]

document_store.write_documents(documents)

# Initialize retriever
retriever = BM25Retriever(document_store=document_store, top_k=2)

# Create prompt template
qa_template = PromptTemplate(
    prompt="Given the context, answer the question. Context: {join(documents)}; Question: {query}; Answer:",
    output_parser=None
)

# Initialize prompt node
prompt_node = PromptNode(
    model_name_or_path="gpt2",
    default_prompt_template=qa_template,
    model_kwargs={"max_length": 100}
)

# Create pipeline
qa_pipeline = Pipeline()
qa_pipeline.add_node(component=retriever, name="Retriever", inputs=["Query"])
qa_pipeline.add_node(component=prompt_node, name="PromptNode", inputs=["Retriever"])

# Example query
query = "What is machine learning?"
result = qa_pipeline.run(query=query)
print("Answer:", result["answers"][0].answer)`,
      
      openagents: `# OpenAgents Example
from openagents import Agent, Environment, Message
from openagents.tools import WebSearchTool, CalculatorTool
import asyncio

# Define a custom agent
class ResearchAgent(Agent):
    def __init__(self):
        super().__init__()
        self.tools = [WebSearchTool(), CalculatorTool()]
    
    async def process_message(self, message: Message) -> Message:
        # Process incoming message
        content = message.content
        
        # Use tools based on message content
        if "search" in content.lower():
            search_result = await self.tools[0].execute(content)
            return Message(content=f"Search result: {search_result}")
        elif "calculate" in content.lower():
            calc_result = await self.tools[1].execute(content)
            return Message(content=f"Calculation result: {calc_result}")
        else:
            return Message(content="I can help you search or calculate. What would you like to do?")

# Create environment
env = Environment()

# Add agent to environment
agent = ResearchAgent()
env.add_agent(agent)

# Example usage
async def main():
    # Send a message to the agent
    message = Message(content="Search for latest AI developments")
    response = await env.send_message(message, agent.id)
    print("Agent response:", response.content)

# Run the example
asyncio.run(main())`,
      
      chatgpt: `# ChatGPT Integration Example
import openai
from typing import List, Dict, Any
import json

class ChatGPTAgent:
    def __init__(self, api_key: str):
        self.client = openai.OpenAI(api_key=api_key)
        self.conversation_history = []
    
    def add_message(self, role: str, content: str):
        """Add a message to conversation history"""
        self.conversation_history.append({
            "role": role,
            "content": content
        })
    
    def get_response(self, user_message: str, model: str = "gpt-3.5-turbo") -> str:
        """Get response from ChatGPT"""
        # Add user message to history
        self.add_message("user", user_message)
        
        try:
            response = self.client.chat.completions.create(
                model=model,
                messages=self.conversation_history,
                max_tokens=1000,
                temperature=0.7
            )
            
            assistant_message = response.choices[0].message.content
            self.add_message("assistant", assistant_message)
            
            return assistant_message
            
        except Exception as e:
            return f"Error: {str(e)}"
    
    def clear_history(self):
        """Clear conversation history"""
        self.conversation_history = []
    
    def get_history(self) -> List[Dict[str, str]]:
        """Get conversation history"""
        return self.conversation_history

# Example usage
agent = ChatGPTAgent("your-openai-api-key")

# Start a conversation
response1 = agent.get_response("Hello! Can you help me with Python programming?")
print("ChatGPT:", response1)

response2 = agent.get_response("How do I create a simple neural network?")
print("ChatGPT:", response2)

# Get conversation history
history = agent.get_history()
print("Conversation history:", json.dumps(history, indent=2))`,
      
      gemini: `# Google Gemini Integration Example
import google.generativeai as genai
from typing import List, Dict, Any
import base64
from PIL import Image
import io

class GeminiAgent:
    def __init__(self, api_key: str):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-pro')
        self.vision_model = genai.GenerativeModel('gemini-pro-vision')
    
    def generate_text(self, prompt: str) -> str:
        """Generate text response using Gemini"""
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"Error: {str(e)}"
    
    def analyze_image(self, image_path: str, prompt: str = "Describe this image") -> str:
        """Analyze image using Gemini Vision"""
        try {
            # Load and encode image
            with open(image_path, "rb") as img_file:
                img_data = img_file.read()
            
            image = Image.open(io.BytesIO(img_data))
            
            response = self.vision_model.generate_content([prompt, image])
            return response.text
        except Exception as e:
            return f"Error analyzing image: {str(e)}"
    
    def generate_code(self, description: str, language: str = "python") -> str:
        """Generate code based on description"""
        prompt = f"Generate {language} code for: {description}"
        return self.generate_text(prompt)
    
    def multi_modal_chat(self, text: str, image_path: str = None) -> str:
        """Multi-modal chat with text and optional image"""
        try {
            if image_path:
                with open(image_path, "rb") as img_file:
                    img_data = img_file.read()
                image = Image.open(io.BytesIO(img_data))
                response = self.vision_model.generate_content([text, image])
            else:
                response = self.model.generate_content(text)
            
            return response.text
        except Exception as e:
            return f"Error: {str(e)}"

# Example usage
agent = GeminiAgent("your-gemini-api-key")

# Text generation
text_response = agent.generate_text("Explain quantum computing in simple terms")
print("Gemini Text:", text_response)

# Code generation
code_response = agent.generate_code("Create a function to sort a list", "python")
print("Generated Code:", code_response)

# Image analysis (if you have an image file)
// image_response = agent.analyze_image("path/to/image.jpg", "What's in this image?")
// print("Image Analysis:", image_response)`,
      
      deepseek: `# DeepSeek Integration Example
import requests
import json
from typing import List, Dict, Any

class DeepSeekAgent:
    def __init__(self, api_key: str, base_url: str = "https://api.deepseek.com"):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    def chat_completion(self, messages: List[Dict[str, str]], model: str = "deepseek-chat") -> str:
        """Get chat completion from DeepSeek"""
        try {
            payload = {
                "model": model,
                "messages": messages,
                "max_tokens": 1000,
                "temperature": 0.7
            }
            
            response = requests.post(
                f"{self.base_url}/v1/chat/completions",
                headers=self.headers,
                json=payload
            )
            
            if response.status_code == 200:
                return response.json()["choices"][0]["message"]["content"]
            else:
                return f"Error: {response.status_code} - {response.text}"
                
        except Exception as e:
            return f"Error: {str(e)}"
    
    def code_analysis(self, code: str, analysis_type: str = "general") -> str:
        """Analyze code using DeepSeek"""
        messages = [
            {
                "role": "system",
                "content": f"You are an expert code analyst. Analyze the following code and provide {analysis_type} feedback."
            },
            {
                "role": "user",
                "content": f"Please analyze this code:\n\n{code}"
            }
        ]
        
        return self.chat_completion(messages)
    
    def code_generation(self, description: str, language: str = "python") -> str:
        """Generate code based on description"""
        messages = [
            {
                "role": "system",
                "content": f"You are an expert {language} programmer. Generate clean, efficient code."
            },
            {
                "role": "user",
                "content": f"Generate {language} code for: {description}"
            }
        ]
        
        return self.chat_completion(messages)
    
    def bug_fixing(self, code: str, error_message: str = "") -> str:
        """Fix bugs in code"""
        messages = [
            {
                "role": "system",
                "content": "You are an expert debugger. Fix the bugs in the provided code."
            },
            {
                "role": "user",
                "content": f"Fix the bugs in this code:\n\n{code}\n\nError: {error_message}"
            }
        ]
        
        return self.chat_completion(messages)

# Example usage
agent = DeepSeekAgent("your-deepseek-api-key")

# Chat completion
response = agent.chat_completion([
    {"role": "user", "content": "Explain machine learning algorithms"}
])
print("DeepSeek Response:", response)

# Code analysis
code_to_analyze = '''
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)
'''

analysis = agent.code_analysis(code_to_analyze, "performance")
print("Code Analysis:", analysis)

# Code generation
generated_code = agent.code_generation("Create a function to find the maximum element in a list")
print("Generated Code:", generated_code)`,
      
      dusttt: `# Dust.tt Integration Example
import requests
import json
from typing import List, Dict, Any

class DustTTClient:
    def __init__(self, api_key: str, base_url: str = "https://dust.tt/api/v1"):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    def create_agent(self, name: str, description: str, instructions: str) -> Dict[str, Any]:
        """Create a new agent"""
        try {
            payload = {
                "name": name,
                "description": description,
                "instructions": instructions
            }
            
            response = requests.post(
                f"{self.base_url}/agents",
                headers=self.headers,
                json=payload
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"Failed to create agent: {response.status_code}"}
                
        except Exception as e:
            return {"error": f"Error creating agent: {str(e)}"}
    
    def list_agents(self) -> List[Dict[str, Any]]:
        """List all available agents"""
        try {
            response = requests.get(
                f"{self.base_url}/agents",
                headers=self.headers
            )
            
            if response.status_code == 200:
                return response.json()["agents"]
            else:
                return []
                
        except Exception as e:
            return []
    
    def run_agent(self, agent_id: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Run an agent with input data"""
        try {
            payload = {
                "agent_id": agent_id,
                "input": input_data
            }
            
            response = requests.post(
                f"{self.base_url}/runs",
                headers=self.headers,
                json=payload
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"Failed to run agent: {response.status_code}"}
                
        except Exception as e:
            return {"error": f"Error running agent: {str(e)}"}
    
    def get_run_status(self, run_id: str) -> Dict[str, Any]:
        """Get the status of a run"""
        try {
            response = requests.get(
                f"{self.base_url}/runs/{run_id}",
                headers=self.headers
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"Failed to get run status: {response.status_code}"}
                
        except Exception as e:
            return {"error": f"Error getting run status: {str(e)}"}
    
    def create_dataset(self, name: str, description: str, data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Create a dataset for training"""
        try {
            payload = {
                "name": name,
                "description": description,
                "data": data
            }
            
            response = requests.post(
                f"{self.base_url}/datasets",
                headers=self.headers,
                json=payload
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"Failed to create dataset: {response.status_code}"}
                
        except Exception as e:
            return {"error": f"Error creating dataset: {str(e)}"}
    
    def deploy_agent(self, agent_id: str, deployment_name: str) -> Dict[str, Any]:
        """Deploy an agent for production use"""
        try {
            payload = {
                "name": deployment_name,
                "agent_id": agent_id
            }
            
            response = requests.post(
                f"{self.base_url}/deployments",
                headers=self.headers,
                json=payload
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"Failed to deploy agent: {response.status_code}"}
                
        except Exception as e:
            return {"error": f"Error deploying agent: {str(e)}"}

# Example usage
dust_client = DustTTClient("your-dust-tt-api-key")

# Create a data analysis agent
agent_config = {
    "name": "Data Analysis Agent",
    "description": "An agent that analyzes data and provides insights",
    "instructions": """You are a data analysis expert. When given data, you should:
    1. Analyze the data structure and content
    2. Identify patterns and trends
    3. Provide actionable insights
    4. Suggest visualizations if appropriate
    5. Highlight any anomalies or issues"""
}

# Create the agent
agent_result = dust_client.create_agent(**agent_config)
print(f"Agent created: {agent_result}")

# List available agents
agents = dust_client.list_agents()
print(f"Available agents: {len(agents)}")

# Example data for analysis
sample_data = {
    "dataset": [
        {"month": "Jan", "sales": 1000, "customers": 50},
        {"month": "Feb", "sales": 1200, "customers": 60},
        {"month": "Mar", "sales": 1100, "customers": 55},
        {"month": "Apr", "sales": 1400, "customers": 70}
    ],
    "analysis_type": "trend_analysis"
}

# Run the agent (if we have an agent_id)
if "id" in agent_result:
    run_result = dust_client.run_agent(agent_result["id"], sample_data)
    print(f"Agent run result: {run_result}")

print("Dust.tt integration initialized successfully!")`,
    };
    
    return codeExamples[lang as keyof typeof codeExamples] || codeExamples.python;
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    setCode(getLanguageCode(newLanguage));
  };

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleSaveBuildCommand = async () => {
    if (!projectId) return;
    setBuildError(null);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/api/projects/${projectId}/build-command`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ build_command: editBuildCommand })
      });
      if (res.ok) {
        setBuildCommand(editBuildCommand);
        setIsEditingBuild(false);
      } else {
        const data = await res.json();
        setBuildError(data.error || 'Failed to save build command');
      }
    } catch (e) {
      setBuildError('Failed to save build command');
    }
  };

  const handleBuildProject = async () => {
    setIsBuilding(true);
    setBuildError(null);
    if (projectId) {
      setTerminalOutput((prev) => [...prev, `$ build_project`]);
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/api/projects/${projectId}/build`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        });
        const data = await res.json();
        setTerminalOutput((prev) => [...prev, data.output || '', data.error ? `Error: ${data.error}` : '']);
        setIsBuilding(false);
        setActiveTab('terminal');
      } catch (e) {
        setTerminalOutput((prev) => [...prev, 'Build failed.']);
        setIsBuilding(false);
      }
    } else {
      // fallback to old logic
      setTerminalOutput((prev) => [...prev, '$ build_project (simulated)']);
      setTimeout(() => {
        setTerminalOutput((prev) => [...prev, 'Build completed successfully!']);
        setIsBuilding(false);
        setActiveTab('terminal');
      }, 1500);
    }
  };

  const handleTerminalCommand = async () => {
    if (!terminalInput.trim()) return;
    setTerminalOutput((prev) => [...prev, `$ ${terminalInput}`]);
    if (projectId) {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/api/projects/${projectId}/terminal`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: terminalInput })
        });
        const data = await res.json();
        setTerminalOutput((prev) => [...prev, data.output || '', data.error ? `Error: ${data.error}` : '']);
      } catch (e) {
        setTerminalOutput((prev) => [...prev, 'Terminal command failed.']);
      }
    } else {
      setTimeout(() => {
        setTerminalOutput((prev) => [...prev, `Output for: ${terminalInput}`]);
      }, 1000);
    }
    setTerminalInput('');
  };

  const handleClearTerminal = () => setTerminalOutput([]);

  // Helper to color output lines
  const renderOutput = (output: string) => {
    if (!output) return 'Click "Run Code" to see the output here...';
    return output.split('\n').map((line, idx) => {
      if (/^Error/i.test(line)) {
        return <Box key={idx} sx={{ color: theme.palette.error.main, fontWeight: 600 }}>{line}</Box>;
      } else if (/^Output/i.test(line)) {
        return <Box key={idx} sx={{ color: theme.palette.info.main, fontWeight: 600 }}>{line}</Box>;
      } else if (/^Success/i.test(line)) {
        return <Box key={idx} sx={{ color: theme.palette.success.main, fontWeight: 600 }}>{line}</Box>;
      } else {
        return <Box key={idx} component="span">{line}\n</Box>;
      }
    });
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography component="h1" variant="h4" align="center" gutterBottom sx={{ fontWeight: 700, letterSpacing: 1 }}>
        AI Model Foundry Code Playground
      </Typography>
      <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
        Experiment with AI/ML code using Monaco Editor with AI assistance
      </Typography>
      <Grid container spacing={3}>
        {/* Code Editor Section */}
        <Grid item xs={12} md={7}>
          <Paper elevation={4} sx={{
            p: { xs: 1, sm: 2, md: 3 },
            borderRadius: 3,
            boxShadow: theme.shadows[4],
            bgcolor: theme.palette.mode === 'dark' ? '#181c24' : '#f8fafc',
            transition: 'background 0.3s',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Button variant="contained" color="primary" onClick={handleRunCode} disabled={isLoading} startIcon={<CodeIcon />}>
                Run
              </Button>
              <Button variant="outlined" color="primary" onClick={handleSave} disabled={isLoading}>
                Save
              </Button>
              <Button variant="outlined" color="primary" disabled={isLoading} sx={{ ml: 0 }}>
                Save As
              </Button>
              <Button variant="contained" color="success" onClick={handleBuildProject} disabled={isBuilding} startIcon={<AutoFixIcon />}>
                {isBuilding ? 'Building...' : 'Build Project'}
              </Button>
              <Button variant={activeTab === 'terminal' ? 'contained' : 'outlined'} color="secondary" onClick={() => setActiveTab('terminal')} startIcon={<TerminalIcon />}>
                Terminal
              </Button>
            </Box>
            <Box sx={{
              border: `2px solid ${theme.palette.divider}`,
              borderRadius: 2,
              overflow: 'hidden',
              boxShadow: theme.shadows[1],
              transition: 'border 0.3s',
              background: theme.palette.mode === 'dark' ? '#23272f' : '#fff',
            }}>
              <MonacoEditor
                value={code}
                onChange={(value) => setCode(value || '')}
                language={language}
                theme={monacoTheme}
                height="500px"
              />
            </Box>
            {saveSuccess && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Code saved successfully!
              </Alert>
            )}
          </Paper>
        </Grid>
        {/* AI Assistant Section */}
        <Grid item xs={12} md={5}>
          <Paper elevation={4} sx={{
            p: { xs: 1, sm: 2, md: 3 },
            borderRadius: 3,
            height: { xs: 'auto', md: '600px' },
            boxShadow: theme.shadows[4],
            bgcolor: theme.palette.mode === 'dark' ? '#181c24' : '#f8fafc',
            transition: 'background 0.3s',
            display: 'flex', flexDirection: 'column',
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                <AIIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                AI Assistant
              </Typography>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>AI Model</InputLabel>
                <Select
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  label="AI Model"
                >
                  <MenuItem value="chatgpt">ChatGPT</MenuItem>
                  <MenuItem value="gemini">Google Gemini</MenuItem>
                  <MenuItem value="deepseek">DeepSeek</MenuItem>
                  <MenuItem value="claude">Claude</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ height: 'calc(100% - 120px)', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ flex: 1, overflow: 'auto', mb: 2 }}>
                {chatMessages.map((message, index) => (
                  <Box
                    key={index}
                    sx={{
                      mb: 2,
                      p: 2,
                      borderRadius: 1,
                      bgcolor: message.role === 'user' ? theme.palette.primary.main : theme.palette.background.paper,
                      color: message.role === 'user' ? theme.palette.primary.contrastText : theme.palette.text.primary,
                      boxShadow: message.role === 'user' ? theme.shadows[2] : 'none',
                      transition: 'background 0.3s, color 0.3s',
                    }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {message.content}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      {message.timestamp.toLocaleTimeString()}
                    </Typography>
                  </Box>
                ))}
                {isLoading && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={20} />
                    <Typography variant="body2">AI is thinking...</Typography>
                  </Box>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Ask AI for help..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                />
                <IconButton
                  onClick={handleAIChat}
                  disabled={isLoading || !chatInput.trim()}
                  color="primary"
                  sx={{ transition: 'background 0.2s', '&:hover': { background: theme.palette.action.hover } }}
                >
                  <SendIcon />
                </IconButton>
              </Box>
              <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  startIcon={<CodeIcon />}
                  onClick={handleAIGenerate}
                  disabled={isLoading || !chatInput.trim()}
                  variant="outlined"
                  fullWidth
                  sx={{ fontWeight: 600, borderRadius: 2, transition: 'all 0.2s', '&:hover': { background: theme.palette.action.hover } }}
                >
                  Generate Code
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>
        {/* Output Section */}
        <Grid item xs={12}>
          <Paper elevation={4} sx={{
            p: { xs: 1, sm: 2, md: 3 },
            borderRadius: 3,
            boxShadow: theme.shadows[4],
            bgcolor: theme.palette.mode === 'dark' ? '#181c24' : '#f8fafc',
            transition: 'background 0.3s',
          }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
              Output
            </Typography>
            <Box
              sx={{
                bgcolor: theme.palette.mode === 'dark' ? '#23272f' : '#fff',
                p: 2,
                borderRadius: 2,
                fontFamily: 'monospace',
                fontSize: '0.95rem',
                minHeight: '100px',
                overflow: 'auto',
                border: `2px solid ${theme.palette.divider}`,
                boxShadow: theme.shadows[1],
                transition: 'border 0.3s, background 0.3s',
              }}
            >
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>{output}</pre>
            </Box>
          </Paper>
        </Grid>
        {/* Tabs/panels for Editor, Output, Terminal */}
        {activeTab === 'editor' && (
          <Grid item xs={12}>
            <Paper elevation={4} sx={{
              p: { xs: 1, sm: 2, md: 3 },
              borderRadius: 3,
              boxShadow: theme.shadows[4],
              bgcolor: theme.palette.mode === 'dark' ? '#181c24' : '#f8fafc',
              transition: 'background 0.3s',
            }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                Editor
              </Typography>
              <Box sx={{
                border: `2px solid ${theme.palette.divider}`,
                borderRadius: 2,
                overflow: 'hidden',
                boxShadow: theme.shadows[1],
                transition: 'border 0.3s',
                background: theme.palette.mode === 'dark' ? '#23272f' : '#fff',
              }}>
                <MonacoEditor
                  value={code}
                  onChange={(value) => setCode(value || '')}
                  language={language}
                  theme={monacoTheme}
                  height="500px"
                />
              </Box>
            </Paper>
          </Grid>
        )}
        {activeTab === 'output' && (
          <Grid item xs={12}>
            <Paper elevation={4} sx={{
              p: { xs: 1, sm: 2, md: 3 },
              borderRadius: 3,
              boxShadow: theme.shadows[4],
              bgcolor: theme.palette.mode === 'dark' ? '#181c24' : '#f8fafc',
              transition: 'background 0.3s',
            }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                Output
              </Typography>
              <Box
                sx={{
                  bgcolor: theme.palette.mode === 'dark' ? '#23272f' : '#fff',
                  p: 2,
                  borderRadius: 2,
                  fontFamily: 'monospace',
                  fontSize: '0.95rem',
                  minHeight: '100px',
                  overflow: 'auto',
                  border: `2px solid ${theme.palette.divider}`,
                  boxShadow: theme.shadows[1],
                  transition: 'border 0.3s, background 0.3s',
                }}
              >
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>{output}</pre>
              </Box>
            </Paper>
          </Grid>
        )}
        {activeTab === 'terminal' && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2, minHeight: 200, bgcolor: '#111', color: '#fff', fontFamily: 'monospace', mb: 2 }}>
              <Box sx={{ mb: 1, display: 'flex', gap: 1 }}>
                <TextField
                  value={terminalInput}
                  onChange={e => setTerminalInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleTerminalCommand(); }}
                  placeholder="Enter shell command..."
                  size="small"
                  sx={{ flex: 1, bgcolor: '#222', input: { color: '#fff' } }}
                  InputProps={{ style: { color: '#fff' } }}
                />
                <Button variant="contained" color="primary" onClick={handleTerminalCommand} disabled={!terminalInput.trim()}>
                  Run
                </Button>
                <Button variant="outlined" color="inherit" onClick={handleClearTerminal}>Clear</Button>
              </Box>
              <Box sx={{ maxHeight: 300, overflowY: 'auto', fontSize: 15 }}>
                {terminalOutput.length === 0 ? (
                  <Typography color="gray">No terminal output yet.</Typography>
                ) : (
                  terminalOutput.map((line, idx) => <div key={idx}>{line}</div>)
                )}
              </Box>
            </Paper>
          </Grid>
        )}
        <Grid item xs={12}>
          <Paper elevation={4} sx={{ p: 2, borderRadius: 3, boxShadow: theme.shadows[4], bgcolor: theme.palette.mode === 'dark' ? '#23272f' : '#f8fafc', transition: 'background 0.3s' }}>
            <Typography variant="subtitle2" gutterBottom>Build Command:</Typography>
            {isEditingBuild ? (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField size="small" value={editBuildCommand} onChange={e => setEditBuildCommand(e.target.value)} fullWidth />
                <Button onClick={handleSaveBuildCommand} variant="contained" color="primary" size="small">Save</Button>
                <Button onClick={() => { setIsEditingBuild(false); setEditBuildCommand(buildCommand); }} size="small">Cancel</Button>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: '#eee', px: 1, borderRadius: 1 }}>{buildCommand || '(auto-detected or script)'}</Typography>
                {(userRole === 'owner' || userRole === 'admin') && (
                  <Button onClick={() => setIsEditingBuild(true)} size="small">Edit</Button>
                )}
              </Box>
            )}
            {buildError && <Alert severity="error" sx={{ mt: 1 }}>{buildError}</Alert>}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CodePlayground; 
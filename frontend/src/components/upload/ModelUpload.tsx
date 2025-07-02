import React, { useState } from 'react';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Switch,
  FormControlLabel,
} from '@mui/material';
import MonacoEditor from '../editor/MonacoEditor';

interface ModelUploadProps {
  onUpload?: (modelData: any) => void;
  onSuccess?: () => void;
}

const ModelUpload: React.FC<ModelUploadProps> = ({ onUpload, onSuccess }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [modelType, setModelType] = useState('transformer');
  const [aiProvider, setAiProvider] = useState('');
  const [version, setVersion] = useState('1.0.0');
  const [code, setCode] = useState(`# Your model code here
import torch
import torch.nn as nn

class ExampleModel(nn.Module):
    def __init__(self):
        super(ExampleModel, self).__init__()
        self.linear = nn.Linear(10, 1)
    
    def forward(self, x):
        return self.linear(x)

# Model configuration
model_config = {
    "input_size": 10,
    "output_size": 1,
    "hidden_size": 64
}
`);
  const [isPublic, setIsPublic] = useState(false);
  const [monetizationUrl, setMonetizationUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Function to generate code based on AI provider
  const generateAICode = (provider: string) => {
    const codeTemplates = {
      chatgpt: `# ChatGPT Model Integration
import openai
from typing import List, Dict, Any

# Configure OpenAI API
openai.api_key = "your-openai-api-key"

class ChatGPTModel:
    def __init__(self, model_name: str = "gpt-4"):
        self.model_name = model_name
        self.conversation_history = []
    
    def chat(self, message: str, temperature: float = 0.7) -> str:
        """Send a message to ChatGPT and get response"""
        self.conversation_history.append({"role": "user", "content": message})
        
        try:
            response = openai.ChatCompletion.create(
                model=self.model_name,
                messages=self.conversation_history,
                temperature=temperature,
                max_tokens=1000
            )
            
            assistant_message = response.choices[0].message.content
            self.conversation_history.append({"role": "assistant", "content": assistant_message})
            
            return assistant_message
            
        except Exception as e:
            return f"Error: {str(e)}"
    
    def reset_conversation(self):
        """Reset conversation history"""
        self.conversation_history = []

# Example usage
model = ChatGPTModel("gpt-4")
response = model.chat("Hello! Can you help me with Python programming?")
print(f"ChatGPT Response: {response}")

print("ChatGPT model initialized successfully!")`,

      gemini: `# Google Gemini Model Integration
import google.generativeai as genai
from typing import List, Dict, Any

# Configure Gemini API
genai.configure(api_key="your-gemini-api-key")

class GeminiModel:
    def __init__(self, model_name: str = "gemini-pro"):
        self.model = genai.GenerativeModel(model_name)
        self.conversation_history = []
    
    def chat(self, message: str, temperature: float = 0.7) -> str:
        """Send a message to Gemini and get response"""
        try:
            response = self.model.generate_content(
                message,
                generation_config=genai.types.GenerationConfig(
                    temperature=temperature,
                    max_output_tokens=1000
                )
            )
            
            return response.text
            
        except Exception as e:
            return f"Error: {str(e)}"
    
    def generate_code(self, prompt: str, language: str = "python") -> str:
        """Generate code based on prompt"""
        try:
            full_prompt = f"Generate {language} code for: {prompt}. Only return the code, no explanations."
            response = self.model.generate_content(full_prompt)
            return response.text
            
        except Exception as e:
            return f"Error generating code: {str(e)}"

# Example usage
model = GeminiModel("gemini-pro")
response = model.chat("Explain quantum computing in simple terms")
print(f"Gemini Response: {response}")

print("Google Gemini model initialized successfully!")`,

      deepseek: `# DeepSeek Model Integration
import requests
import json
from typing import List, Dict, Any

class DeepSeekModel:
    def __init__(self, api_key: str, model_name: str = "deepseek-chat"):
        self.api_key = api_key
        self.model_name = model_name
        self.base_url = "https://api.deepseek.com/v1"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    def chat(self, message: str, temperature: float = 0.7, max_tokens: int = 1000) -> str:
        """Send a message to DeepSeek and get response"""
        try:
            payload = {
                "model": self.model_name,
                "messages": [
                    {"role": "user", "content": message}
                ],
                "temperature": temperature,
                "max_tokens": max_tokens
            }
            
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=self.headers,
                json=payload
            )
            
            if response.status_code == 200:
                result = response.json()
                return result["choices"][0]["message"]["content"]
            else:
                return f"Error: {response.status_code} - {response.text}"
                
        except Exception as e:
            return f"Error: {str(e)}"
    
    def generate_code(self, prompt: str, language: str = "python") -> str:
        """Generate code based on prompt"""
        try:
            code_prompt = f"""You are an expert {language} programmer. 
            Generate clean, well-documented code for the following request:
            {prompt}
            
            Return only the code, no explanations."""
            
            return self.chat(code_prompt, temperature=0.3)
            
        except Exception as e:
            return f"Error generating code: {str(e)}"

# Example usage
model = DeepSeekModel("your-deepseek-api-key", "deepseek-chat")
response = model.chat("What are the latest trends in AI?")
print(f"DeepSeek Response: {response}")

print("DeepSeek model initialized successfully!")`,

      claude: `# Claude Model Integration
import anthropic
from typing import List, Dict, Any

# Configure Anthropic API
client = anthropic.Anthropic(api_key="your-anthropic-api-key")

class ClaudeModel:
    def __init__(self, model_name: str = "claude-3-sonnet-20240229"):
        self.model_name = model_name
        self.conversation_history = []
    
    def chat(self, message: str, temperature: float = 0.7) -> str:
        """Send a message to Claude and get response"""
        try:
            response = client.messages.create(
                model=self.model_name,
                max_tokens=1000,
                temperature=temperature,
                messages=[
                    {"role": "user", "content": message}
                ]
            )
            
            return response.content[0].text
            
        except Exception as e:
            return f"Error: {str(e)}"
    
    def chat_with_history(self, message: str) -> str:
        """Chat with conversation history"""
        try:
            # Add user message to history
            self.conversation_history.append({"role": "user", "content": message})
            
            response = client.messages.create(
                model=self.model_name,
                max_tokens=1000,
                temperature=0.7,
                messages=self.conversation_history
            )
            
            # Add assistant response to history
            self.conversation_history.append({"role": "assistant", "content": response.content[0].text})
            
            return response.content[0].text
            
        except Exception as e:
            return f"Error: {str(e)}"
    
    def generate_code(self, prompt: str, language: str = "python") -> str:
        """Generate code based on prompt"""
        try:
            code_prompt = f"""You are an expert {language} programmer. 
            Generate clean, well-documented code for the following request:
            {prompt}
            
            Return only the code, no explanations."""
            
            return self.chat(code_prompt, temperature=0.3)
            
        except Exception as e:
            return f"Error generating code: {str(e)}"
    
    def reset_conversation(self):
        """Reset conversation history"""
        self.conversation_history = []

# Example usage
model = ClaudeModel("claude-3-sonnet-20240229")
response = model.chat("Explain machine learning concepts in simple terms")
print(f"Claude Response: {response}")

print("Claude model initialized successfully!")`
    };

    return codeTemplates[provider as keyof typeof codeTemplates] || codeTemplates.chatgpt;
  };

  // Handle AI provider change
  const handleAiProviderChange = (provider: string) => {
    setAiProvider(provider);
    if (provider) {
      setCode(generateAICode(provider));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }

      const modelId = name.toLowerCase().replace(/\s+/g, '_');
      const modelData = {
        model_id: modelId,
        name,
        description,
        model_type: modelType,
        tags: [modelType, aiProvider].filter(Boolean), // Include model type and AI provider as tags
        price: "Free",
        public: isPublic,
        integration: aiProvider || null,
      };

      // Make actual API call to create model
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/api/models`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(modelData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to upload model: ${response.status}`);
      }

      const createdModel = await response.json();
      
      setSuccess('Model uploaded successfully!');
      if (onUpload) {
        onUpload(createdModel);
      }
      
      // Reset form
      setName('');
      setDescription('');
      setModelType('transformer');
      setAiProvider('');
      setVersion('1.0.0');
      setCode(`# Your model code here
import torch
import torch.nn as nn

class ExampleModel(nn.Module):
    def __init__(self):
        super(ExampleModel, self).__init__()
        self.linear = nn.Linear(10, 1)
    
    def forward(self, x):
        return self.linear(x)

# Model configuration
model_config = {
    "input_size": 10,
    "output_size": 1,
    "hidden_size": 64
}
`);
      setIsPublic(false);
      setMonetizationUrl('');
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload model. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFolderUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i], files[i].webkitRelativePath);
    }
    // Call backend endpoint for folder upload
    uploadModelFolder(formData);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i], files[i].name);
    }
    // Call backend endpoint for file upload
    uploadModelFolder(formData);
  };

  const uploadModelFolder = async (formData: FormData) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/api/models/upload-folder`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      if (response.ok) {
        setSuccess('Folder/files uploaded successfully!');
        if (onSuccess) onSuccess();
      } else {
        setError('Failed to upload folder/files.');
      }
    } catch (err) {
      setError('Failed to upload folder/files.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography component="h1" variant="h4" align="center" gutterBottom>
          Upload AI Model
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField
                required
                fullWidth
                label="Model Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
              
              <TextField
                required
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
              />
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Model Type</InputLabel>
                  <Select
                    value={modelType}
                    label="Model Type"
                    onChange={(e) => setModelType(e.target.value)}
                    disabled={loading}
                  >
                    <MenuItem value="transformer">Transformer</MenuItem>
                    <MenuItem value="cnn">CNN</MenuItem>
                    <MenuItem value="rnn">RNN</MenuItem>
                    <MenuItem value="lstm">LSTM</MenuItem>
                    <MenuItem value="chatgpt">ChatGPT</MenuItem>
                    <MenuItem value="gemini">Google Gemini</MenuItem>
                    <MenuItem value="deepseek">DeepSeek</MenuItem>
                    <MenuItem value="claude">Claude</MenuItem>
                    <MenuItem value="custom">Custom</MenuItem>
                  </Select>
                </FormControl>
                
                <TextField
                  required
                  fullWidth
                  label="Version"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  disabled={loading}
                />
              </Box>
              
              {/* AI Provider dropdown - only show for AI model types */}
              {(modelType === 'chatgpt' || modelType === 'gemini' || modelType === 'deepseek' || modelType === 'claude') && (
                <FormControl fullWidth>
                  <InputLabel>AI Provider</InputLabel>
                  <Select
                    value={aiProvider}
                    label="AI Provider"
                    onChange={(e) => handleAiProviderChange(e.target.value)}
                    disabled={loading}
                  >
                    <MenuItem value="chatgpt">ChatGPT (OpenAI)</MenuItem>
                    <MenuItem value="gemini">Google Gemini</MenuItem>
                    <MenuItem value="deepseek">DeepSeek</MenuItem>
                    <MenuItem value="claude">Claude (Anthropic)</MenuItem>
                  </Select>
                </FormControl>
              )}
              
              <Box>
                <Typography variant="h6" gutterBottom>
                  Model Code
                </Typography>
                <MonacoEditor
                  value={code}
                  onChange={(value) => setCode(value || '')}
                  language="python"
                  height="400px"
                />
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      disabled={loading}
                    />
                  }
                  label="Make Public"
                />
                
                {isPublic && (
                  <TextField
                    fullWidth
                    label="Monetization URL (optional)"
                    value={monetizationUrl}
                    onChange={(e) => setMonetizationUrl(e.target.value)}
                    disabled={loading}
                    placeholder="https://your-payment-link.com"
                  />
                )}
              </Box>
              
              <Box sx={{ mt: 2, mb: 2, display: 'flex', gap: 2 }}>
                <Button variant="outlined" component="label">
                  Upload Folder
                  {/* @ts-ignore */}
                  <input type="file" multiple hidden onChange={handleFolderUpload} webkitdirectory="" />
                </Button>
                <Button variant="outlined" component="label">
                  Upload File
                  <input type="file" multiple hidden onChange={handleFileUpload} />
                </Button>
              </Box>
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading || !name || !description}
              >
                {loading ? <CircularProgress size={24} /> : 'Upload Model'}
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ModelUpload; 
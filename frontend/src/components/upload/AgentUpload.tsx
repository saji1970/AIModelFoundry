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
  Chip,
  Stack,
  Switch,
  FormControlLabel,
  Autocomplete,
} from '@mui/material';
import MonacoEditor from '../editor/MonacoEditor';

interface AgentUploadProps {
  onUpload?: (agentData: any) => void;
  onSuccess?: () => void;
  availableModels?: string[];
}

const AgentUpload: React.FC<AgentUploadProps> = ({ onUpload, onSuccess, availableModels = [] }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [agentType, setAgentType] = useState('classifier');
  const [version, setVersion] = useState('1.0.0');
  const [requiredModels, setRequiredModels] = useState<string[]>([]);
  const [code, setCode] = useState(`# Your agent code here
import json
from typing import Dict, Any

class ExampleAgent:
    def __init__(self, model_path: str):
        self.model_path = model_path
        self.model = self.load_model()
    
    def load_model(self):
        # Load your model here
        return None
    
    def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        # Process input data using the model
        result = {
            "prediction": "example_result",
            "confidence": 0.95,
            "metadata": {
                "model_used": self.model_path,
                "processing_time": 0.1
            }
        }
        return result
    
    def get_config(self) -> Dict[str, Any]:
        return {
            "name": "Example Agent",
            "version": "1.0.0",
            "input_schema": {
                "type": "object",
                "properties": {
                    "text": {"type": "string"}
                }
            },
            "output_schema": {
                "type": "object",
                "properties": {
                    "prediction": {"type": "string"},
                    "confidence": {"type": "number"}
                }
            }
        }

# Agent configuration
agent_config = {
    "name": "Example Agent",
    "type": "classifier",
    "version": "1.0.0",
    "required_models": ["example_model"],
    "input_format": "json",
    "output_format": "json"
}
`);
  const [isPublic, setIsPublic] = useState(false);
  const [monetizationUrl, setMonetizationUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const agentData = {
        name,
        description,
        agent_type: agentType,
        version,
        required_models: requiredModels,
        code,
        public: isPublic,
        monetization_url: monetizationUrl,
        created_at: new Date().toISOString(),
      };

      // TODO: Replace with actual API call
      console.log('Uploading agent:', agentData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSuccess('Agent uploaded successfully!');
      if (onUpload) {
        onUpload(agentData);
      }
      
      // Reset form
      setName('');
      setDescription('');
      setAgentType('classifier');
      setVersion('1.0.0');
      setRequiredModels([]);
      setCode(`# Your agent code here
import json
from typing import Dict, Any

class ExampleAgent:
    def __init__(self, model_path: str):
        self.model_path = model_path
        self.model = self.load_model()
    
    def load_model(self):
        # Load your model here
        return None
    
    def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        # Process input data using the model
        result = {
            "prediction": "example_result",
            "confidence": 0.95,
            "metadata": {
                "model_used": self.model_path,
                "processing_time": 0.1
            }
        }
        return result
    
    def get_config(self) -> Dict[str, Any]:
        return {
            "name": "Example Agent",
            "version": "1.0.0",
            "input_schema": {
                "type": "object",
                "properties": {
                    "text": {"type": "string"}
                }
            },
            "output_schema": {
                "type": "object",
                "properties": {
                    "prediction": {"type": "string"},
                    "confidence": {"type": "number"}
                }
            }
        }

# Agent configuration
agent_config = {
    "name": "Example Agent",
    "type": "classifier",
    "version": "1.0.0",
    "required_models": ["example_model"],
    "input_format": "json",
    "output_format": "json"
}
`);
      setIsPublic(false);
      setMonetizationUrl('');
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload agent. Please try again.');
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
    uploadAgentFolder(formData);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i], files[i].name);
    }
    // Call backend endpoint for file upload
    uploadAgentFolder(formData);
  };

  const uploadAgentFolder = async (formData: FormData) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/api/agents/upload-folder`, {
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
          Upload AI Agent
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField
                required
                fullWidth
                label="Agent Name"
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
                  <InputLabel>Agent Type</InputLabel>
                  <Select
                    value={agentType}
                    label="Agent Type"
                    onChange={(e) => setAgentType(e.target.value)}
                    disabled={loading}
                  >
                    <MenuItem value="classifier">Classifier</MenuItem>
                    <MenuItem value="analyzer">Analyzer</MenuItem>
                    <MenuItem value="generator">Generator</MenuItem>
                    <MenuItem value="assistant">Assistant</MenuItem>
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
              
              <Autocomplete
                multiple
                options={availableModels}
                value={requiredModels}
                onChange={(_, newValue) => setRequiredModels(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Required Models"
                    placeholder="Select models this agent depends on"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option}
                      {...getTagProps({ index })}
                      key={option}
                    />
                  ))
                }
                disabled={loading}
              />
              
              <Box>
                <Typography variant="h6" gutterBottom>
                  Agent Code
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
                {loading ? <CircularProgress size={24} /> : 'Upload Agent'}
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default AgentUpload; 
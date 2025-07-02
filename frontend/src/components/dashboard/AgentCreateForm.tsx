import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import CodePlayground from '../playground/CodePlayground';
import InsertPhotoIcon from '@mui/icons-material/InsertPhoto';

interface AgentCreateFormProps {
  onSuccess: () => void;
  projectId: string;
}

const AgentCreateForm: React.FC<AgentCreateFormProps> = ({ onSuccess, projectId }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    agent_type: 'conversational',
    required_models: [] as string[],
    tags: [],
    price: 'Free',
    integration: '',
    public: false,
    icon: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const steps = ['Basic Information', 'Code Playground', 'Review & Create'];

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/api/agents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          agent_id: `agent_${Date.now()}`,
          name: formData.name,
          description: formData.description,
          agent_type: formData.agent_type,
          required_models: formData.required_models,
          tags: formData.tags,
          price: formData.price,
          public: formData.public,
          integration: formData.integration,
          icon: formData.icon,
          project_id: projectId
        })
      });

      if (response.ok) {
        setSuccess('AI Agent created successfully!');
        onSuccess();
        setTimeout(() => {
          setActiveStep(0);
          setFormData({
            name: '',
            description: '',
            agent_type: 'conversational',
            required_models: [],
            tags: [],
            price: 'Free',
            integration: '',
            public: false,
            icon: ''
          });
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to create AI agent');
      }
    } catch (err) {
      setError('Error creating AI agent');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTagsChange = (event: any) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      tags: typeof value === 'string' ? value.split(',') : value
    }));
  };

  const handleRequiredModelsChange = (event: any) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      required_models: typeof value === 'string' ? value.split(',') : value
    }));
  };

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleInputChange('icon', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Agent Name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              multiline
              rows={3}
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel>Agent Type</InputLabel>
              <Select
                value={formData.agent_type}
                onChange={(e) => handleInputChange('agent_type', e.target.value)}
                label="Agent Type"
              >
                <MenuItem value="classifier">Classifier</MenuItem>
                <MenuItem value="analyzer">Analyzer</MenuItem>
                <MenuItem value="generator">Generator</MenuItem>
                <MenuItem value="assistant">Assistant</MenuItem>
                <MenuItem value="automation">Automation</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Required Models</InputLabel>
              <Select
                multiple
                value={formData.required_models}
                onChange={handleRequiredModelsChange}
                input={<OutlinedInput label="Required Models" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} />
                    ))}
                  </Box>
                )}
              >
                <MenuItem value="transformer">Transformer</MenuItem>
                <MenuItem value="bert">BERT</MenuItem>
                <MenuItem value="gpt">GPT</MenuItem>
                <MenuItem value="cnn">CNN</MenuItem>
                <MenuItem value="custom">Custom Model</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Tags</InputLabel>
              <Select
                multiple
                value={formData.tags}
                onChange={handleTagsChange}
                input={<OutlinedInput label="Tags" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} />
                    ))}
                  </Box>
                )}
              >
                <MenuItem value="nlp">NLP</MenuItem>
                <MenuItem value="classification">Classification</MenuItem>
                <MenuItem value="text">Text Analysis</MenuItem>
                <MenuItem value="vision">Computer Vision</MenuItem>
                <MenuItem value="analytics">Analytics</MenuItem>
                <MenuItem value="automation">Automation</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Price"
              value={formData.price}
              onChange={(e) => handleInputChange('price', e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
              placeholder="Free, $9.99, etc."
              helperText="Set the price for your agent (use 'Free' for free agents)"
            />
            <FormControl fullWidth>
              <InputLabel>Integration</InputLabel>
              <Select
                value={formData.integration}
                onChange={(e) => handleInputChange('integration', e.target.value)}
                label="Integration"
              >
                <MenuItem value="">None</MenuItem>
                <MenuItem value="openai">OpenAI</MenuItem>
                <MenuItem value="anthropic">Anthropic</MenuItem>
                <MenuItem value="google">Google</MenuItem>
                <MenuItem value="vertexai">Vertex AI</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={<Checkbox checked={formData.public} onChange={e => handleInputChange('public', e.target.checked)} />}
              label="Make Agent Public"
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <label htmlFor="agent-icon-upload">
                <input
                  id="agent-icon-upload"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleIconChange}
                />
                <Button variant="outlined" component="span" startIcon={<InsertPhotoIcon />}>Upload Icon</Button>
              </label>
              {formData.icon ? (
                <img src={formData.icon} alt="Agent Icon" style={{ width: 40, height: 40, borderRadius: 8 }} />
              ) : (
                <InsertPhotoIcon sx={{ fontSize: 40, color: 'grey.400' }} />
              )}
            </Box>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Code Playground
            </Typography>
            <Typography color="textSecondary" paragraph>
              Use the playground to develop and test your AI agent code. You can generate code, get AI assistance, and refine your implementation.
            </Typography>
            <CodePlayground />
          </Box>
        );

      case 2:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6">Review AI Agent Details</Typography>
            <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
              <Typography><strong>Name:</strong> {formData.name}</Typography>
              <Typography><strong>Description:</strong> {formData.description}</Typography>
              <Typography><strong>Type:</strong> {formData.agent_type}</Typography>
              <Typography><strong>Required Models:</strong> {formData.required_models.join(', ')}</Typography>
              <Typography><strong>Tags:</strong> {formData.tags.join(', ')}</Typography>
              <Typography><strong>Price:</strong> {formData.price}</Typography>
              <Typography><strong>Integration:</strong> {formData.integration || 'None'}</Typography>
              <Typography><strong>Visibility:</strong> {formData.public ? 'Public' : 'Private'}</Typography>
              <Typography><strong>Icon:</strong></Typography>
              {formData.icon ? (
                <img src={formData.icon} alt="Agent Icon" style={{ width: 40, height: 40, borderRadius: 8 }} />
              ) : (
                <InsertPhotoIcon sx={{ fontSize: 40, color: 'grey.400' }} />
              )}
            </Box>
            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">{success}</Alert>}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {renderStepContent(activeStep)}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
        >
          Back
        </Button>
        <Box>
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create AI Agent'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={activeStep === 0 && (!formData.name || !formData.description || !formData.agent_type)}
            >
              Next
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default AgentCreateForm; 
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  IconButton,
  Chip,
  Divider,
  Alert,
  Fab,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Paper,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  Add as AddIcon,
  Upload as UploadIcon,
  Create as CreateIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Code as CodeIcon,
  SmartToy as SmartToyIcon,
  InsertPhoto as InsertPhotoIcon,
  Download as DownloadIcon,
  MonetizationOn as MonetizationIcon
} from '@mui/icons-material';
import ModelUpload from '../upload/ModelUpload';
import AgentUpload from '../upload/AgentUpload';
import ModelCreateForm from './ModelCreateForm';
import AgentCreateForm from './AgentCreateForm';
import CodePlayground from '../playground/CodePlayground';
// @ts-ignore: ProjectFileExplorer type declaration missing but file exists
import ProjectFileExplorer from './ProjectFileExplorer';
import MonacoEditor from '../editor/MonacoEditor';
import { useTheme } from '@mui/material/styles';
import type { ProjectFile } from './ProjectFileExplorer';

interface Project {
  project_id: string;
  name: string;
  description: string;
  storage_space_required: string;
  created_at: string;
  updated_at: string;
  models: Array<{
    model_id: string;
    name: string;
    model_type: string;
    version: string;
    project_id?: string;
    is_public: boolean;
    icon?: string;
    price?: string;
    file_path?: string;
  }>;
  agents: Array<{
    agent_id: string;
    name: string;
    agent_type: string;
    version: string;
    is_public: boolean;
    icon?: string;
    price?: string;
    file_path?: string;
  }>;
}

interface ProjectPageProps {
  projectId: string;
  onBack: () => void;
}

// Add ChatMessage type for AI chat
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// ErrorBoundary component
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return <div style={{color: 'red', padding: 16}}>
        <b>Editor Error:</b> {this.state.error?.toString() || 'Unknown error'}
      </div>;
    }
    return this.props.children;
  }
}

const ProjectPage: React.FC<ProjectPageProps> = ({ projectId, onBack }) => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [modelMenuAnchor, setModelMenuAnchor] = useState<null | HTMLElement>(null);
  const [agentMenuAnchor, setAgentMenuAnchor] = useState<null | HTMLElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'upload-model' | 'upload-agent' | 'create-model' | 'create-agent' | 'playground'>('create-model');
  const [playgroundModel, setPlaygroundModel] = useState<string | null>(null);
  const [playgroundAgent, setPlaygroundAgent] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [editorLanguage, setEditorLanguage] = useState('python');
  const [output, setOutput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [fileExplorerKey, setFileExplorerKey] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('chatgpt');
  const [saveAsDialogOpen, setSaveAsDialogOpen] = useState(false);
  const [saveAsFileName, setSaveAsFileName] = useState('');
  const [saveAsFolder, setSaveAsFolder] = useState('');
  const [saveAsError, setSaveAsError] = useState<string | null>(null);
  const [editModelDialogOpen, setEditModelDialogOpen] = useState(false);
  const [editAgentDialogOpen, setEditAgentDialogOpen] = useState(false);
  const [modelToEdit, setModelToEdit] = useState<any>(null);
  const [agentToEdit, setAgentToEdit] = useState<any>(null);
  const [editModelError, setEditModelError] = useState<string | null>(null);
  const [editAgentError, setEditAgentError] = useState<string | null>(null);
  const theme = useTheme();

  // If fetchProject is not memoized, suppress the warning
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/api/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const projectData = await response.json();
        setProject(projectData);
      } else {
        setError('Failed to fetch project details');
      }
    } catch (err) {
      setError('Error fetching project details');
    } finally {
      setLoading(false);
    }
  };

  const handleModelMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setModelMenuAnchor(event.currentTarget);
  };

  const handleAgentMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAgentMenuAnchor(event.currentTarget);
  };

  const handleModelMenuClose = () => {
    setModelMenuAnchor(null);
  };

  const handleAgentMenuClose = () => {
    setAgentMenuAnchor(null);
  };

  const handleDialogOpen = (type: typeof dialogType) => {
    setDialogType(type);
    setDialogOpen(true);
    handleModelMenuClose();
    handleAgentMenuClose();
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setPlaygroundModel(null);
    setPlaygroundAgent(null);
  };

  const handlePlaygroundOpen = (type: 'model' | 'agent', id: string) => {
    if (type === 'model') {
      setPlaygroundModel(id);
    } else {
      setPlaygroundAgent(id);
    }
    setDialogType('playground');
    setDialogOpen(true);
  };

  const handleRefresh = () => {
    fetchProject();
  };

  const handleFileOpen = (file: ProjectFile) => {
    console.log('File opened in ProjectPage:', file);
    setSelectedFile(file);
    setEditorContent(file.content);
    setEditorLanguage(file.language);
    setOutput('');
  };

  const handleSave = async () => {
    if (!selectedFile) return;
    setSaving(true);
    const token = localStorage.getItem('access_token');
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/api/projects/${projectId}/files/${selectedFile.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content: editorContent }),
      });
      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        setFileExplorerKey(k => k + 1);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save file');
      }
    } catch (error) {
      console.error('Save error:', error);
      setError('Failed to save file. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleRunCode = async () => {
    setOutput('Running...');
    const token = localStorage.getItem('access_token');
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/playground/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: editorContent,
          language: editorLanguage,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setOutput(data.output);
      } else {
        setOutput(data.error || 'Error running code');
      }
    } catch (e) {
      console.error('Run error:', e);
      setOutput('Error running code. Please check if the backend is running.');
    }
  };

  const handleAIChat = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('access_token');
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8001'}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: chatInput,
          context: '',
          language: 'python',
          model: selectedModel
        }),
      });
      const data = await response.json();
      setChatMessages(prev => [
        ...prev,
        { role: 'user', content: chatInput, timestamp: new Date() },
        { role: 'assistant', content: data.response, timestamp: new Date() }
      ]);
      setChatInput('');
    } catch (e) {
      setChatMessages(prev => [
        ...prev,
        { role: 'user', content: chatInput, timestamp: new Date() },
        { role: 'assistant', content: 'Error communicating with AI', timestamp: new Date() }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleAIChat();
    }
  };

  // Function to open Save As dialog and load folder options
  const openSaveAsDialog = () => {
    // Get folder options from file explorer structure
    // We'll use the fileStructure from ProjectFileExplorer, so pass a callback to update folderOptions
    setSaveAsDialogOpen(true);
  };

  // Function to handle Save As
  const handleSaveAs = async () => {
    if (!saveAsFileName.trim()) {
      setSaveAsError('File name is required');
      return;
    }
    setSaveAsError(null);
    setSaving(true);
    const token = localStorage.getItem('access_token');
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/api/projects/${projectId}/files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'file',
          name: saveAsFileName,
          path: saveAsFolder,
          content: editorContent,
          language: editorLanguage
        }),
      });
      if (response.ok) {
        setSaveAsDialogOpen(false);
        setSaveAsFileName('');
        setSaveAsFolder('');
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        setFileExplorerKey(k => k + 1); // Refresh file explorer
      } else {
        const errorData = await response.json();
        setSaveAsError(errorData.error || 'Failed to save file');
      }
    } catch (error) {
      setSaveAsError('Failed to save file. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Model delete handler
  const handleDeleteModel = async (modelId: string) => {
    if (!window.confirm('Are you sure you want to delete this model?')) return;
    const token = localStorage.getItem('access_token');
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/api/models/${modelId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        handleRefresh();
      } else {
        alert('Failed to delete model');
      }
    } catch (err) {
      alert('Failed to delete model');
    }
  };

  // Model edit handler
  const handleEditModel = (model: any) => {
    setModelToEdit(model);
    setEditModelDialogOpen(true);
    setEditModelError(null);
  };

  const handleSaveModelEdit = async () => {
    if (!modelToEdit) return;
    const token = localStorage.getItem('access_token');
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/api/models/${modelToEdit.model_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(modelToEdit),
      });
      if (response.ok) {
        setEditModelDialogOpen(false);
        setModelToEdit(null);
        handleRefresh();
      } else {
        setEditModelError('Failed to update model');
      }
    } catch (err) {
      setEditModelError('Failed to update model');
    }
  };

  // Agent delete handler
  const handleDeleteAgent = async (agentId: string) => {
    if (!window.confirm('Are you sure you want to delete this agent?')) return;
    const token = localStorage.getItem('access_token');
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/api/agents/${agentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        handleRefresh();
      } else {
        alert('Failed to delete agent');
      }
    } catch (err) {
      alert('Failed to delete agent');
    }
  };

  // Agent edit handler
  const handleEditAgent = (agent: any) => {
    setAgentToEdit(agent);
    setEditAgentDialogOpen(true);
    setEditAgentError(null);
  };

  const handleSaveAgentEdit = async () => {
    if (!agentToEdit) return;
    const token = localStorage.getItem('access_token');
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/api/agents/${agentToEdit.agent_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(agentToEdit),
      });
      if (response.ok) {
        setEditAgentDialogOpen(false);
        setAgentToEdit(null);
        handleRefresh();
      } else {
        setEditAgentError('Failed to update agent');
      }
    } catch (err) {
      setEditAgentError('Failed to update agent');
    }
  };

  // Add download handlers
  const handleDownloadModel = async (model: any) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/api/models/${model.model_id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${model.name}-${model.version}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError('Failed to download model');
      }
    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to download model');
    }
  };

  const handleDownloadAgent = async (agent: any) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/api/agents/${agent.agent_id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${agent.name}-${agent.version}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError('Failed to download agent');
      }
    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to download agent');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading project...</Typography>
      </Box>
    );
  }

  if (error || !project) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ mb: 2 }}>
          Back to Dashboard
        </Button>
        <Alert severity="error">{error || 'Project not found'}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ mr: 2 }}>
          Back to Dashboard
        </Button>
        <Typography variant="h4" component="h1">
          {project.name}
        </Typography>
      </Box>

      {/* Project Info */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Project Details
          </Typography>
          <Typography color="textSecondary" paragraph>
            {project.description}
          </Typography>
          <Box display="flex" gap={2} flexWrap="wrap">
            <Chip label={`Storage: ${project.storage_space_required}`} />
            <Chip label={`Models: ${(project.models || []).length}`} />
            <Chip label={`Agents: ${(project.agents || []).length}`} />
            <Chip label={`Created: ${new Date(project.created_at).toLocaleDateString()}`} />
          </Box>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label={`Models (${(project.models || []).length})`} />
          <Tab label={`AI Agents (${(project.agents || []).length})`} />
          <Tab label="Files" />
        </Tabs>
      </Box>

      {/* Models Tab */}
      {activeTab === 0 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Models</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleModelMenuClick}
            >
              Model
            </Button>
          </Box>

          {(project.models || []).filter(model => model.project_id === projectId).length === 0 ? (
            <Card>
              <CardContent>
                <Typography color="textSecondary" align="center">
                  No models in this project yet. Add your first model to get started.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={2}>
              {(project.models || []).filter(model => model.project_id === projectId).map((model) => (
                <Grid item xs={12} sm={6} md={4} key={model.model_id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        {model.icon ? (
                          <img src={model.icon} alt="Model Icon" style={{ width: 32, height: 32, borderRadius: 8, marginRight: 8 }} />
                        ) : (
                          <InsertPhotoIcon sx={{ fontSize: 32, color: 'grey.400', marginRight: 1 }} />
                        )}
                        <Typography variant="h6" sx={{ flexGrow: 1 }}>
                          {model.name}
                        </Typography>
                      </Box>
                      <Typography color="textSecondary" gutterBottom>
                        Type: {model.model_type}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Version: {model.version}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                        <Chip 
                          icon={<MonetizationIcon />}
                          label={model.price || 'Free'} 
                          color={model.price && model.price !== 'Free' ? 'primary' : 'default'}
                          size="small"
                        />
                        {model.is_public && (
                          <Chip label="Public" color="success" size="small" />
                        )}
                      </Box>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'space-between' }}>
                      <Button
                        size="small"
                        startIcon={<CodeIcon />}
                        onClick={() => handlePlaygroundOpen('model', model.model_id)}
                      >
                        Playground
                      </Button>
                      <Box>
                        <IconButton size="small" onClick={() => handleEditModel(model)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeleteModel(model.model_id)}>
                          <DeleteIcon />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDownloadModel(model)}>
                          <DownloadIcon />
                        </IconButton>
                      </Box>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* Agents Tab */}
      {activeTab === 1 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">AI Agents</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAgentMenuClick}
            >
              ADD AI Agent
            </Button>
          </Box>

          {(project.agents || []).length === 0 ? (
            <Card>
              <CardContent>
                <Typography color="textSecondary" align="center">
                  No AI agents in this project yet. Add your first agent to get started.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={2}>
              {(project.agents || []).map((agent) => (
                <Grid item xs={12} sm={6} md={4} key={agent.agent_id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        {agent.icon ? (
                          <img src={agent.icon} alt="Agent Icon" style={{ width: 32, height: 32, borderRadius: 8, marginRight: 8 }} />
                        ) : (
                          <SmartToyIcon sx={{ fontSize: 32, color: 'grey.400', marginRight: 1 }} />
                        )}
                        <Typography variant="h6" sx={{ flexGrow: 1 }}>
                          {agent.name}
                        </Typography>
                      </Box>
                      <Typography color="textSecondary" gutterBottom>
                        Type: {agent.agent_type}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Version: {agent.version}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                        <Chip 
                          icon={<MonetizationIcon />}
                          label={agent.price || 'Free'} 
                          color={agent.price && agent.price !== 'Free' ? 'primary' : 'default'}
                          size="small"
                        />
                        {agent.is_public && (
                          <Chip label="Public" color="success" size="small" />
                        )}
                      </Box>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'space-between' }}>
                      <Button
                        size="small"
                        startIcon={<CodeIcon />}
                        onClick={() => handlePlaygroundOpen('agent', agent.agent_id)}
                      >
                        Playground
                      </Button>
                      <Box>
                        <IconButton size="small" onClick={() => handleEditAgent(agent)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeleteAgent(agent.agent_id)}>
                          <DeleteIcon />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDownloadAgent(agent)}>
                          <DownloadIcon />
                        </IconButton>
                      </Box>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* Files Tab */}
      {activeTab === 2 && (
        <Grid container spacing={2}>
          {/* File Explorer */}
          <Grid item xs={12} md={3}>
            <ProjectFileExplorer
              key={fileExplorerKey}
              projectId={projectId}
              onFileOpen={handleFileOpen}
            />
          </Grid>
          {/* Editor + Output */}
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              {/* Toolbar */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mr: 2 }}>
                  {selectedFile ? selectedFile.name : 'Select a file to edit'}
                </Typography>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleRunCode}
                  disabled={!selectedFile}
                  sx={{ minWidth: 80 }}
                >
                  Run
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="success"
                  onClick={handleSave}
                  disabled={!selectedFile || saving}
                  sx={{ minWidth: 80 }}
                >
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  onClick={openSaveAsDialog}
                  sx={{ minWidth: 80, ml: 1 }}
                >
                  Save As
                </Button>
                {saveSuccess && (
                  <Alert severity="success" sx={{ ml: 2, p: 0.5, fontSize: 12 }}>
                    Saved!
                  </Alert>
                )}
              </Box>
              <ErrorBoundary>
                <MonacoEditor
                  value={editorContent}
                  onChange={v => {
                    try {
                      setEditorContent(v || '');
                    } catch (err) {
                      console.error('Editor onChange error:', err);
                    }
                  }}
                  language={editorLanguage}
                  theme={theme.palette.mode === 'dark' ? 'vs-dark' : 'vs-light'}
                  height="400px"
                />
              </ErrorBoundary>
            </Box>
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6">Output</Typography>
              <Paper sx={{ p: 2, minHeight: '100px', fontFamily: 'monospace', bgcolor: theme.palette.mode === 'dark' ? '#23272f' : '#fff' }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{output}</pre>
              </Paper>
            </Box>
          </Grid>
          {/* AI Assistant (chat only) */}
          <Grid item xs={12} md={3}>
            <Box sx={{ height: '100%' }}>
              {/* Inline AI Assistant chat UI, matching playground's chat feature */}
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
                    AI Assistant
                  </Typography>
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
                  {/* AI Model dropdown above chat input */}
                  <Box sx={{ mb: 1 }}>
                    <FormControl size="small" fullWidth>
                      <InputLabel>AI Model</InputLabel>
                      <Select
                        value={selectedModel}
                        label="AI Model"
                        onChange={e => setSelectedModel(e.target.value)}
                      >
                        <MenuItem value="chatgpt">ChatGPT</MenuItem>
                        <MenuItem value="gemini">Gemini</MenuItem>
                        <MenuItem value="deepseek">DeepSeek</MenuItem>
                        <MenuItem value="claude">Claude</MenuItem>
                      </Select>
                    </FormControl>
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
                    <Button
                      onClick={handleAIChat}
                      disabled={isLoading || !chatInput.trim()}
                      color="primary"
                      variant="contained"
                      sx={{ minWidth: 40 }}
                    >
                      Send
                    </Button>
                  </Box>
                </Box>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      )}

      {/* Model Add Menu */}
      <Menu
        anchorEl={modelMenuAnchor}
        open={Boolean(modelMenuAnchor)}
        onClose={handleModelMenuClose}
      >
        <MenuItem onClick={() => { handleDialogOpen('upload-model'); handleModelMenuClose(); }}>
          <ListItemIcon>
            <UploadIcon />
          </ListItemIcon>
          <ListItemText primary="Upload Model" />
        </MenuItem>
        <MenuItem onClick={() => { handleDialogOpen('create-model'); handleModelMenuClose(); }}>
          <ListItemIcon>
            <CreateIcon />
          </ListItemIcon>
          <ListItemText primary="Add Model" />
        </MenuItem>
      </Menu>

      {/* Agent Add Menu */}
      <Menu
        anchorEl={agentMenuAnchor}
        open={Boolean(agentMenuAnchor)}
        onClose={handleAgentMenuClose}
      >
        <MenuItem onClick={() => handleDialogOpen('upload-agent')}>
          <ListItemIcon>
            <UploadIcon />
          </ListItemIcon>
          <ListItemText primary="Upload AI Agent" />
        </MenuItem>
        <MenuItem onClick={() => handleDialogOpen('create-agent')}>
          <ListItemIcon>
            <CreateIcon />
          </ListItemIcon>
          <ListItemText primary="Create AI Agent" />
        </MenuItem>
      </Menu>

      {/* Dialogs */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          {dialogType === 'upload-model' && 'Upload Model'}
          {dialogType === 'upload-agent' && 'Upload AI Agent'}
          {dialogType === 'create-model' && 'Create Model'}
          {dialogType === 'create-agent' && 'Create AI Agent'}
          {dialogType === 'playground' && 'Code Playground'}
        </DialogTitle>
        <DialogContent>
          {dialogType === 'upload-model' && (
            <ModelUpload onSuccess={handleRefresh} />
          )}
          {dialogType === 'upload-agent' && (
            <AgentUpload onSuccess={handleRefresh} />
          )}
          {dialogType === 'create-model' && (
            <ModelCreateForm onSuccess={handleRefresh} projectId={projectId} />
          )}
          {dialogType === 'create-agent' && (
            <AgentCreateForm onSuccess={handleRefresh} projectId={projectId} />
          )}
          {dialogType === 'playground' && (
            <CodePlayground 
              initialModel={playgroundModel}
              initialAgent={playgroundAgent}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Save As Dialog */}
      <Dialog open={saveAsDialogOpen} onClose={() => setSaveAsDialogOpen(false)}>
        <DialogTitle>Save As</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Folder</InputLabel>
            <Select
              value={saveAsFolder}
              onChange={e => setSaveAsFolder(e.target.value)}
              label="Folder"
            >
              <MenuItem value="">Project Root</MenuItem>
              {/* Dynamically render folder options if available */}
              {/* {folderOptions.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))} */}
            </Select>
          </FormControl>
          <TextField
            label="File Name"
            value={saveAsFileName}
            onChange={e => setSaveAsFileName(e.target.value)}
            fullWidth
            required
            sx={{ mb: 2 }}
          />
          {saveAsError && <Alert severity="error">{saveAsError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveAsDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveAs} variant="contained" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Model Dialog */}
      <Dialog open={editModelDialogOpen} onClose={() => setEditModelDialogOpen(false)}>
        <DialogTitle>Edit Model</DialogTitle>
        <DialogContent>
          <TextField label="Name" value={modelToEdit?.name || ''} onChange={e => setModelToEdit({ ...modelToEdit, name: e.target.value })} fullWidth sx={{ mb: 2 }} />
          <TextField label="Description" value={modelToEdit?.description || ''} onChange={e => setModelToEdit({ ...modelToEdit, description: e.target.value })} fullWidth sx={{ mb: 2 }} />
          <TextField label="Type" value={modelToEdit?.model_type || ''} onChange={e => setModelToEdit({ ...modelToEdit, model_type: e.target.value })} fullWidth sx={{ mb: 2 }} />
          <TextField label="Version" value={modelToEdit?.version || ''} onChange={e => setModelToEdit({ ...modelToEdit, version: e.target.value })} fullWidth sx={{ mb: 2 }} />
          <FormControlLabel
            control={<Checkbox checked={!!modelToEdit?.is_public} onChange={e => setModelToEdit({ ...modelToEdit, is_public: e.target.checked })} />}
            label="Make Model Public"
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <label htmlFor="edit-model-icon-upload">
              <input
                id="edit-model-icon-upload"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setModelToEdit({ ...modelToEdit, icon: reader.result as string });
                    reader.readAsDataURL(file);
                  }
                }}
              />
              <Button variant="outlined" component="span" startIcon={<InsertPhotoIcon />}>Upload Icon</Button>
            </label>
            {modelToEdit?.icon ? (
              <img src={modelToEdit.icon} alt="Model Icon" style={{ width: 40, height: 40, borderRadius: 8 }} />
            ) : (
              <InsertPhotoIcon sx={{ fontSize: 40, color: 'grey.400' }} />
            )}
          </Box>
          {editModelError && <Alert severity="error">{editModelError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditModelDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveModelEdit} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Agent Dialog */}
      <Dialog open={editAgentDialogOpen} onClose={() => setEditAgentDialogOpen(false)}>
        <DialogTitle>Edit Agent</DialogTitle>
        <DialogContent>
          <TextField label="Name" value={agentToEdit?.name || ''} onChange={e => setAgentToEdit({ ...agentToEdit, name: e.target.value })} fullWidth sx={{ mb: 2 }} />
          <TextField label="Description" value={agentToEdit?.description || ''} onChange={e => setAgentToEdit({ ...agentToEdit, description: e.target.value })} fullWidth sx={{ mb: 2 }} />
          <TextField label="Type" value={agentToEdit?.agent_type || ''} onChange={e => setAgentToEdit({ ...agentToEdit, agent_type: e.target.value })} fullWidth sx={{ mb: 2 }} />
          <TextField label="Version" value={agentToEdit?.version || ''} onChange={e => setAgentToEdit({ ...agentToEdit, version: e.target.value })} fullWidth sx={{ mb: 2 }} />
          <FormControlLabel
            control={<Checkbox checked={!!agentToEdit?.is_public} onChange={e => setAgentToEdit({ ...agentToEdit, is_public: e.target.checked })} />}
            label="Make Agent Public"
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <label htmlFor="edit-agent-icon-upload">
              <input
                id="edit-agent-icon-upload"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setAgentToEdit({ ...agentToEdit, icon: reader.result as string });
                    reader.readAsDataURL(file);
                  }
                }}
              />
              <Button variant="outlined" component="span" startIcon={<InsertPhotoIcon />}>Upload Icon</Button>
            </label>
            {agentToEdit?.icon ? (
              <img src={agentToEdit.icon} alt="Agent Icon" style={{ width: 40, height: 40, borderRadius: 8 }} />
            ) : (
              <InsertPhotoIcon sx={{ fontSize: 40, color: 'grey.400' }} />
            )}
          </Box>
          {editAgentError && <Alert severity="error">{editAgentError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditAgentDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveAgentEdit} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectPage; 
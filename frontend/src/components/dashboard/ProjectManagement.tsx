import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  CircularProgress,
  Fab,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AddCircle as AddCircleIcon,
  RemoveCircle as RemoveCircleIcon,
  Storage as StorageIcon,
  Code as CodeIcon,
  SmartToy as AgentIcon,
} from '@mui/icons-material';

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
  }>;
  agents: Array<{
    agent_id: string;
    name: string;
    agent_type: string;
    version: string;
  }>;
}

interface Model {
  id: string;
  name: string;
  description: string;
  model_type: string;
  version: string;
}

interface Agent {
  id: string;
  name: string;
  description: string;
  agent_type: string;
  version: string;
}

interface ProjectManagementProps {
  onProjectCreated?: () => void;
}

const ProjectManagement: React.FC<ProjectManagementProps> = ({ onProjectCreated }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addModelDialogOpen, setAddModelDialogOpen] = useState(false);
  const [addAgentDialogOpen, setAddAgentDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  
  // Form states
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [storageSpace, setStorageSpace] = useState('1GB');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [projectTemplate, setProjectTemplate] = useState('basic');

  const token = localStorage.getItem('access_token');

  useEffect(() => {
    fetchProjects();
    fetchModels();
    fetchAgents();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      setError('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchModels = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/api/models`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setModels(data);
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/api/agents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAgents(data);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
  };

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      setError('Project name is required');
      return;
    }
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: projectName,
          description: projectDescription,
          storage_space_required: storageSpace,
          template: projectTemplate,
        }),
      });

      if (response.ok) {
        setCreateDialogOpen(false);
        setProjectName('');
        setProjectDescription('');
        setStorageSpace('1GB');
        setProjectTemplate('basic');
        fetchProjects();
        if (onProjectCreated) {
          onProjectCreated();
        }
      } else {
        setError('Failed to create project');
      }
    } catch (error) {
      setError('Failed to create project');
    }
  };

  const handleEditProject = async () => {
    if (!selectedProject) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/api/projects/${selectedProject.project_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: projectName,
          description: projectDescription,
          storage_space_required: storageSpace,
        }),
      });

      if (response.ok) {
        setEditDialogOpen(false);
        setSelectedProject(null);
        setProjectName('');
        setProjectDescription('');
        setStorageSpace('1GB');
        fetchProjects();
      } else {
        setError('Failed to update project');
      }
    } catch (error) {
      setError('Failed to update project');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        fetchProjects();
        setDeleteDialogOpen(false);
        setProjectToDelete(null);
      } else {
        setError('Failed to delete project');
      }
    } catch (error) {
      setError('Failed to delete project');
    }
  };

  const handleAddModelToProject = async () => {
    if (!selectedProject || !selectedModel) return;

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/api/projects/${selectedProject.project_id}/models/${selectedModel}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        setAddModelDialogOpen(false);
        setSelectedModel('');
        fetchProjects();
      } else {
        setError('Failed to add model to project');
      }
    } catch (error) {
      setError('Failed to add model to project');
    }
  };

  const handleAddAgentToProject = async () => {
    if (!selectedProject || !selectedAgent) return;

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/api/projects/${selectedProject.project_id}/agents/${selectedAgent}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        setAddAgentDialogOpen(false);
        setSelectedAgent('');
        fetchProjects();
      } else {
        setError('Failed to add agent to project');
      }
    } catch (error) {
      setError('Failed to add agent to project');
    }
  };

  const handleRemoveModelFromProject = async (projectId: string, modelId: string) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/api/projects/${projectId}/models/${modelId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        fetchProjects();
      } else {
        setError('Failed to remove model from project');
      }
    } catch (error) {
      setError('Failed to remove model from project');
    }
  };

  const handleRemoveAgentFromProject = async (projectId: string, agentId: string) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/api/projects/${projectId}/agents/${agentId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        fetchProjects();
      } else {
        setError('Failed to remove agent from project');
      }
    } catch (error) {
      setError('Failed to remove agent from project');
    }
  };

  const openEditDialog = (project: Project) => {
    setSelectedProject(project);
    setProjectName(project.name);
    setProjectDescription(project.description);
    setStorageSpace(project.storage_space_required);
    setEditDialogOpen(true);
  };

  const openAddModelDialog = (project: Project) => {
    setSelectedProject(project);
    setAddModelDialogOpen(true);
  };

  const openAddAgentDialog = (project: Project) => {
    setSelectedProject(project);
    setAddAgentDialogOpen(true);
  };

  // Convert projects to array if it's an object
  const projectArray: Project[] = Array.isArray(projects) ? projects : (projects ? Object.values(projects) as Project[] : []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Project Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Project
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {projectArray.map((project: Project) => (
          <Grid item xs={12} md={6} lg={4} key={project.project_id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Typography variant="h6" component="h2">
                    {project.name}
                  </Typography>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => openEditDialog(project)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => { setProjectToDelete(project); setDeleteDialogOpen(true); }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>

                <Typography color="textSecondary" gutterBottom>
                  {project.description}
                </Typography>

                <Box display="flex" alignItems="center" mb={2}>
                  <StorageIcon sx={{ mr: 1, fontSize: 16 }} />
                  <Typography variant="body2">
                    Storage: {project.storage_space_required}
                  </Typography>
                </Box>

                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Created: {new Date(project.created_at).toLocaleDateString()}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                  Models ({project.models.length})
                </Typography>
                <Box mb={2}>
                  {project.models.map((model: any) => (
                    <Chip
                      key={model.model_id}
                      label={model.name}
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                      onDelete={() => handleRemoveModelFromProject(project.project_id, model.model_id)}
                    />
                  ))}
                </Box>

                <Typography variant="subtitle2" gutterBottom>
                  Agents ({project.agents.length})
                </Typography>
                <Box mb={2}>
                  {project.agents.map((agent: any) => (
                    <Chip
                      key={agent.agent_id}
                      label={agent.name}
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                      onDelete={() => handleRemoveAgentFromProject(project.project_id, agent.agent_id)}
                    />
                  ))}
                </Box>
              </CardContent>

              <CardActions>
                <Button
                  size="small"
                  startIcon={<CodeIcon />}
                  onClick={() => openAddModelDialog(project)}
                >
                  Add Model
                </Button>
                <Button
                  size="small"
                  startIcon={<AgentIcon />}
                  onClick={() => openAddAgentDialog(project)}
                >
                  Add Agent
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Create Project Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Project</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Project Name"
            fullWidth
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Storage Space Required</InputLabel>
            <Select
              value={storageSpace}
              onChange={(e) => setStorageSpace(e.target.value)}
            >
              <MenuItem value="100MB">100MB</MenuItem>
              <MenuItem value="500MB">500MB</MenuItem>
              <MenuItem value="1GB">1GB</MenuItem>
              <MenuItem value="2GB">2GB</MenuItem>
              <MenuItem value="5GB">5GB</MenuItem>
              <MenuItem value="10GB">10GB</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Project Template</InputLabel>
            <Select
              value={projectTemplate}
              onChange={(e) => setProjectTemplate(e.target.value)}
            >
              <MenuItem value="basic">Basic Project</MenuItem>
              <MenuItem value="ml">Machine Learning</MenuItem>
              <MenuItem value="web">Web Application</MenuItem>
              <MenuItem value="api">API Service</MenuItem>
              <MenuItem value="data">Data Analysis</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateProject} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Project</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Project Name"
            fullWidth
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth>
            <InputLabel>Storage Space Required</InputLabel>
            <Select
              value={storageSpace}
              onChange={(e) => setStorageSpace(e.target.value)}
            >
              <MenuItem value="100MB">100MB</MenuItem>
              <MenuItem value="500MB">500MB</MenuItem>
              <MenuItem value="1GB">1GB</MenuItem>
              <MenuItem value="2GB">2GB</MenuItem>
              <MenuItem value="5GB">5GB</MenuItem>
              <MenuItem value="10GB">10GB</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditProject} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Model Dialog */}
      <Dialog open={addModelDialogOpen} onClose={() => setAddModelDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Model to Project</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Select Model</InputLabel>
            <Select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              {models.map((model) => (
                <MenuItem key={model.id} value={model.id}>
                  {model.name} ({model.model_type})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddModelDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddModelToProject} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Agent Dialog */}
      <Dialog open={addAgentDialogOpen} onClose={() => setAddAgentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Agent to Project</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Select Agent</InputLabel>
            <Select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
            >
              {agents.map((agent) => (
                <MenuItem key={agent.id} value={agent.id}>
                  {agent.name} ({agent.agent_type})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddAgentDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddAgentToProject} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Project Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Project</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the project <b>{projectToDelete?.name}</b> and all its files and folders? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={() => projectToDelete && handleDeleteProject(projectToDelete.project_id)} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectManagement; 
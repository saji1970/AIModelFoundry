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
  Alert,
  Container,
  IconButton,
  Chip,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  OpenInNew as OpenInNewIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  MonetizationOn as MonetizationIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import ProjectManagement from './ProjectManagement';
import ProjectPage from './ProjectPage';
import PaymentDialog from './PaymentDialog';

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
    price?: string;
    is_public?: boolean;
  }>;
  agents: Array<{
    agent_id: string;
    name: string;
    agent_type: string;
    version: string;
    price?: string;
    is_public?: boolean;
  }>;
}

const UserDashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectPage, setShowProjectPage] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    name: string;
    price: string;
    type: 'model' | 'agent';
    id: string;
    description?: string;
  } | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/api/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const projectsData = await response.json();
        setProjects(projectsData);
      } else {
        setError('Failed to fetch projects');
      }
    } catch (err) {
      setError('Error fetching projects');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProject = (project: Project) => {
    setSelectedProject(project);
    setShowProjectPage(true);
  };

  const handleBackToDashboard = () => {
    setShowProjectPage(false);
    setSelectedProject(null);
    fetchProjects(); // Refresh projects when returning
  };

  const handleProjectCreated = () => {
    setShowProjectDialog(false);
    fetchProjects();
  };

  const handleDeleteProject = async (projectId: string) => {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/api/projects/${projectId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) {
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
      fetchProjects();
    } else {
      // Optionally handle error
    }
  };

  const handleDownload = async (item: any, type: 'model' | 'agent') => {
    const token = localStorage.getItem('access_token');
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/api/${type}s/${item[`${type}_id`]}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 402) {
        // Payment required
        setSelectedItem({
          name: item.name,
          price: item.price || 'Free',
          type: type,
          id: item[`${type}_id`],
          description: item.description
        });
        setPaymentDialogOpen(true);
      } else if (response.ok) {
        // Download successful
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${item.name}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Download failed');
      }
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const handlePaymentSuccess = (itemId: string, type: 'model' | 'agent') => {
    // Payment was successful, trigger download
    const project = projectArray.find(p => 
      p.models.some(m => m.model_id === itemId) || 
      p.agents.some(a => a.agent_id === itemId)
    );
    
    if (project) {
      const item = type === 'model' 
        ? project.models.find(m => m.model_id === itemId)
        : project.agents.find(a => a.agent_id === itemId);
      
      if (item) {
        handleDownload(item, type);
      }
    }
  };

  // Convert projects to array if it's an object
  const projectArray: Project[] = Array.isArray(projects) ? projects : (projects ? Object.values(projects) as Project[] : []);

  if (showProjectPage && selectedProject) {
    return (
      <ProjectPage 
        projectId={selectedProject.project_id} 
        onBack={handleBackToDashboard} 
      />
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading projects...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          My Projects
        </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
          onClick={() => setShowProjectDialog(true)}
          >
          Create New Project
          </Button>
        </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Projects Grid */}
      {projectArray.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="h6" align="center" gutterBottom>
              No Projects Yet
            </Typography>
            <Typography color="textSecondary" align="center" paragraph>
              Create your first project to start organizing your AI models and agents.
            </Typography>
            <Box display="flex" justifyContent="center">
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowProjectDialog(true)}
              >
                Create Your First Project
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {projectArray.map((project: Project) => (
            <Grid item xs={12} md={6} lg={4} key={project.project_id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box>
                      <Typography variant="h6" component="h2">
                        {project.name}
                      </Typography>
                      <Typography color="textSecondary" gutterBottom>
                        {project.description}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Storage: {project.storage_space_required}  Models: {project.models.length}  Agents: {project.agents.length}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Created: {new Date(project.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => { setProjectToDelete(project); setDeleteDialogOpen(true); }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>

                  {/* Models Section */}
                  {project.models.length > 0 && (
                    <Box mb={2}>
                      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                        Models ({project.models.length})
                      </Typography>
                      {project.models.map((model) => (
                        <Box key={model.model_id} sx={{ mb: 1, p: 1, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                {model.name}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {model.model_type} • v{model.version}
                              </Typography>
                            </Box>
                            <Box display="flex" alignItems="center" gap={1}>
                              {model.price && model.price !== 'Free' && (
                                <Chip 
                                  label={model.price} 
                                  size="small" 
                                  color="primary" 
                                  icon={<MonetizationIcon />}
                                />
                              )}
                              <IconButton
                                size="small"
                                onClick={() => handleDownload(model, 'model')}
                                title="Download Model"
                              >
                                <DownloadIcon />
                              </IconButton>
                            </Box>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}

                  {/* Agents Section */}
                  {project.agents.length > 0 && (
                    <Box mb={2}>
                      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                        Agents ({project.agents.length})
                      </Typography>
                      {project.agents.map((agent) => (
                        <Box key={agent.agent_id} sx={{ mb: 1, p: 1, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                {agent.name}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {agent.agent_type} • v{agent.version}
                              </Typography>
                            </Box>
                            <Box display="flex" alignItems="center" gap={1}>
                              {agent.price && agent.price !== 'Free' && (
                                <Chip 
                                  label={agent.price} 
                                  size="small" 
                                  color="primary" 
                                  icon={<MonetizationIcon />}
                                />
                              )}
                              <IconButton
                                size="small"
                                onClick={() => handleDownload(agent, 'agent')}
                                title="Download Agent"
                              >
                                <DownloadIcon />
                              </IconButton>
                            </Box>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}

                  <Divider sx={{ my: 2 }} />
                  
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<OpenInNewIcon />}
                    onClick={() => handleOpenProject(project)}
                  >
                    Open Project
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Project Dialog */}
      <Dialog open={showProjectDialog} onClose={() => setShowProjectDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Project</DialogTitle>
        <DialogContent>
          <ProjectManagement onProjectCreated={handleProjectCreated} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowProjectDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Project</DialogTitle>
        <DialogContent>
          Are you sure you want to delete the project <b>{projectToDelete?.name}</b> and all its files and folders? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => projectToDelete && handleDeleteProject(projectToDelete.project_id)}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Dialog */}
      <PaymentDialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        item={selectedItem}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </Container>
  );
};

export default UserDashboard; 
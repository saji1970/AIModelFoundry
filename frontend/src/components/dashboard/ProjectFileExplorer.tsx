import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Menu,
  MenuItem as MenuItemComponent,
  ListItemIcon as ListItemIconComponent,
  ListItemText as ListItemTextComponent,
  Alert,
  Paper,
  Collapse,
  ListItemButton
} from '@mui/material';
import {
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  InsertDriveFile as FileIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Code as CodeIcon,
  CreateNewFolder as CreateFolderIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Upload as UploadIcon,
  PlayArrow as PlayArrowIcon,
  Save as SaveIcon,
  SaveAs as SaveAsIcon,
  Folder as FolderIconMui,
  Build as BuildIcon,
  Terminal as TerminalIconMui,
} from '@mui/icons-material';
import CodePlayground from '../playground/CodePlayground';
import { useTheme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import Snackbar from '@mui/material/Snackbar';

export interface ProjectFile {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  created_at: string;
  updated_at: string;
  type: 'file';
}

interface ProjectFolder {
  id: string;
  name: string;
  path: string;
  created_at: string;
  updated_at: string;
  type: 'folder';
}

interface FileStructure {
  folders: { [key: string]: ProjectFolder };
  files: { [key: string]: ProjectFile };
}

interface TreeNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  level: number;
  children: TreeNode[];
  isExpanded?: boolean;
  data: ProjectFile | ProjectFolder;
}

interface ProjectFileExplorerProps {
  projectId: string;
  onFileOpen?: (file: ProjectFile) => void;
}

const ProjectFileExplorer: React.FC<ProjectFileExplorerProps> = ({ projectId, onFileOpen }) => {
  const [fileStructure, setFileStructure] = useState<FileStructure>({ folders: {}, files: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [playgroundOpen, setPlaygroundOpen] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createType, setCreateType] = useState<'file' | 'folder'>('file');
  const [newItemName, setNewItemName] = useState('');
  const [newFileContent, setNewFileContent] = useState('');
  const [newFileLanguage, setNewFileLanguage] = useState('python');
  const [createPath, setCreatePath] = useState('');
  const [selectedFolderPath, setSelectedFolderPath] = useState<string>('');
  
  // Menu states
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = useState<ProjectFile | ProjectFolder | null>(null);

  const [buildCommand, setBuildCommand] = useState<string>('');
  const [editBuildCommand, setEditBuildCommand] = useState<string>('');
  const [isEditingBuild, setIsEditingBuild] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'files' | 'build' | 'terminal'>('files');
  const userRole: 'owner' | 'admin' | 'collaborator' | 'viewer' = 'owner'; // TODO: get from props or context
  const theme = useTheme();

  const token = localStorage.getItem('access_token');

  const [saveAsDialogOpen, setSaveAsDialogOpen] = useState(false);
  const [saveAsFilename, setSaveAsFilename] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchFileStructure();
    fetchBuildCommand();
  }, [projectId, token]);

  const fetchFileStructure = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/api/projects/${projectId}/files`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Ensure the data structure is valid with comprehensive validation
        const validData = {
          folders: data && typeof data === 'object' && data.folders ? data.folders : {},
          files: data && typeof data === 'object' && data.files ? data.files : {}
        };
        console.log('Setting file structure:', validData);
        setFileStructure(validData);
        if (Object.keys(validData.files).length > 0 && onFileOpen) {
          const firstFile = Object.values(validData.files)[0];
          console.log('Auto-selecting first file after file structure load:', firstFile);
          onFileOpen(firstFile as ProjectFile);
        }
      } else {
        console.error('Failed to fetch file structure:', response.status, response.statusText);
        setError('Failed to fetch file structure');
        // Set default structure on error
        setFileStructure({ folders: {}, files: {} });
      }
    } catch (error) {
      console.error('Error fetching file structure:', error);
      setError('Error fetching file structure');
      // Set default structure on error
      setFileStructure({ folders: {}, files: {} });
    } finally {
      setLoading(false);
    }
  };

  const fetchBuildCommand = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/api/projects/${projectId}/build-command`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setBuildCommand(data.build_command || '');
      setEditBuildCommand(data.build_command || '');
    } catch (error) {
      console.error('Error fetching build command:', error);
      setError('Error fetching build command');
    }
  };

  const buildTreeStructure = (): TreeNode[] => {
    // Safety check: return empty array if still loading or if fileStructure is invalid
    if (loading || !fileStructure) {
      console.log('buildTreeStructure: returning empty array due to loading or invalid fileStructure');
      return [];
    }
    
    const treeNodes: TreeNode[] = [];
    const folderMap = new Map<string, TreeNode>();
    
    // Ensure folders and files exist, default to empty objects if not
    let folders = fileStructure.folders || {};
    let files = fileStructure.files || {};
    
    // Additional safety check: ensure folders and files are objects
    if (typeof folders !== 'object' || folders === null) {
      console.warn('buildTreeStructure: folders is not a valid object, using empty object');
      folders = {};
    }
    if (typeof files !== 'object' || files === null) {
      console.warn('buildTreeStructure: files is not a valid object, using empty object');
      files = {};
    }
    
    // First, create all folder nodes
    Object.values(folders).forEach(folder => {
      const pathParts = folder.path ? folder.path.split('/').filter(Boolean) : [];
      const level = pathParts.length;
      
      const treeNode: TreeNode = {
        id: folder.id,
        name: folder.name,
        type: 'folder',
        path: folder.path,
        level,
        children: [],
        isExpanded: expandedFolders.has(folder.id),
        data: folder
      };
      
      folderMap.set(folder.id, treeNode);
      
      if (level === 0) {
        treeNodes.push(treeNode);
      } else {
        const parentPath = pathParts.slice(0, -1).join('/');
        const parentFolder = Object.values(folders).find(f => 
          f.path === parentPath && f.name === pathParts[pathParts.length - 2]
        );
        if (parentFolder) {
          const parentNode = folderMap.get(parentFolder.id);
          if (parentNode) {
            parentNode.children.push(treeNode);
          }
        }
      }
    });
    
    // Then, add files to their respective folders
    Object.values(files).forEach(file => {
      const pathParts = file.path ? file.path.split('/').filter(Boolean) : [];
      const level = pathParts.length;
      
      const treeNode: TreeNode = {
        id: file.id,
        name: file.name,
        type: 'file',
        path: file.path,
        level,
        children: [],
        data: file
      };
      
      if (level === 0) {
        treeNodes.push(treeNode);
      } else {
        const parentPath = pathParts.slice(0, -1).join('/');
        const parentFolder = Object.values(folders).find(f => 
          f.path === parentPath && f.name === pathParts[pathParts.length - 1]
        );
        if (parentFolder) {
          const parentNode = folderMap.get(parentFolder.id);
          if (parentNode) {
            parentNode.children.push(treeNode);
          }
        }
      }
    });
    
    return treeNodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  };

  // Helper to get all folder options for dropdown
  const getFolderOptions = () => {
    const folders = fileStructure && fileStructure.folders ? Object.values(fileStructure.folders) : [];
    // Root option
    const options = [{ label: 'Project Root', value: '' }];
    folders.forEach(folder => {
      options.push({ label: folder.path ? `${folder.path}/${folder.name}` : folder.name, value: folder.path ? `${folder.path}/${folder.name}` : folder.name });
    });
    return options;
  };

  const handleCreateItem = async () => {
    if (!newItemName.trim()) {
      setError('Name is required');
      return;
    }

    let pathToUse = createType === 'file' ? selectedFolderPath : createPath;

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/api/projects/${projectId}/files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: createType,
          name: newItemName,
          path: pathToUse,
          content: createType === 'file' ? newFileContent : '',
          language: createType === 'file' ? newFileLanguage : 'python'
        }),
      });

      if (response.ok) {
        setCreateDialogOpen(false);
        setNewItemName('');
        setNewFileContent('');
        setNewFileLanguage('python');
        setCreatePath('');
        setSelectedFolderPath('');
        fetchFileStructure();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create item');
        console.error('Create item error:', errorData);
      }
    } catch (error) {
      setError('Failed to create item');
      console.error('Create item error:', error);
    }
  };

  const handleDeleteItem = async (item: ProjectFile | ProjectFolder) => {
    if (!window.confirm(`Are you sure you want to delete ${item.name}?`)) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/api/projects/${projectId}/files/${item.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        fetchFileStructure();
      } else {
        setError('Failed to delete item');
      }
    } catch (error) {
      setError('Failed to delete item');
    }
  };

  const handleOpenFile = async (file: ProjectFile) => {
    setSelectedFile(file);
    setPlaygroundOpen(true);
    if (onFileOpen) onFileOpen(file);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, item: ProjectFile | ProjectFolder) => {
    setMenuAnchor(event.currentTarget);
    setSelectedItem(item);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedItem(null);
  };

  const handleFolderToggle = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleUploadFile = (folder: ProjectFolder) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = (e: any) => {
      const files = e.target.files;
      if (!files) return;
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i], files[i].name);
      }
      formData.append('folderPath', folder.path);
      uploadFilesToFolder(formData);
    };
    input.click();
  };

  const uploadFilesToFolder = async (formData: FormData) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/api/projects/${projectId}/upload-files`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      if (response.ok) {
        fetchFileStructure();
      }
    } catch (err) {
      // Optionally handle error
    }
  };

  const handleSaveBuildCommand = async () => {
    setBuildError(null);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/api/projects/${projectId}/build-command`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
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
    setTerminalOutput((prev) => [...prev, `$ build_project`]);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/api/projects/${projectId}/build`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setTerminalOutput((prev) => [...prev, data.output || '', data.error ? `Error: ${data.error}` : '']);
      setIsBuilding(false);
      setActiveTab('terminal');
    } catch (e) {
      setTerminalOutput((prev) => [...prev, 'Build failed.']);
      setIsBuilding(false);
    }
  };

  const handleTerminalCommand = async () => {
    if (!terminalInput.trim()) return;
    setTerminalOutput((prev) => [...prev, `$ ${terminalInput}`]);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/api/projects/${projectId}/terminal`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: terminalInput })
      });
      const data = await res.json();
      setTerminalOutput((prev) => [...prev, data.output || '', data.error ? `Error: ${data.error}` : '']);
    } catch (e) {
      setTerminalOutput((prev) => [...prev, 'Terminal command failed.']);
    }
    setTerminalInput('');
  };

  const handleRun = async () => {
    if (!selectedFile) return;
    setTerminalOutput((prev) => [...prev, `$ Run ${selectedFile.name}`]);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/playground/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ code: selectedFile.content, language: selectedFile.language })
      });
      const data = await res.json();
      setTerminalOutput((prev) => [...prev, data.output || '', data.error ? `Error: ${data.error}` : '']);
      setSnackbar({ open: true, message: 'Run completed', severity: 'success' });
    } catch (e) {
      setTerminalOutput((prev) => [...prev, 'Run failed.']);
      setSnackbar({ open: true, message: 'Run failed', severity: 'error' });
    }
  };

  const handleSave = async () => {
    if (!selectedFile) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/api/projects/${projectId}/files/${selectedFile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content: selectedFile.content })
      });
      if (res.ok) {
        setSnackbar({ open: true, message: 'File saved', severity: 'success' });
        fetchFileStructure();
      } else {
        setSnackbar({ open: true, message: 'Save failed', severity: 'error' });
      }
    } catch (e) {
      setSnackbar({ open: true, message: 'Save failed', severity: 'error' });
    }
  };

  const handleSaveAs = async () => {
    if (!selectedFile || !saveAsFilename.trim()) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/api/projects/${projectId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ type: 'file', name: saveAsFilename, path: selectedFile.path, content: selectedFile.content, language: selectedFile.language })
      });
      if (res.ok) {
        setSnackbar({ open: true, message: 'File saved as new', severity: 'success' });
        setSaveAsDialogOpen(false);
        setSaveAsFilename('');
        fetchFileStructure();
      } else {
        setSnackbar({ open: true, message: 'Save As failed', severity: 'error' });
      }
    } catch (e) {
      setSnackbar({ open: true, message: 'Save As failed', severity: 'error' });
    }
  };

  const renderTreeNode = (node: TreeNode): React.ReactNode => {
    const isExpanded = expandedFolders.has(node.id);
    
    return (
      <Box key={node.id}>
        <ListItem
          sx={{
            pl: node.level * 2 + 1,
            '&:hover': {
              backgroundColor: 'action.hover',
            }
          }}
        >
          <ListItemButton
            onClick={() => {
              if (node.type === 'folder') {
                handleFolderToggle(node.id);
              } else {
                console.log('File node clicked in ProjectFileExplorer:', node.data);
                if (
                  onFileOpen &&
                  node.data &&
                  node.type === 'file' &&
                  (node.data as ProjectFile).content !== undefined
                ) {
                  onFileOpen(node.data as ProjectFile);
                } else {
                  console.warn('onFileOpen not called: node.data is not a valid file', node.data);
                }
              }
            }}
            sx={{ pl: 0 }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              {node.type === 'folder' ? (
                isExpanded ? <FolderOpenIcon color="primary" /> : <FolderIcon />
              ) : (
                <FileIcon />
              )}
            </ListItemIcon>
            <ListItemText
              primary={node.name}
              secondary={node.type === 'file' ? `Language: ${(node.data as ProjectFile).language}` : 'Folder'}
            />
            {node.type === 'folder' && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFolderToggle(node.id);
                }}
              >
                {isExpanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
              </IconButton>
            )}
          </ListItemButton>
          <ListItemSecondaryAction>
            <IconButton
              edge="end"
              onClick={(e) => handleMenuClick(e, node.data)}
            >
              <MoreVertIcon />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
        
        {node.type === 'folder' && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {node.children
                .sort((a, b) => {
                  if (a.type !== b.type) {
                    return a.type === 'folder' ? -1 : 1;
                  }
                  return a.name.localeCompare(b.name);
                })
                .map(child => renderTreeNode(child))}
            </List>
          </Collapse>
        )}
      </Box>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography>Loading file structure...</Typography>
      </Box>
    );
  }

  // Safety check: ensure fileStructure is valid before building tree
  let treeNodes: TreeNode[] = [];
  try {
    treeNodes = fileStructure && typeof fileStructure === 'object' ? buildTreeStructure() : [];
  } catch (error) {
    console.error('Error building tree structure:', error);
    treeNodes = [];
  }
  
  // Final safety check: ensure treeNodes is always an array
  const safeTreeNodes = Array.isArray(treeNodes) ? treeNodes : [];

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Project Files</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Add File">
            <IconButton color="primary" onClick={() => { setCreatePath(''); setCreateType('file'); setCreateDialogOpen(true); }} sx={{ p: 0, '&:hover': { textDecoration: 'underline', background: 'none' } }}>
              <AddIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Add Folder">
            <IconButton color="primary" onClick={() => { setCreatePath(''); setCreateType('folder'); setCreateDialogOpen(true); }} sx={{ p: 0, '&:hover': { textDecoration: 'underline', background: 'none' } }}>
              <CreateFolderIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* File Tree */}
      <Paper elevation={0} sx={{ boxShadow: 'none', p: 0, m: 0, minHeight: 0, background: 'none' }}>
        <List>
          {safeTreeNodes.length === 0 ? (
            <ListItem>
              <ListItemText
                primary="No files or folders in this project"
                secondary="Click 'Add File' or 'Add Folder' to create your first items"
              />
            </ListItem>
          ) : (
            safeTreeNodes.map(node => renderTreeNode(node))
          )}
        </List>
      </Paper>

      {/* Action Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 3 }}>
        <Tooltip title="Run">
          <span style={{ display: 'inline-block' }}>
            <Button
              variant="contained"
              color="primary"
              disabled={loading || !selectedFile}
              onClick={async () => {
                await handleRun();
                setActiveTab('terminal');
              }}
              startIcon={<PlayArrowIcon />}
            >
              Run
            </Button>
          </span>
        </Tooltip>
        <Tooltip title="Build Project">
          <span style={{ display: 'inline-block' }}>
            <Button variant="outlined" color="primary" onClick={handleBuildProject} startIcon={<BuildIcon />}>Build</Button>
          </span>
        </Tooltip>
        <Tooltip title="Terminal">
          <span style={{ display: 'inline-block' }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => setActiveTab('terminal')}
              startIcon={<TerminalIconMui />}
            >
              Terminal
            </Button>
          </span>
        </Tooltip>
      </Box>

      {/* Create Item Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Item</DialogTitle>
        <DialogContent>
          {/* Item Type Selection */}
          <FormControl component="fieldset" sx={{ mb: 2, width: '100%' }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant={createType === 'file' ? 'contained' : 'outlined'}
                startIcon={<FileIcon />}
                onClick={() => setCreateType('file')}
                sx={{ flex: 1 }}
              >
                Create File
              </Button>
              <Button
                variant={createType === 'folder' ? 'contained' : 'outlined'}
                startIcon={<CreateFolderIcon />}
                onClick={() => setCreateType('folder')}
                sx={{ flex: 1 }}
              >
                Create Folder
              </Button>
            </Box>
          </FormControl>

          <TextField
            autoFocus
            margin="dense"
            label={`${createType === 'file' ? 'File' : 'Folder'} Name`}
            fullWidth
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            sx={{ mb: 2 }}
            placeholder={createType === 'file' ? 'e.g., main.py' : 'e.g., src'}
          />
          
          {/* Folder selection for files */}
          {createType === 'file' && (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Folder</InputLabel>
              <Select
                value={selectedFolderPath}
                label="Folder"
                onChange={e => setSelectedFolderPath(e.target.value)}
              >
                {getFolderOptions().map(option => (
                  <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          
          {createType === 'file' && (
            <>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Language</InputLabel>
                <Select
                  value={newFileLanguage}
                  onChange={(e) => setNewFileLanguage(e.target.value)}
                >
                  <MenuItem value="python">Python</MenuItem>
                  <MenuItem value="javascript">JavaScript</MenuItem>
                  <MenuItem value="typescript">TypeScript</MenuItem>
                  <MenuItem value="java">Java</MenuItem>
                  <MenuItem value="html">HTML</MenuItem>
                  <MenuItem value="css">CSS</MenuItem>
                  <MenuItem value="json">JSON</MenuItem>
                  <MenuItem value="markdown">Markdown</MenuItem>
                  <MenuItem value="text">Plain Text</MenuItem>
                </Select>
              </FormControl>
              <TextField
                margin="dense"
                label="Initial Content"
                fullWidth
                multiline
                rows={4}
                value={newFileContent}
                onChange={(e) => setNewFileContent(e.target.value)}
                placeholder="Enter initial content for the file..."
              />
            </>
          )}
          
          {createPath && (
            <TextField
              margin="dense"
              label="Parent Path"
              fullWidth
              value={createPath}
              InputProps={{ readOnly: true }}
              sx={{ mt: 2 }}
              helperText="This item will be created in the selected folder"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateItem} 
            variant="contained"
            disabled={!newItemName.trim()}
          >
            Create {createType === 'file' ? 'File' : 'Folder'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        {selectedItem && selectedItem.type === 'file' && (
          <MenuItemComponent onClick={() => {
            handleOpenFile(selectedItem);
            handleMenuClose();
          }}>
            <ListItemIconComponent>
              <CodeIcon />
            </ListItemIconComponent>
            <ListItemTextComponent primary="Open in Editor" />
          </MenuItemComponent>
        )}
        {selectedItem && selectedItem.type === 'folder' && (
          <MenuItemComponent onClick={() => {
            setCreatePath(selectedItem.path ? `${selectedItem.path}/${selectedItem.name}` : selectedItem.name);
            setCreateType('file');
            setCreateDialogOpen(true);
            handleMenuClose();
          }}>
            <ListItemIconComponent>
              <AddIcon />
            </ListItemIconComponent>
            <ListItemTextComponent primary="Add File Here" />
          </MenuItemComponent>
        )}
        {selectedItem && selectedItem.type === 'folder' && (
          <MenuItemComponent onClick={() => {
            setCreatePath(selectedItem.path ? `${selectedItem.path}/${selectedItem.name}` : selectedItem.name);
            setCreateType('folder');
            setCreateDialogOpen(true);
            handleMenuClose();
          }}>
            <ListItemIconComponent>
              <CreateFolderIcon />
            </ListItemIconComponent>
            <ListItemTextComponent primary="Add Folder Here" />
          </MenuItemComponent>
        )}
        <MenuItemComponent onClick={() => {
          handleDeleteItem(selectedItem!);
          handleMenuClose();
        }}>
          <ListItemIconComponent>
            <DeleteIcon />
          </ListItemIconComponent>
          <ListItemTextComponent primary="Delete" />
        </MenuItemComponent>
        <MenuItemComponent onClick={() => handleUploadFile(selectedItem as ProjectFolder)}>
          <ListItemIconComponent>
            <UploadIcon fontSize="small" />
          </ListItemIconComponent>
          <ListItemTextComponent primary="Upload File" />
        </MenuItemComponent>
      </Menu>

      {/* Playground Dialog */}
      <Dialog open={playgroundOpen} onClose={() => setPlaygroundOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          {selectedFile ? `Editing: ${selectedFile.name}` : 'Code Editor'}
        </DialogTitle>
        <DialogContent>
          <CodePlayground
            initialModel={selectedFile?.content || ''}
            initialAgent={selectedFile?.language || 'python'}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPlaygroundOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Build/Terminal Panel */}
      <Box sx={{ mt: 4 }}>
        <Paper elevation={4} sx={{ p: 2, borderRadius: 3, boxShadow: theme.shadows[4], bgcolor: theme.palette.mode === 'dark' ? '#23272f' : '#f8fafc', transition: 'background 0.3s' }}>
          {activeTab === 'build' && (
            <Box>
              <Typography variant="subtitle2">Build Command:</Typography>
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
              <Button variant="contained" color="success" onClick={handleBuildProject} disabled={isBuilding} sx={{ mt: 2 }}>
                {isBuilding ? 'Building...' : 'Build Project'}
              </Button>
            </Box>
          )}
          {activeTab === 'terminal' && (
            <Box>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  size="small"
                  value={terminalInput}
                  onChange={e => setTerminalInput(e.target.value)}
                  placeholder="Enter command..."
                  fullWidth
                  onKeyDown={e => { if (e.key === 'Enter') handleTerminalCommand(); }}
                />
                <Button onClick={handleTerminalCommand} variant="contained" color="primary" size="small">Run</Button>
              </Box>
              <Paper variant="outlined" sx={{ p: 1, minHeight: 120, maxHeight: 300, overflow: 'auto', bgcolor: '#111', color: '#0f0', fontFamily: 'monospace', fontSize: 14 }}>
                {terminalOutput.map((line, idx) => <div key={idx}>{line}</div>)}
              </Paper>
            </Box>
          )}
        </Paper>
      </Box>

      {/* Save As Dialog */}
      <Dialog open={saveAsDialogOpen} onClose={() => setSaveAsDialogOpen(false)}>
        <DialogTitle>Save As</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" label="New File Name" fullWidth value={saveAsFilename} onChange={e => setSaveAsFilename(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveAsDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveAs} variant="contained" disabled={!saveAsFilename.trim()}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for feedback */}
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })} message={snackbar.message} anchorOrigin={{ vertical: 'top', horizontal: 'center' }} />
    </Box>
  );
};

export default ProjectFileExplorer;

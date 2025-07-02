import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { Box, AppBar, Toolbar, Typography, Button, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import UploadIcon from '@mui/icons-material/Upload';
import AddIcon from '@mui/icons-material/Add';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import CodeIcon from '@mui/icons-material/Code';
import ExtensionIcon from '@mui/icons-material/Extension';

// Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import AppStorefront from './components/storefront/AppStorefront';
import UserDashboard from './components/dashboard/UserDashboard';
import ModelUpload from './components/upload/ModelUpload';
import AgentUpload from './components/upload/AgentUpload';
import CodePlayground from './components/playground/CodePlayground';

const getDesignTokens = (mode: 'light' | 'dark') => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          background: {
            default: '#f5f7fa',
            paper: '#ffffff',
          },
          primary: {
            main: '#0f172a', // Header Bar
          },
          secondary: {
            main: '#3b82f6', // Accent Buttons/Links
          },
          text: {
            primary: '#1e293b',
            secondary: '#64748b',
          },
          divider: '#e2e8f0',
        }
      : {
          background: {
            default: '#0f172a',
            paper: '#1e293b',
          },
          primary: {
            main: '#1e293b', // Header Bar
          },
          secondary: {
            main: '#60a5fa', // Accent Color
          },
          text: {
            primary: '#f8fafc',
            secondary: '#60a5fa',
          },
          divider: '#334155',
        }),
  },
  shape: {
    borderRadius: 16,
  },
});

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const [playgroundMenuAnchor, setPlaygroundMenuAnchor] = useState<null | HTMLElement>(null);

  const theme = React.useMemo(
    () =>
      createTheme({
        ...getDesignTokens(mode),
        components: {
          MuiPaper: {
            styleOverrides: {
              root: {
                borderRadius: 16,
                boxShadow: '0 2px 16px 0 rgba(0,0,0,0.06)',
                transition: 'background 0.4s, color 0.4s',
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 16,
                boxShadow: '0 2px 16px 0 rgba(0,0,0,0.08)',
                border: '1px solid',
                borderColor: mode === 'light' ? '#e2e8f0' : '#334155',
                background: mode === 'light' ? '#ffffff' : '#1e293b',
                transition: 'background 0.4s, color 0.4s, border-color 0.4s',
              },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                background: mode === 'light' ? '#0f172a' : '#1e293b',
                color: mode === 'light' ? '#f5f7fa' : '#f8fafc',
                boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)',
                position: 'sticky',
                top: 0,
                zIndex: 1201,
                transition: 'background 0.4s, color 0.4s',
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 10,
                fontWeight: 600,
                textTransform: 'none',
                background: mode === 'light' ? '#3b82f6' : '#60a5fa',
                color: mode === 'light' ? '#f5f7fa' : '#0f172a',
                transition: 'background 0.3s, color 0.3s',
                '&:hover': {
                  background: mode === 'light' ? '#2563eb' : '#3b82f6',
                  color: mode === 'light' ? '#fff' : '#fff',
                },
              },
            },
          },
        } as any,
      }),
    [mode]
  );

  useEffect(() => {
    // Check if user is authenticated on component mount
    const token = localStorage.getItem('access_token');
    setIsAuthenticated(!!token);

    // Listen for authentication state changes
    const handleAuthStateChange = (event: CustomEvent) => {
      setIsAuthenticated(event.detail.isAuthenticated);
    };

    window.addEventListener('authStateChanged', handleAuthStateChange as EventListener);

    return () => {
      window.removeEventListener('authStateChanged', handleAuthStateChange as EventListener);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setIsAuthenticated(false);
    window.location.href = '/';
  };

  const handleToggleMode = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handlePlaygroundMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setPlaygroundMenuAnchor(event.currentTarget);
  };

  const handlePlaygroundMenuClose = () => {
    setPlaygroundMenuAnchor(null);
  };

  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ flexGrow: 1 }}>
          <AppBar position="static">
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                AI Model Foundry
              </Typography>
              {isAuthenticated ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Button color="inherit" component={Link} to="/">
                    Dashboard
                  </Button>
                  <Button color="inherit" component={Link} to="/my-projects">
                    My Projects
                  </Button>
                  <Button
                    color="inherit"
                    onClick={handlePlaygroundMenuClick}
                  >
                    Playground
                  </Button>
                  <Menu
                    anchorEl={playgroundMenuAnchor}
                    open={Boolean(playgroundMenuAnchor)}
                    onClose={handlePlaygroundMenuClose}
                  >
                    <MenuItem component={Link} to="/playground/monaco" onClick={handlePlaygroundMenuClose}>
                      <ListItemIcon><CodeIcon fontSize="small" /></ListItemIcon>
                      <ListItemText primary="Monaco (Python, Java, JS, TS)" />
                    </MenuItem>
                    <MenuItem component={Link} to="/playground/langchain" onClick={handlePlaygroundMenuClose}>
                      <ListItemIcon><ExtensionIcon fontSize="small" /></ListItemIcon>
                      <ListItemText primary="LangChain" />
                    </MenuItem>
                    <MenuItem component={Link} to="/playground/haystack" onClick={handlePlaygroundMenuClose}>
                      <ListItemIcon><ExtensionIcon fontSize="small" /></ListItemIcon>
                      <ListItemText primary="Haystack" />
                    </MenuItem>
                    <MenuItem component={Link} to="/playground/openagents" onClick={handlePlaygroundMenuClose}>
                      <ListItemIcon><ExtensionIcon fontSize="small" /></ListItemIcon>
                      <ListItemText primary="OpenAgents" />
                    </MenuItem>
                    <MenuItem component={Link} to="/playground/deepseek" onClick={handlePlaygroundMenuClose}>
                      <ListItemIcon><ExtensionIcon fontSize="small" /></ListItemIcon>
                      <ListItemText primary="DeepSeek" />
                    </MenuItem>
                    <MenuItem component={Link} to="/playground/dusttt" onClick={handlePlaygroundMenuClose}>
                      <ListItemIcon><ExtensionIcon fontSize="small" /></ListItemIcon>
                      <ListItemText primary="Dust.tt" />
                    </MenuItem>
                  </Menu>
                  <Button
                    color="inherit"
                    onClick={handleToggleMode}
                    sx={{ minWidth: 0, px: 1 }}
                    aria-label="toggle theme"
                  >
                    {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                  </Button>
                  <Button color="inherit" onClick={handleLogout}>
                    Logout
                  </Button>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Button color="inherit" component={Link} to="/login">
                    Login
                  </Button>
                  <Button color="inherit" component={Link} to="/register">
                    Register
                  </Button>
                </Box>
              )}
            </Toolbar>
          </AppBar>

          <Routes>
            <Route path="/" element={<AppStorefront />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/my-projects"
              element={
                isAuthenticated ? (
                  <UserDashboard />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/dashboard"
              element={
                isAuthenticated ? (
                  <UserDashboard />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/upload/model"
              element={
                isAuthenticated ? (
                  <ModelUpload />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/upload/agent"
              element={
                isAuthenticated ? (
                  <AgentUpload />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/playground"
              element={
                isAuthenticated ? (
                  <CodePlayground />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route path="/playground/monaco" element={isAuthenticated ? (<CodePlayground />) : (<Navigate to="/login" replace />)} />
            <Route path="/playground/langchain" element={<div style={{padding:40}}><h2>LangChain Playground (Coming Soon)</h2></div>} />
            <Route path="/playground/haystack" element={<div style={{padding:40}}><h2>Haystack Playground (Coming Soon)</h2></div>} />
            <Route path="/playground/openagents" element={<div style={{padding:40}}><h2>OpenAgents Playground (Coming Soon)</h2></div>} />
            <Route path="/playground/deepseek" element={<div style={{padding:40}}><h2>DeepSeek Playground (Coming Soon)</h2></div>} />
            <Route path="/playground/dusttt" element={<div style={{padding:40}}><h2>Dust.tt Playground (Coming Soon)</h2></div>} />
          </Routes>
        </Box>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;

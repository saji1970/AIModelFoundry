import React, { useEffect, useState } from 'react';
import { Container, Grid, Card, CardContent, CardMedia, Typography, Button, Box, Chip, Link } from '@mui/material';
import { SmartToy as SmartToyIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

interface Agent {
  agent_id: string;
  name: string;
  description: string;
  imageUrl?: string;
  apple_store_url?: string;
  google_play_url?: string;
  custom_payment_url?: string;
  public?: boolean;
  creator?: string;
  version?: string;
  agent_type?: string;
}

const AgentStorefront: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const theme = useTheme();

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/api/agents/public`)
      .then((res) => res.json())
      .then((data) => setAgents(data));
  }, []);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        AI Agent Marketplace
      </Typography>
      <Grid container spacing={4}>
        {agents.map((agent) => (
          <Grid item key={agent.agent_id} xs={12} sm={6} md={4}>
            <Card>
              <Box
                sx={{
                  height: 200,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
                  position: 'relative'
                }}
              >
                {agent.imageUrl ? (
                  <img
                    src={agent.imageUrl}
                    alt={agent.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <SmartToyIcon sx={{ fontSize: 80, color: theme.palette.primary.main }} />
                )}
              </Box>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography gutterBottom variant="h5" component="h2" sx={{ flexGrow: 1 }}>
                    {agent.name}
                  </Typography>
                  {agent.public && <Chip label="Public" color="success" size="small" />}
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {agent.description}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {agent.apple_store_url && (
                    <Link href={agent.apple_store_url} target="_blank" rel="noopener">
                      <Button variant="outlined" color="secondary" fullWidth>Apple Store</Button>
                    </Link>
                  )}
                  {agent.google_play_url && (
                    <Link href={agent.google_play_url} target="_blank" rel="noopener">
                      <Button variant="outlined" color="secondary" fullWidth>Google Play</Button>
                    </Link>
                  )}
                  {agent.custom_payment_url && (
                    <Link href={agent.custom_payment_url} target="_blank" rel="noopener">
                      <Button variant="outlined" color="secondary" fullWidth>Buy/Subscribe</Button>
                    </Link>
                  )}
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 2 }}>
                  <Button variant="contained" color="primary">
                    Deploy
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default AgentStorefront; 
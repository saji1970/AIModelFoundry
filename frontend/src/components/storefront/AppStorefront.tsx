import React, { useEffect, useState } from 'react';
import { 
  Container, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  Typography, 
  Button, 
  Box, 
  Chip, 
  Link, 
  Tabs, 
  Tab,
  Rating,
  Avatar,
  Divider,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  CircularProgress
} from '@mui/material';
import { 
  Star as StarIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  MonetizationOn as MonetizationIcon,
  Payment as PaymentIcon,
  CreditCard as CreditCardIcon,
  Refresh as RefreshIcon,
  SmartToy as SmartToyIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PaymentDialog from '../dashboard/PaymentDialog';
import StorefrontDetail from './StorefrontDetail';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`store-tabpanel-${index}`}
      aria-labelledby={`store-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

interface Model {
  model_id: string;
  name: string;
  description: string;
  imageUrl?: string;
  price?: string;
  apple_store_url?: string;
  google_play_url?: string;
  custom_payment_url?: string;
  public?: boolean;
  creator?: string;
  version?: string;
  downloads?: number;
  rating?: number;
  model_type?: string;
  screenshots?: string[];
  icon?: string;
}

interface Agent {
  agent_id: string;
  name: string;
  description: string;
  imageUrl?: string;
  price?: string;
  apple_store_url?: string;
  google_play_url?: string;
  custom_payment_url?: string;
  public?: boolean;
  creator?: string;
  version?: string;
  downloads?: number;
  rating?: number;
  icon?: string;
  user_id?: string;
  screenshots?: string[];
}

interface PaymentFormData {
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
  email: string;
  amount: string;
}

interface ModelCardProps {
  model: Model;
  onFavorite: (modelId: string) => void;
  isFavorite: boolean;
  onTryDemo: (model: Model) => void;
  onBuy: (item: Model) => void;
  onDownload: (item: Model) => void;
}

const AppStorefront: React.FC = () => {
  const theme = useTheme();
  const [models, setModels] = useState<Model[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Model | Agent | null>(null);
  const [paymentStep, setPaymentStep] = useState(0);
  const [paymentFormData, setPaymentFormData] = useState<PaymentFormData>({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: '',
    email: '',
    amount: ''
  });
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterPrice, setFilterPrice] = useState('');
  const [filterRating, setFilterRating] = useState('');
  const [favoriteModels, setFavoriteModels] = useState<string[]>([]);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedItemForPayment, setSelectedItemForPayment] = useState<{
    name: string;
    price: string;
    type: 'model' | 'agent';
    id: string;
    description?: string;
  } | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<any>(null);
  const [detailType, setDetailType] = useState<'model' | 'agent'>('model');
  const [detailReviews, setDetailReviews] = useState<any[]>([]);
  const [userId, setUserId] = useState<string>(''); // TODO: get from auth context
  const [isOwner, setIsOwner] = useState(false);
  const [canReview, setCanReview] = useState(false);

  const sampleIcon = 'https://placehold.co/96x96/4CAF50/fff?text=AI';
  const sampleScreenshots = [
    'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80'
  ];

  const fetchPublicModels = async () => {
    try {
      console.log('Fetching public models...');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/api/models/public`);
      const data = await response.json();
      console.log('Public models received:', data);
      setModels(data);
    } catch (err) {
      console.error('Error fetching models:', err);
    }
  };

  const fetchPublicAgents = async () => {
    try {
      console.log('Fetching public agents...');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/api/agents/public`);
      const data = await response.json();
      console.log('Public agents received:', data);
      setAgents(data);
    } catch (err) {
      console.error('Error fetching agents:', err);
    }
  };

  const refreshStore = async () => {
    setLoading(true);
    await Promise.all([fetchPublicModels(), fetchPublicAgents()]);
    setLoading(false);
  };

  useEffect(() => {
    refreshStore();
    
    // Set up periodic refresh every 30 seconds
    const interval = setInterval(refreshStore, 30000);
    
    // Refresh when window gains focus (user navigates back to tab)
    const handleFocus = () => {
      console.log('Window focused, refreshing store...');
      refreshStore();
    };
    
    // Refresh when items are published from dashboard
    const handleStoreRefresh = () => {
      console.log('Store refresh event received...');
      refreshStore();
    };
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('store-refresh', handleStoreRefresh);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('store-refresh', handleStoreRefresh);
    };
  }, []);

  const handleRefresh = () => {
    refreshStore();
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleDirectPayment = (item: Model | Agent) => {
    setSelectedItem(item);
    setPaymentStep(0);
    setPaymentError(null);
    setPaymentSuccess(false);
    setOpenPaymentDialog(true);
  };

  const handleDownload = async (item: Model | Agent, type: 'model' | 'agent') => {
    try {
      const itemId = type === 'model' ? (item as Model).model_id : (item as Agent).agent_id;
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/api/${type}s/${itemId}/download`);

      if (response.status === 402) {
        // Payment required
        setSelectedItemForPayment({
          name: item.name,
          price: item.price || 'Free',
          type: type,
          id: itemId,
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
    const item = type === 'model' 
      ? models.find(m => m.model_id === itemId)
      : agents.find(a => a.agent_id === itemId);
    
    if (item) {
      handleDownload(item, type);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!selectedItem) return;

    setPaymentStep(1);
    setPaymentError(null);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, you would call your payment API here
      // const itemId = 'model_id' in selectedItem ? selectedItem.model_id : selectedItem.agent_id;
      // const itemType = 'model_id' in selectedItem ? 'model' : 'agent';
      // const response = await fetch('/api/payment/process', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     itemId: itemId,
      //     itemType: itemType,
      //     amount: selectedItem.price,
      //     paymentDetails: paymentFormData
      //   })
      // });

      setPaymentStep(2);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPaymentSuccess(true);
      setPaymentStep(3);
    } catch (err) {
      setPaymentError('Payment failed. Please try again.');
    }
  };

  const renderPaymentDialog = () => (
    <Dialog open={openPaymentDialog} onClose={() => setOpenPaymentDialog(false)} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CreditCardIcon />
          <Typography variant="h6">
            Purchase {selectedItem && ('model_id' in selectedItem) ? 'Model' : 'Agent'}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Stepper activeStep={paymentStep} sx={{ mb: 3 }}>
          <Step>
            <StepLabel>Review Item</StepLabel>
          </Step>
          <Step>
            <StepLabel>Payment Details</StepLabel>
          </Step>
          <Step>
            <StepLabel>Processing</StepLabel>
          </Step>
          <Step>
            <StepLabel>Complete</StepLabel>
          </Step>
        </Stepper>
        
        {paymentStep === 0 && selectedItem && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Your Purchase
            </Typography>
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6">{selectedItem.name}</Typography>
                <Typography color="textSecondary" gutterBottom>
                  {selectedItem.description}
                </Typography>
                <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
                  {selectedItem.price || 'Free'}
                </Typography>
              </CardContent>
            </Card>
            <Button
              variant="contained"
              fullWidth
              onClick={() => setPaymentStep(1)}
              startIcon={<PaymentIcon />}
            >
              Proceed to Payment
            </Button>
          </Box>
        )}

        {paymentStep === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Payment Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Card Number"
                  value={paymentFormData.cardNumber}
                  onChange={(e) => setPaymentFormData({...paymentFormData, cardNumber: e.target.value})}
                  placeholder="1234 5678 9012 3456"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Cardholder Name"
                  value={paymentFormData.cardHolder}
                  onChange={(e) => setPaymentFormData({...paymentFormData, cardHolder: e.target.value})}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Expiry Date"
                  value={paymentFormData.expiryDate}
                  onChange={(e) => setPaymentFormData({...paymentFormData, expiryDate: e.target.value})}
                  placeholder="MM/YY"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="CVV"
                  value={paymentFormData.cvv}
                  onChange={(e) => setPaymentFormData({...paymentFormData, cvv: e.target.value})}
                  placeholder="123"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={paymentFormData.email}
                  onChange={(e) => setPaymentFormData({...paymentFormData, email: e.target.value})}
                />
              </Grid>
            </Grid>
            {paymentError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {paymentError}
              </Alert>
            )}
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => setPaymentStep(0)}
                fullWidth
              >
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handlePaymentSubmit}
                fullWidth
                startIcon={<PaymentIcon />}
              >
                Pay Now
              </Button>
            </Box>
          </Box>
        )}

        {paymentStep === 2 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Processing Payment...
            </Typography>
            <Typography color="textSecondary">
              Please wait while we process your payment securely.
            </Typography>
          </Box>
        )}

        {paymentStep === 3 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" gutterBottom color="success.main">
              Payment Successful!
            </Typography>
            <Typography color="textSecondary" gutterBottom>
              Your payment has been processed successfully.
            </Typography>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => {
                if (selectedItem) {
                  const type = ('model_id' in selectedItem) ? 'model' : 'agent';
                  handleDownload(selectedItem, type);
                }
              }}
              sx={{ mt: 2 }}
            >
              Download {selectedItem && ('model_id' in selectedItem) ? 'Model' : 'Agent'}
            </Button>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        {paymentStep < 3 && (
          <Button onClick={() => setOpenPaymentDialog(false)} color="inherit">
            Cancel
          </Button>
        )}
        {paymentStep === 3 && (
          <Button onClick={() => setOpenPaymentDialog(false)} variant="contained">
            Close
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );

  const handleFavorite = (modelId: string) => {
    setFavoriteModels(prev => 
      prev.includes(modelId) 
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    );
  };

  // Filter models based on search and filters
  const filteredModels = (Array.isArray(models) ? models : []).filter(model => {
    const matchesSearch = model.name.toLowerCase().includes(search.toLowerCase()) ||
                         model.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = !filterType || model.model_type?.toLowerCase().includes(filterType.toLowerCase());
    const matchesPrice = !filterPrice || model.price === filterPrice;
    const matchesRating = !filterRating || (model.rating || 0) >= parseInt(filterPrice);
    
    return matchesSearch && matchesType && matchesPrice && matchesRating;
  });

  // Filter agents based on search and filters
  const filteredAgents = (Array.isArray(agents) ? agents : []).filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(search.toLowerCase()) ||
                         agent.description.toLowerCase().includes(search.toLowerCase());
    const matchesPrice = !filterPrice || agent.price === filterPrice;
    const matchesRating = !filterRating || (agent.rating || 0) >= parseInt(filterPrice);
    
    return matchesSearch && matchesPrice && matchesRating;
  });

  // Memoized card for performance
  const ModelCard: React.FC<ModelCardProps> = React.memo(({ model, onFavorite, isFavorite, onTryDemo, onBuy, onDownload }) => (
    <Grid item key={model.model_id} xs={12} sm={6} md={4}>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 3,
          boxShadow: theme.shadows[4],
          transition: 'box-shadow 0.3s, transform 0.3s',
          '&:hover': {
            boxShadow: theme.shadows[8],
            transform: 'translateY(-4px) scale(1.02)',
          },
          p: { xs: 1, sm: 2 },
          fontFamily: 'Inter, Roboto, Arial, sans-serif',
        }}
        aria-label={`AI Model card for ${model.name}`}
        role="region"
      >
        <Box
          sx={{
            height: 180,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            position: 'relative'
          }}
        >
          {model.imageUrl ? (
            <img
              src={model.imageUrl}
              alt={model.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12
              }}
            />
          ) : (
            <SmartToyIcon sx={{ fontSize: 80, color: theme.palette.primary.main }} />
          )}
        </Box>
        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: { xs: 1, sm: 2 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar src={model.icon || sampleIcon} sx={{ width: 56, height: 56, mr: 2, bgcolor: '#4CAF50' }} />
            <Box>
              <Typography gutterBottom variant="h6" component="h2" sx={{ fontWeight: 700, fontSize: 20 }}>
                {model.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: 15 }}>
                by {model.creator || 'Unknown'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                <Rating value={model.rating || 0} readOnly size="small" />
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  ({model.rating || 0})
                </Typography>
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, mb: 2, overflowX: 'auto' }}>
            {(model.screenshots && model.screenshots.length > 0 ? model.screenshots : sampleScreenshots).slice(0,2).map((url: string, idx: number) => (
              <img key={idx} src={url} alt={`Screenshot ${idx + 1}`} style={{ width: 80, height: 56, objectFit: 'cover', borderRadius: 8, boxShadow: '0 2px 8px #0001' }} />
            ))}
          </Box>
          <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 1, fontSize: 15 }}>
            {model.description}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <Button
              variant="contained"
              color="success"
              sx={{ fontWeight: 600, fontSize: 15, minWidth: 110, py: 1, borderRadius: 2 }}
              startIcon={<DownloadIcon />}
              onClick={(e) => { e.stopPropagation(); handleDownload(model, 'model'); }}
            >
              {model.price === 'Free' ? 'Get Free' : 'Install'}
            </Button>
            <Button
              variant="outlined"
              color="primary"
              sx={{ fontWeight: 600, fontSize: 15, minWidth: 90, py: 1, borderRadius: 2 }}
              onClick={(e) => { e.stopPropagation(); handleOpenDetail(model, 'model'); }}
            >
              Details
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  ));

  const handleOpenDetail = async (item: any, type: 'model' | 'agent') => {
    setDetailItem(item);
    setDetailType(type);
    setDetailOpen(true);
    // Fetch reviews
    const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/api/${type === 'model' ? 'models' : 'agents'}/${item.id || item.model_id || item.agent_id}/reviews`);
    const reviews = await res.json();
    setDetailReviews(reviews);
    // Set ownership and review eligibility (mock for now)
    setIsOwner(!!userId && item.user_id === userId);
    setCanReview(true); // TODO: check eligibility from backend
  };

  const handleCloseDetail = () => setDetailOpen(false);

  const handleBuy = () => {/* ... */};
  const handleSubmitReview = async (review: { rating: number; text: string }) => {
    if (!detailItem) return;
    await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/api/${detailType === 'model' ? 'models' : 'agents'}/${detailItem.id || detailItem.model_id || detailItem.agent_id}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ ...review, username: 'User' }) // TODO: get username from auth
    });
    // Refresh reviews
    const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/api/${detailType === 'model' ? 'models' : 'agents'}/${detailItem.id || detailItem.model_id || detailItem.agent_id}/reviews`);
    const reviews = await res.json();
    setDetailReviews(reviews);
  };
  const handleUploadScreenshot = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', detailType);
    await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/api/upload-screenshot`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: formData
    }).then(async res => {
      const data = await res.json();
      if (data.url) {
        // Update item screenshots
        const updatedScreenshots = [...(detailItem.screenshots || []), data.url];
        await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/api/${detailType === 'model' ? 'models' : 'agents'}/${detailItem.id || detailItem.model_id || detailItem.agent_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify({ screenshots: updatedScreenshots })
        });
        detailItem.screenshots = updatedScreenshots;
      }
    });
  };

  const renderModelCard = (model: Model) => (
    <Card onClick={() => handleOpenDetail(model, 'model')} sx={{ cursor: 'pointer' }}>
      <ModelCard
        model={model}
        onFavorite={handleFavorite}
        isFavorite={favoriteModels.includes(model.model_id)}
        onTryDemo={(m) => {/* TODO: Implement demo logic */}}
        onBuy={handleDirectPayment}
        onDownload={(m) => handleDownload(m, 'model')}
      />
    </Card>
  );

  const renderAgentCard = (agent: Agent) => {
    const screenshots = Array.isArray((agent as Agent & { screenshots?: string[] }).screenshots)
      ? (agent as Agent & { screenshots?: string[] }).screenshots!
      : [];
    return (
      <Grid item xs={12} sm={6} md={4} lg={3} key={agent.agent_id}>
        <Card
          sx={{
            borderRadius: 4,
            boxShadow: 3,
            transition: 'box-shadow 0.2s',
            '&:hover': { boxShadow: 8 },
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar src={(agent as Agent & { icon?: string }).icon || sampleIcon} sx={{ width: 56, height: 56, mr: 2, bgcolor: '#4CAF50' }} />
              <Box>
                <Typography gutterBottom variant="h6" component="h2" sx={{ fontWeight: 700, fontSize: 20 }}>
                  {agent.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: 15 }}>
                  by {agent.creator || (agent as Agent & { user_id?: string }).user_id || 'Unknown'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                  <Rating value={agent.rating || 0} readOnly size="small" />
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    ({agent.rating || 0})
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, overflowX: 'auto' }}>
              {(screenshots.length > 0 ? screenshots : sampleScreenshots).slice(0,2).map((url: string, idx: number) => (
                <img key={idx} src={url} alt={`Screenshot ${idx + 1}`} style={{ width: 80, height: 56, objectFit: 'cover', borderRadius: 8, boxShadow: '0 2px 8px #0001' }} />
              ))}
            </Box>
            <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 1, fontSize: 15 }}>
              {agent.description}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <Button
                variant="contained"
                color="success"
                sx={{ fontWeight: 600, fontSize: 15, minWidth: 110, py: 1, borderRadius: 2 }}
                startIcon={<DownloadIcon />}
                onClick={(e) => { e.stopPropagation(); handleDownload(agent, 'agent'); }}
              >
                {agent.price === 'Free' ? 'Get Free' : 'Install'}
              </Button>
              <Button
                variant="outlined"
                color="primary"
                sx={{ fontWeight: 600, fontSize: 15, minWidth: 90, py: 1, borderRadius: 2 }}
                onClick={(e) => { e.stopPropagation(); handleOpenDetail(agent, 'agent'); }}
              >
                Details
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    );
  };

  console.log('models:', models);
  console.log('agents:', agents);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 800, letterSpacing: 1 }}>
            AI Model Foundry Store
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Discover and deploy the latest AI models and agents
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
          onClick={handleRefresh}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>
      {/* Search and Filters */}
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
        <TextField
          label="Search models..."
          variant="outlined"
          size="small"
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ minWidth: 220 }}
        />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Type</InputLabel>
          <Select value={filterType} onChange={e => setFilterType(e.target.value)} label="Type">
            <MenuItem value="">All Types</MenuItem>
            <MenuItem value="transformer">Transformer</MenuItem>
            <MenuItem value="cnn">CNN</MenuItem>
            <MenuItem value="rnn">RNN</MenuItem>
            <MenuItem value="lstm">LSTM</MenuItem>
            <MenuItem value="custom">Custom</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Price</InputLabel>
          <Select value={filterPrice} onChange={e => setFilterPrice(e.target.value)} label="Price">
            <MenuItem value="">All Prices</MenuItem>
            <MenuItem value="Free">Free</MenuItem>
            <MenuItem value="$9.99">$9.99</MenuItem>
            <MenuItem value="$19.99">$19.99</MenuItem>
            <MenuItem value="$49.99">$49.99</MenuItem>
            <MenuItem value="$99.99">$99.99</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Rating</InputLabel>
          <Select value={filterRating} onChange={e => setFilterRating(e.target.value)} label="Rating">
            <MenuItem value="">All Ratings</MenuItem>
            <MenuItem value="4">4+ stars</MenuItem>
            <MenuItem value="3">3+ stars</MenuItem>
            <MenuItem value="2">2+ stars</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="store categories"
          variant="scrollable"
          scrollButtons="auto"
          TabIndicatorProps={{
            sx: {
              transition: 'all 0.4s cubic-bezier(.4,2,.6,1)',
              height: 4,
              borderRadius: 2,
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            },
          }}
        >
          <Tab label={`AI Models (${models.length})`} />
          <Tab label={`AI Agents (${agents.length})`} />
        </Tabs>
      </Box>
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3} justifyContent="flex-start" alignItems="stretch">
          {!loading && filteredModels.length > 0 ? (
            filteredModels.map((model) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={model.model_id}>
                <Card
                  sx={{
                    borderRadius: 4,
                    boxShadow: 3,
                    transition: 'box-shadow 0.2s',
                    '&:hover': { boxShadow: 8 },
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar src={model.icon || sampleIcon} sx={{ width: 56, height: 56, mr: 2, bgcolor: '#4CAF50' }} />
                      <Box>
                        <Typography gutterBottom variant="h6" component="h2" sx={{ fontWeight: 700, fontSize: 20 }}>
                          {model.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: 15 }}>
                          by {model.creator || 'Unknown'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          <Rating value={model.rating || 0} readOnly size="small" />
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            ({model.rating || 0})
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2, overflowX: 'auto' }}>
                      {(model.screenshots && model.screenshots.length > 0 ? model.screenshots : sampleScreenshots).slice(0,2).map((url: string, idx: number) => (
                        <img key={idx} src={url} alt={`Screenshot ${idx + 1}`} style={{ width: 80, height: 56, objectFit: 'cover', borderRadius: 8, boxShadow: '0 2px 8px #0001' }} />
                      ))}
                    </Box>
                    <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 1, fontSize: 15 }}>
                      {model.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                      <Button
                        variant="contained"
                        color="success"
                        sx={{ fontWeight: 600, fontSize: 15, minWidth: 110, py: 1, borderRadius: 2 }}
                        startIcon={<DownloadIcon />}
                        onClick={(e) => { e.stopPropagation(); handleDownload(model, 'model'); }}
                      >
                        {model.price === 'Free' ? 'Get Free' : 'Install'}
                      </Button>
                      <Button
                        variant="outlined"
                        color="primary"
                        sx={{ fontWeight: 600, fontSize: 15, minWidth: 90, py: 1, borderRadius: 2 }}
                        onClick={(e) => { e.stopPropagation(); handleOpenDetail(model, 'model'); }}
                      >
                        Details
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : !loading ? (
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary">
                  No public models available yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Be the first to publish an AI model!
                </Typography>
              </Box>
            </Grid>
          ) : null}
          {filteredModels.length === 0 && (
            <div style={{ textAlign: 'center', margin: '2rem 0' }}>No models found.</div>
          )}
        </Grid>
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3} justifyContent="flex-start" alignItems="stretch">
          {!loading && filteredAgents.length > 0 ? (
            filteredAgents.map((agent) => renderAgentCard(agent))
          ) : !loading ? (
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary">
                  No public agents available yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Be the first to publish an AI agent!
                </Typography>
              </Box>
            </Grid>
          ) : null}
          {filteredAgents.length === 0 && (
            <div style={{ textAlign: 'center', margin: '2rem 0' }}>No agents found.</div>
          )}
        </Grid>
      </TabPanel>
      
      {renderPaymentDialog()}
      
      {/* Payment Dialog for Downloads */}
      <PaymentDialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        item={selectedItemForPayment}
        onPaymentSuccess={handlePaymentSuccess}
      />
      
      <StorefrontDetail
        open={detailOpen}
        onClose={handleCloseDetail}
        item={detailItem}
        type={detailType}
        userId={userId}
        isOwner={isOwner}
        canReview={canReview}
        onBuy={handleBuy}
        onDownload={() => handleDownload(detailItem, detailType)}
        onSubmitReview={handleSubmitReview}
        onUploadScreenshot={handleUploadScreenshot}
      />
    </Container>
  );
};

export default AppStorefront; 
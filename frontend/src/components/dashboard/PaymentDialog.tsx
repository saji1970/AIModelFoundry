import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  CreditCard as CreditCardIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckCircleIcon,
  Download as DownloadIcon
} from '@mui/icons-material';

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  item: {
    name: string;
    price: string;
    type: 'model' | 'agent';
    id: string;
    description?: string;
    imageUrl?: string;
  } | null;
  onPaymentSuccess: (itemId: string, type: 'model' | 'agent') => void;
}

interface PaymentFormData {
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
  email: string;
}

const PaymentDialog: React.FC<PaymentDialogProps> = ({
  open,
  onClose,
  item,
  onPaymentSuccess
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentForm, setPaymentForm] = useState<PaymentFormData>({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: '',
    email: ''
  });

  const steps = ['Review Item', 'Payment Details', 'Processing', 'Download'];

  const handleInputChange = (field: keyof PaymentFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setPaymentForm({
      ...paymentForm,
      [field]: event.target.value
    });
  };

  const handlePaymentSubmit = async () => {
    if (!item) return;

    setLoading(true);
    setError(null);

    try {
      // Call the actual payment API
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/api/payment/process`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          itemId: item.id,
          itemType: item.type,
          amount: item.price,
          paymentDetails: paymentForm
        })
      });

      if (response.ok) {
        const result = await response.json();
        setActiveStep(2);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setActiveStep(3);
        
        // Call the success callback
        onPaymentSuccess(item.id, item.type);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Payment failed. Please try again.');
      }
    } catch (err) {
      setError('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setError(null);
    setPaymentForm({
      cardNumber: '',
      cardHolder: '',
      expiryDate: '',
      cvv: '',
      email: ''
    });
    onClose();
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Your Purchase
            </Typography>
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6">{item?.name}</Typography>
                <Typography color="textSecondary" gutterBottom>
                  {item?.description}
                </Typography>
                <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
                  {item?.price}
                </Typography>
              </CardContent>
            </Card>
            <Button
              variant="contained"
              fullWidth
              onClick={() => setActiveStep(1)}
              startIcon={<PaymentIcon />}
            >
              Proceed to Payment
            </Button>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Payment Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Card Number"
                  value={paymentForm.cardNumber}
                  onChange={handleInputChange('cardNumber')}
                  placeholder="1234 5678 9012 3456"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Cardholder Name"
                  value={paymentForm.cardHolder}
                  onChange={handleInputChange('cardHolder')}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Expiry Date"
                  value={paymentForm.expiryDate}
                  onChange={handleInputChange('expiryDate')}
                  placeholder="MM/YY"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="CVV"
                  value={paymentForm.cvv}
                  onChange={handleInputChange('cvv')}
                  placeholder="123"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={paymentForm.email}
                  onChange={handleInputChange('email')}
                />
              </Grid>
            </Grid>
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => setActiveStep(0)}
                fullWidth
              >
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handlePaymentSubmit}
                disabled={loading}
                fullWidth
                startIcon={loading ? <CircularProgress size={20} /> : <PaymentIcon />}
              >
                {loading ? 'Processing...' : 'Pay Now'}
              </Button>
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Processing Payment...
            </Typography>
            <Typography color="textSecondary">
              Please wait while we process your payment securely.
            </Typography>
          </Box>
        );

      case 3:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Payment Successful!
            </Typography>
            <Typography color="textSecondary" gutterBottom>
              Your payment has been processed successfully.
            </Typography>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => {
                // Trigger download
                const token = localStorage.getItem('access_token');
                const url = `${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001'}/api/${item?.type}s/${item?.id}/download`;
                
                fetch(url, {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                })
                .then(response => response.blob())
                .then(blob => {
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${item?.name}.zip`;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                })
                .catch(err => {
                  console.error('Download failed:', err);
                });
              }}
              sx={{ mt: 2 }}
            >
              Download {item?.type === 'model' ? 'Model' : 'Agent'}
            </Button>
          </Box>
        );

      default:
        return null;
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CreditCardIcon />
          <Typography variant="h6">
            Purchase {item.type === 'model' ? 'Model' : 'Agent'}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        <Divider sx={{ mb: 3 }} />
        {renderStepContent()}
      </DialogContent>
      <DialogActions>
        {activeStep < 3 && (
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
        )}
        {activeStep === 3 && (
          <Button onClick={handleClose} variant="contained">
            Close
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PaymentDialog; 
import React, { useState } from 'react';
import {
  Box, Typography, Card, CardContent, CardMedia, Button, Chip, Avatar, Divider, Grid, Rating, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, useTheme, Tooltip
} from '@mui/material';
import { Download as DownloadIcon, MonetizationOn as MonetizationIcon, Star as StarIcon, AddPhotoAlternate as AddPhotoIcon } from '@mui/icons-material';
import Carousel from 'react-material-ui-carousel';

interface Review {
  user_id: string;
  username: string;
  rating: number;
  text: string;
  date: string;
}

interface StorefrontDetailProps {
  open: boolean;
  onClose: () => void;
  item: any; // model or agent
  type: 'model' | 'agent';
  userId: string;
  isOwner: boolean;
  canReview: boolean;
  onBuy: () => void;
  onDownload: () => void;
  onSubmitReview: (review: { rating: number; text: string }) => void;
  onUploadScreenshot: (file: File) => void;
}

const StorefrontDetail: React.FC<StorefrontDetailProps> = ({
  open, onClose, item, type, userId, isOwner, canReview, onBuy, onDownload, onSubmitReview, onUploadScreenshot
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [uploading, setUploading] = useState(false);
  if (!item) return null;

  const screenshots: string[] = item.screenshots || [];
  const reviews: Review[] = item.reviews || [];

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploading(true);
      await onUploadScreenshot(e.target.files[0]);
      setUploading(false);
    }
  };

  const sampleIcon = 'https://placehold.co/96x96/4CAF50/fff?text=AI';
  const sampleScreenshots = [
    'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80'
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar src={item.icon || sampleIcon} sx={{ width: 72, height: 72, mr: 2, bgcolor: '#4CAF50' }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>{item.name}</Typography>
            <Typography variant="body2" color="text.secondary">by {item.user_id || 'Unknown'}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
              <Rating value={item.rating || 0} readOnly size="small" />
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                ({item.rating || 0})
              </Typography>
            </Box>
          </Box>
          <Box sx={{ ml: 'auto' }}>
            <Button variant="contained" color="success" size="large" sx={{ borderRadius: 3, fontWeight: 'bold' }}>
              {item.price === 'Free' ? 'Get Free' : 'Install'}
            </Button>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ minWidth: 400, maxWidth: 600, p: 3 }}>
        <Carousel autoPlay={false} navButtonsAlwaysVisible sx={{ mb: 2 }}>
          {(item.screenshots && item.screenshots.length > 0 ? item.screenshots : sampleScreenshots).map((url: string, idx: number) => (
            <Box key={idx} sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: 2 }}>
              <img src={url} alt={`Screenshot ${idx + 1}`} style={{ width: '100%', height: 250, objectFit: 'cover' }} />
            </Box>
          ))}
        </Carousel>
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" sx={{ mb: 1 }}>About this app</Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>{item.description}</Typography>
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" sx={{ mb: 1 }}>Information</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <Chip label={`Version: ${item.version || '1.0.0'}`} />
          <Chip label={`Developer: ${item.user_id || 'Unknown'}`} />
          <Chip label={`Project: ${item.project_id || 'N/A'}`} />
          <Chip label={`ID: ${item.id || item.model_id || item.agent_id || 'N/A'}`} />
          {/* Add more info fields as needed */}
        </Box>
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" sx={{ mb: 1 }}>Reviews</Typography>
        {item.reviews && item.reviews.length > 0 ? (
          item.reviews.map((review: Review, idx: number) => (
            <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
              <Avatar sx={{ mr: 2 }}>{review.username ? review.username[0] : '?'}</Avatar>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="subtitle2" sx={{ mr: 1 }}>{review.username || 'User'}</Typography>
                  <Rating value={review.rating} readOnly size="small" sx={{ mr: 1 }} />
                  <Typography variant="caption" color="text.secondary">{new Date(review.date).toLocaleDateString()}</Typography>
                </Box>
                <Typography variant="body2">{review.text}</Typography>
              </Box>
            </Box>
          ))
        ) : (
          <Typography variant="body2" color="text.secondary">No reviews yet.</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default StorefrontDetail; 
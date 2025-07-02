from typing import Dict, Any, Optional
import torch
import torch.nn as nn
from transformers import AutoModel, AutoTokenizer
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ModelFoundry:
    """A factory class for creating and managing AI models."""
    
    def __init__(self):
        self.models: Dict[str, Any] = {}
        self.tokenizers: Dict[str, Any] = {}
        
    def create_model(self, 
                    model_name: str, 
                    model_type: str = "transformer",
                    config: Optional[Dict[str, Any]] = None) -> Any:
        """
        Create a new AI model.
        
        Args:
            model_name: Name of the model
            model_type: Type of model (transformer, custom, etc.)
            config: Configuration parameters for the model
            
        Returns:
            The created model
        """
        try:
            if model_type == "transformer":
                model = AutoModel.from_pretrained(model_name)
                tokenizer = AutoTokenizer.from_pretrained(model_name)
                self.models[model_name] = model
                self.tokenizers[model_name] = tokenizer
                logger.info(f"Created transformer model: {model_name}")
                return model
            else:
                raise ValueError(f"Unsupported model type: {model_type}")
        except Exception as e:
            logger.error(f"Error creating model {model_name}: {str(e)}")
            raise
            
    def get_model(self, model_name: str) -> Any:
        """Retrieve a model by name."""
        if model_name not in self.models:
            raise KeyError(f"Model {model_name} not found")
        return self.models[model_name]
    
    def get_tokenizer(self, model_name: str) -> Any:
        """Retrieve a tokenizer by model name."""
        if model_name not in self.tokenizers:
            raise KeyError(f"Tokenizer for model {model_name} not found")
        return self.tokenizers[model_name]
    
    def list_models(self) -> list:
        """List all available models."""
        return list(self.models.keys()) 
import torch
import torch.nn as nn
from transformers import AutoModel, AutoTokenizer
import numpy as np
from typing import Dict, Any, List, Optional

class ExampleModel:
    """An example AI model for text classification."""
    
    def __init__(self, model_name: str = "bert-base-uncased"):
        self.model_name = model_name
        self.model = AutoModel.from_pretrained(model_name)
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.classifier = nn.Linear(768, 2)  # Binary classification
        
    def preprocess(self, text: str) -> Dict[str, torch.Tensor]:
        """Preprocess input text."""
        return self.tokenizer(
            text,
            padding=True,
            truncation=True,
            max_length=512,
            return_tensors="pt"
        )
    
    def predict(self, text: str) -> Dict[str, Any]:
        """Make a prediction on input text."""
        inputs = self.preprocess(text)
        with torch.no_grad():
            outputs = self.model(**inputs)
            pooled_output = outputs.last_hidden_state[:, 0, :]
            logits = self.classifier(pooled_output)
            probabilities = torch.softmax(logits, dim=1)
            
        return {
            "prediction": torch.argmax(probabilities, dim=1).item(),
            "confidence": probabilities.max().item(),
            "probabilities": probabilities.tolist()
        }
    
    def train(self, 
             train_texts: List[str],
             train_labels: List[int],
             epochs: int = 3,
             batch_size: int = 16,
             learning_rate: float = 2e-5) -> Dict[str, List[float]]:
        """Train the model on provided data."""
        optimizer = torch.optim.AdamW(self.model.parameters(), lr=learning_rate)
        criterion = nn.CrossEntropyLoss()
        
        train_losses = []
        for epoch in range(epochs):
            epoch_losses = []
            for i in range(0, len(train_texts), batch_size):
                batch_texts = train_texts[i:i + batch_size]
                batch_labels = torch.tensor(train_labels[i:i + batch_size])
                
                inputs = self.preprocess(batch_texts)
                outputs = self.model(**inputs)
                pooled_output = outputs.last_hidden_state[:, 0, :]
                logits = self.classifier(pooled_output)
                
                loss = criterion(logits, batch_labels)
                optimizer.zero_grad()
                loss.backward()
                optimizer.step()
                
                epoch_losses.append(loss.item())
            
            avg_epoch_loss = np.mean(epoch_losses)
            train_losses.append(avg_epoch_loss)
            print(f"Epoch {epoch + 1}/{epochs}, Loss: {avg_epoch_loss:.4f}")
        
        return {"train_losses": train_losses}
    
    def save(self, path: str):
        """Save the model to disk."""
        torch.save({
            'model_state_dict': self.model.state_dict(),
            'classifier_state_dict': self.classifier.state_dict(),
            'model_name': self.model_name
        }, path)
    
    @classmethod
    def load(cls, path: str) -> 'ExampleModel':
        """Load the model from disk."""
        checkpoint = torch.load(path)
        model = cls(model_name=checkpoint['model_name'])
        model.model.load_state_dict(checkpoint['model_state_dict'])
        model.classifier.load_state_dict(checkpoint['classifier_state_dict'])
        return model 
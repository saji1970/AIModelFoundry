from typing import Dict, Any, List, Optional
import json
from pathlib import Path
import torch
from ..models.example_model import ExampleModel

class ExampleAgent:
    """An example AI agent that uses the ExampleModel for text classification."""
    
    def __init__(self, 
                 model_path: Optional[str] = None,
                 config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.model = None
        self.state = {}
        
        if model_path:
            self.load_model(model_path)
    
    def load_model(self, model_path: str):
        """Load the model from disk."""
        self.model = ExampleModel.load(model_path)
    
    def initialize(self, **kwargs):
        """Initialize the agent with configuration."""
        self.state.update(kwargs)
        return {"status": "initialized", "state": self.state}
    
    def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process input data and return results."""
        if not self.model:
            raise ValueError("Model not loaded. Call load_model first.")
        
        text = input_data.get("text", "")
        if not text:
            return {"error": "No text provided"}
        
        # Make prediction
        result = self.model.predict(text)
        
        # Add agent-specific processing
        processed_result = {
            "prediction": result["prediction"],
            "confidence": result["confidence"],
            "agent_state": self.state,
            "metadata": {
                "model_name": self.model.model_name,
                "processing_time": result.get("processing_time", 0)
            }
        }
        
        return processed_result
    
    def train(self, 
             training_data: List[Dict[str, Any]],
             **kwargs) -> Dict[str, Any]:
        """Train the agent on provided data."""
        if not self.model:
            raise ValueError("Model not loaded. Call load_model first.")
        
        texts = [item["text"] for item in training_data]
        labels = [item["label"] for item in training_data]
        
        training_result = self.model.train(
            texts,
            labels,
            epochs=kwargs.get("epochs", 3),
            batch_size=kwargs.get("batch_size", 16),
            learning_rate=kwargs.get("learning_rate", 2e-5)
        )
        
        return {
            "status": "trained",
            "training_losses": training_result["train_losses"],
            "final_loss": training_result["train_losses"][-1]
        }
    
    def save(self, path: str):
        """Save the agent state and model."""
        save_path = Path(path)
        save_path.mkdir(parents=True, exist_ok=True)
        
        # Save model
        if self.model:
            self.model.save(str(save_path / "model.pt"))
        
        # Save agent state and config
        agent_data = {
            "config": self.config,
            "state": self.state
        }
        with open(save_path / "agent.json", "w") as f:
            json.dump(agent_data, f, indent=4)
    
    @classmethod
    def load(cls, path: str) -> 'ExampleAgent':
        """Load the agent from disk."""
        load_path = Path(path)
        
        # Load agent state and config
        with open(load_path / "agent.json", "r") as f:
            agent_data = json.load(f)
        
        # Create agent instance
        agent = cls(config=agent_data["config"])
        agent.state = agent_data["state"]
        
        # Load model if it exists
        model_path = load_path / "model.pt"
        if model_path.exists():
            agent.load_model(str(model_path))
        
        return agent 
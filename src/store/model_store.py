from typing import Dict, List, Optional
import json
from pathlib import Path
from datetime import datetime
import shutil
import os

class ModelStore:
    def __init__(self):
        self.store_dir = Path("data/model_store")
        self.store_dir.mkdir(parents=True, exist_ok=True)
        self.models_file = self.store_dir / "models.json"
        self.models = self._load_models()

    def _load_models(self) -> Dict:
        if self.models_file.exists():
            with open(self.models_file, 'r') as f:
                return json.load(f)
        return {}

    def _save_models(self):
        with open(self.models_file, 'w') as f:
            json.dump(self.models, f, indent=4)

    def add_model(self, 
                 model_id: str,
                 name: str,
                 description: str,
                 creator: str,
                 model_path: str,
                 model_type: str,
                 tags: List[str],
                 version: str = "1.0.0",
                 apple_store_url: Optional[str] = None,
                 google_play_url: Optional[str] = None,
                 custom_payment_url: Optional[str] = None,
                 public: bool = False,
                 integration: Optional[str] = None) -> Dict:
        """Add a new model to the store."""
        if model_id in self.models:
            raise ValueError("Model ID already exists")

        model_data = {
            "name": name,
            "description": description,
            "creator": creator,
            "model_type": model_type,
            "tags": tags,
            "version": version,
            "created_at": datetime.now().isoformat(),
            "downloads": 0,
            "rating": 0.0,
            "reviews": [],
            "apple_store_url": apple_store_url,
            "google_play_url": google_play_url,
            "custom_payment_url": custom_payment_url,
            "public": public,
            "integration": integration
        }

        # Copy model files to store
        store_model_path = self.store_dir / model_id
        store_model_path.mkdir(exist_ok=True)
        shutil.copytree(model_path, store_model_path, dirs_exist_ok=True)

        self.models[model_id] = model_data
        self._save_models()
        return model_data

    def get_model(self, model_id: str) -> Optional[Dict]:
        """Get model information."""
        return self.models.get(model_id)

    def list_models(self, 
                   model_type: Optional[str] = None,
                   tags: Optional[List[str]] = None) -> List[Dict]:
        """List available models with optional filtering."""
        filtered_models = []
        
        for model_id, model in self.models.items():
            if model_type and model["model_type"] != model_type:
                continue
            if tags and not all(tag in model["tags"] for tag in tags):
                continue
            filtered_models.append({"model_id": model_id, **model})
            
        return filtered_models

    def download_model(self, model_id: str, destination: str) -> bool:
        """Download a model from the store."""
        if model_id not in self.models:
            return False

        source_path = self.store_dir / model_id
        if not source_path.exists():
            return False

        shutil.copytree(source_path, destination, dirs_exist_ok=True)
        self.models[model_id]["downloads"] += 1
        self._save_models()
        return True

    def add_review(self, model_id: str, username: str, rating: float, comment: str):
        """Add a review for a model."""
        if model_id not in self.models:
            raise ValueError("Model not found")

        review = {
            "username": username,
            "rating": rating,
            "comment": comment,
            "created_at": datetime.now().isoformat()
        }

        self.models[model_id]["reviews"].append(review)
        
        # Update average rating
        ratings = [r["rating"] for r in self.models[model_id]["reviews"]]
        self.models[model_id]["rating"] = sum(ratings) / len(ratings)
        
        self._save_models()

    def set_public(self, model_id: str, public: bool, current_user: str) -> Dict:
        if model_id not in self.models:
            raise ValueError("Model not found")
        if self.models[model_id]["creator"] != current_user:
            raise ValueError("Not authorized")
        self.models[model_id]["public"] = public
        self._save_models()
        return self.models[model_id]

    def list_public_models(self) -> List[Dict]:
        return [
            {"model_id": model_id, **model}
            for model_id, model in self.models.items()
            if model.get("public")
        ] 
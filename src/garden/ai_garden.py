from typing import Dict, List, Optional
import json
from pathlib import Path
from datetime import datetime
import shutil
import os

class AIGarden:
    def __init__(self):
        self.garden_dir = Path("data/ai_garden")
        self.garden_dir.mkdir(parents=True, exist_ok=True)
        self.garden_file = self.garden_dir / "garden.json"
        self.garden = self._load_garden()

    def _load_garden(self) -> Dict:
        if self.garden_file.exists():
            with open(self.garden_file, 'r') as f:
                return json.load(f)
        return {"collections": {}, "exhibits": {}}

    def _save_garden(self):
        with open(self.garden_file, 'w') as f:
            json.dump(self.garden, f, indent=4)

    def create_collection(self,
                         collection_id: str,
                         name: str,
                         description: str,
                         curator: str,
                         tags: List[str]) -> Dict:
        """Create a new collection in the AI Garden."""
        if collection_id in self.garden["collections"]:
            raise ValueError("Collection ID already exists")

        collection = {
            "name": name,
            "description": description,
            "curator": curator,
            "tags": tags,
            "created_at": datetime.now().isoformat(),
            "models": [],
            "exhibits": []
        }

        self.garden["collections"][collection_id] = collection
        self._save_garden()
        return collection

    def add_model_to_collection(self,
                              collection_id: str,
                              model_id: str,
                              description: str) -> bool:
        """Add a model to a collection."""
        if collection_id not in self.garden["collections"]:
            return False

        model_entry = {
            "model_id": model_id,
            "description": description,
            "added_at": datetime.now().isoformat()
        }

        self.garden["collections"][collection_id]["models"].append(model_entry)
        self._save_garden()
        return True

    def create_exhibit(self,
                      exhibit_id: str,
                      name: str,
                      description: str,
                      curator: str,
                      collection_id: str,
                      start_date: str,
                      end_date: str) -> Dict:
        """Create a new exhibit in the AI Garden."""
        if exhibit_id in self.garden["exhibits"]:
            raise ValueError("Exhibit ID already exists")
        if collection_id not in self.garden["collections"]:
            raise ValueError("Collection not found")

        exhibit = {
            "name": name,
            "description": description,
            "curator": curator,
            "collection_id": collection_id,
            "start_date": start_date,
            "end_date": end_date,
            "created_at": datetime.now().isoformat(),
            "visitors": 0,
            "comments": []
        }

        self.garden["exhibits"][exhibit_id] = exhibit
        self.garden["collections"][collection_id]["exhibits"].append(exhibit_id)
        self._save_garden()
        return exhibit

    def list_collections(self,
                        curator: Optional[str] = None,
                        tags: Optional[List[str]] = None) -> List[Dict]:
        """List collections with optional filtering."""
        filtered_collections = []
        
        for collection_id, collection in self.garden["collections"].items():
            if curator and collection["curator"] != curator:
                continue
            if tags and not all(tag in collection["tags"] for tag in tags):
                continue
            filtered_collections.append({"collection_id": collection_id, **collection})
            
        return filtered_collections

    def list_exhibits(self,
                     collection_id: Optional[str] = None,
                     curator: Optional[str] = None) -> List[Dict]:
        """List exhibits with optional filtering."""
        filtered_exhibits = []
        
        for exhibit_id, exhibit in self.garden["exhibits"].items():
            if collection_id and exhibit["collection_id"] != collection_id:
                continue
            if curator and exhibit["curator"] != curator:
                continue
            filtered_exhibits.append({"exhibit_id": exhibit_id, **exhibit})
            
        return filtered_exhibits

    def add_comment(self, exhibit_id: str, username: str, comment: str):
        """Add a comment to an exhibit."""
        if exhibit_id not in self.garden["exhibits"]:
            raise ValueError("Exhibit not found")

        comment_entry = {
            "username": username,
            "comment": comment,
            "created_at": datetime.now().isoformat()
        }

        self.garden["exhibits"][exhibit_id]["comments"].append(comment_entry)
        self._save_garden() 
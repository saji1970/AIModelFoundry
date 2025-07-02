from typing import Dict, List, Optional
import json
from pathlib import Path
from datetime import datetime
import shutil
import os

class AgentStore:
    def __init__(self):
        self.store_dir = Path("data/agent_store")
        self.store_dir.mkdir(parents=True, exist_ok=True)
        self.agents_file = self.store_dir / "agents.json"
        self.agents = self._load_agents()

    def _load_agents(self) -> Dict:
        if self.agents_file.exists():
            with open(self.agents_file, 'r') as f:
                return json.load(f)
        return {}

    def _save_agents(self):
        with open(self.agents_file, 'w') as f:
            json.dump(self.agents, f, indent=4)

    def add_agent(self,
                 agent_id: str,
                 name: str,
                 description: str,
                 creator: str,
                 agent_path: str,
                 agent_type: str,
                 required_models: List[str],
                 tags: List[str],
                 version: str = "1.0.0",
                 apple_store_url: Optional[str] = None,
                 google_play_url: Optional[str] = None,
                 custom_payment_url: Optional[str] = None,
                 public: bool = False,
                 integration: Optional[str] = None) -> Dict:
        """Add a new agent to the store."""
        if agent_id in self.agents:
            raise ValueError("Agent ID already exists")

        agent_data = {
            "name": name,
            "description": description,
            "creator": creator,
            "agent_type": agent_type,
            "required_models": required_models,
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

        # Copy agent files to store
        store_agent_path = self.store_dir / agent_id
        store_agent_path.mkdir(exist_ok=True)
        shutil.copytree(agent_path, store_agent_path, dirs_exist_ok=True)

        self.agents[agent_id] = agent_data
        self._save_agents()
        return agent_data

    def get_agent(self, agent_id: str) -> Optional[Dict]:
        """Get agent information."""
        return self.agents.get(agent_id)

    def list_agents(self,
                   agent_type: Optional[str] = None,
                   tags: Optional[List[str]] = None) -> List[Dict]:
        """List available agents with optional filtering."""
        filtered_agents = []
        
        for agent_id, agent in self.agents.items():
            if agent_type and agent["agent_type"] != agent_type:
                continue
            if tags and not all(tag in agent["tags"] for tag in tags):
                continue
            filtered_agents.append({"agent_id": agent_id, **agent})
            
        return filtered_agents

    def download_agent(self, agent_id: str, destination: str) -> bool:
        """Download an agent from the store."""
        if agent_id not in self.agents:
            return False

        source_path = self.store_dir / agent_id
        if not source_path.exists():
            return False

        shutil.copytree(source_path, destination, dirs_exist_ok=True)
        self.agents[agent_id]["downloads"] += 1
        self._save_agents()
        return True

    def add_review(self, agent_id: str, username: str, rating: float, comment: str):
        """Add a review for an agent."""
        if agent_id not in self.agents:
            raise ValueError("Agent not found")

        review = {
            "username": username,
            "rating": rating,
            "comment": comment,
            "created_at": datetime.now().isoformat()
        }

        self.agents[agent_id]["reviews"].append(review)
        
        # Update average rating
        ratings = [r["rating"] for r in self.agents[agent_id]["reviews"]]
        self.agents[agent_id]["rating"] = sum(ratings) / len(ratings)
        
        self._save_agents()

    def set_public(self, agent_id: str, public: bool, current_user: str) -> Dict:
        if agent_id not in self.agents:
            raise ValueError("Agent not found")
        if self.agents[agent_id]["creator"] != current_user:
            raise ValueError("Not authorized")
        self.agents[agent_id]["public"] = public
        self._save_agents()
        return self.agents[agent_id]

    def list_public_agents(self) -> List[Dict]:
        return [
            {"agent_id": agent_id, **agent}
            for agent_id, agent in self.agents.items()
            if agent.get("public")
        ] 
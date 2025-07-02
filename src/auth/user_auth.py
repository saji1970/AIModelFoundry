from typing import Optional, Dict
import hashlib
import jwt
from datetime import datetime, timedelta
import os
from pathlib import Path
import json

class UserAuth:
    def __init__(self):
        self.users_file = Path("data/users.json")
        self.users_file.parent.mkdir(parents=True, exist_ok=True)
        self.secret_key = os.getenv("JWT_SECRET_KEY", "your-secret-key")
        self.users = self._load_users()

    def _load_users(self) -> Dict:
        if self.users_file.exists():
            with open(self.users_file, 'r') as f:
                return json.load(f)
        return {}

    def _save_users(self):
        with open(self.users_file, 'w') as f:
            json.dump(self.users, f, indent=4)

    def register_user(self, username: str, email: str, password: str) -> Dict:
        """Register a new user."""
        if username in self.users:
            raise ValueError("Username already exists")

        hashed_password = hashlib.sha256(password.encode()).hexdigest()
        user_data = {
            "email": email,
            "password": hashed_password,
            "created_at": datetime.now().isoformat(),
            "workspaces": []
        }
        
        self.users[username] = user_data
        self._save_users()
        return {"username": username, "email": email}

    def login(self, username: str, password: str) -> Optional[str]:
        """Login user and return JWT token."""
        if username not in self.users:
            return None

        hashed_password = hashlib.sha256(password.encode()).hexdigest()
        if self.users[username]["password"] != hashed_password:
            return None

        token = jwt.encode({
            "username": username,
            "exp": datetime.utcnow() + timedelta(days=1)
        }, self.secret_key, algorithm="HS256")

        return token

    def verify_token(self, token: str) -> Optional[str]:
        """Verify JWT token and return username."""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=["HS256"])
            return payload["username"]
        except jwt.InvalidTokenError:
            return None

    def create_workspace(self, username: str, workspace_name: str) -> Dict:
        """Create a new workspace for user."""
        if username not in self.users:
            raise ValueError("User not found")

        workspace = {
            "name": workspace_name,
            "created_at": datetime.now().isoformat(),
            "models": [],
            "agents": []
        }

        self.users[username]["workspaces"].append(workspace)
        self._save_users()
        return workspace

    def register_oauth_user(self, username: str, email: str, oauth_provider: str, oauth_id: str) -> Dict:
        """Register or update a user via OAuth."""
        # If user exists, update oauth info
        if username in self.users:
            self.users[username]["oauth_provider"] = oauth_provider
            self.users[username]["oauth_id"] = oauth_id
            self._save_users()
            return {"username": username, "email": email}
        # Otherwise, create new user
        user_data = {
            "email": email,
            "oauth_provider": oauth_provider,
            "oauth_id": oauth_id,
            "created_at": datetime.now().isoformat(),
            "workspaces": []
        }
        self.users[username] = user_data
        self._save_users()
        return {"username": username, "email": email}

    def login_oauth(self, username: str) -> Optional[str]:
        """Login OAuth user and return JWT token."""
        if username not in self.users:
            return None
        token = jwt.encode({
            "username": username,
            "exp": datetime.utcnow() + timedelta(days=1)
        }, self.secret_key, algorithm="HS256")
        return token 
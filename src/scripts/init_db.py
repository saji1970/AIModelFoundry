import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent.parent))

from src.database.database import SessionLocal
from src.database.models import User, Workspace, Model, Agent, Tag, AICollection, AgentCollection, AuditLog
import hashlib
from datetime import datetime

def init_db():
    db = SessionLocal()
    
    try:
        # Create users with roles and OAuth
        users = [
            User(
                username="admin_user",
                email="admin@example.com",
                password_hash=hashlib.sha256("adminpass".encode()).hexdigest(),
                created_at=datetime.utcnow(),
                role="Admin",
                oauth_provider="google",
                oauth_id="google-oauth-admin"
            ),
            User(
                username="dev_user",
                email="dev@example.com",
                password_hash=hashlib.sha256("devpass".encode()).hexdigest(),
                created_at=datetime.utcnow(),
                role="Developer",
                oauth_provider="github",
                oauth_id="github-oauth-dev"
            ),
            User(
                username="viewer_user",
                email="viewer@example.com",
                password_hash=hashlib.sha256("viewerpass".encode()).hexdigest(),
                created_at=datetime.utcnow(),
                role="Viewer"
            )
        ]
        for user in users:
            db.add(user)
        db.commit()
        
        # Create workspaces
        workspaces = [
            Workspace(
                id="admin_workspace",
                name="Admin Workspace",
                user_username="admin_user",
                created_at=datetime.utcnow()
            ),
            Workspace(
                id="dev_workspace",
                name="Developer Workspace",
                user_username="dev_user",
                created_at=datetime.utcnow()
            ),
            Workspace(
                id="viewer_workspace",
                name="Viewer Workspace",
                user_username="viewer_user",
                created_at=datetime.utcnow()
            )
        ]
        for ws in workspaces:
            db.add(ws)
        db.commit()
        
        # Create tags
        tags = [
            Tag(id="nlp", name="Natural Language Processing"),
            Tag(id="classification", name="Classification"),
            Tag(id="bert", name="BERT"),
            Tag(id="text", name="Text Analysis"),
            Tag(id="vision", name="Computer Vision"),
            Tag(id="analytics", name="Analytics")
        ]
        for tag in tags:
            db.add(tag)
        db.commit()
        
        # Create models with monetization, integration, and public flags
        models = [
            Model(
                id="example_classifier",
                name="Example Text Classifier",
                description="A BERT-based text classification model",
                creator="dev_user",
                model_type="transformer",
                version="1.0.0",
                created_at=datetime.utcnow(),
                workspace_id="dev_workspace",
                public=True,
                apple_store_url="https://apps.apple.com/example_classifier",
                google_play_url="https://play.google.com/example_classifier",
                custom_payment_url="https://pay.example.com/model1",
                integration="openai"
            ),
            Model(
                id="vision_model",
                name="Vision Model",
                description="A computer vision model for image classification",
                creator="admin_user",
                model_type="cnn",
                version="2.1.0",
                created_at=datetime.utcnow(),
                workspace_id="admin_workspace",
                public=False,
                integration="vertexai"
            )
        ]
        models[0].tags = [tags[0], tags[1], tags[2]]  # NLP, Classification, BERT
        models[1].tags = [tags[4]]  # Vision
        for model in models:
            db.add(model)
        db.commit()
        
        # Create agents with monetization, integration, and public flags
        agents = [
            Agent(
                id="example_agent",
                name="Example Text Analysis Agent",
                description="An agent that uses BERT for text classification",
                creator="dev_user",
                agent_type="classifier",
                version="1.0.0",
                created_at=datetime.utcnow(),
                required_models=["example_classifier"],
                workspace_id="dev_workspace",
                public=True,
                apple_store_url="https://apps.apple.com/example_agent",
                google_play_url="https://play.google.com/example_agent",
                custom_payment_url="https://pay.example.com/agent1",
                integration="anthropic"
            ),
            Agent(
                id="vision_agent",
                name="Vision Analysis Agent",
                description="Agent for image analysis",
                creator="admin_user",
                agent_type="analyzer",
                version="1.0.0",
                created_at=datetime.utcnow(),
                required_models=["vision_model"],
                workspace_id="admin_workspace",
                public=False,
                integration="vertexai"
            )
        ]
        agents[0].tags = [tags[0], tags[1], tags[3]]  # NLP, Classification, Text Analysis
        agents[1].tags = [tags[4], tags[5]]  # Vision, Analytics
        for agent in agents:
            db.add(agent)
        db.commit()
        
        # Create AI Collections (models)
        collection = AICollection(
            id="nlp_collection",
            name="NLP Collection",
            description="A collection of NLP models",
            curator="admin_user",
            created_at=datetime.utcnow(),
            public=True
        )
        collection.models = [models[0]]
        db.add(collection)
        db.commit()
        
        # Create Agent Collections
        agent_collection = AgentCollection(
            id="analytics_agents",
            name="Analytics Agents",
            description="A collection of analytics agents",
            curator="dev_user",
            created_at=datetime.utcnow(),
            public=True
        )
        agent_collection.agents = [agents[0]]
        db.add(agent_collection)
        db.commit()
        
        # Create audit logs
        logs = [
            AuditLog(
                username="admin_user",
                action="login",
                details="Admin user logged in via Google OAuth",
                created_at=datetime.utcnow()
            ),
            AuditLog(
                username="dev_user",
                action="publish_model",
                details="Published Example Text Classifier to App Store",
                created_at=datetime.utcnow()
            ),
            AuditLog(
                username="dev_user",
                action="publish_agent",
                details="Published Example Text Analysis Agent to App Store",
                created_at=datetime.utcnow()
            )
        ]
        for log in logs:
            db.add(log)
        db.commit()
        
        print("Database initialized with enhanced example data!")
        
    except Exception as e:
        print(f"Error initializing database: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db() 
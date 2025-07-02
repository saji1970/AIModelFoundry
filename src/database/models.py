from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Table, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

# Association tables
model_tags = Table(
    'model_tags',
    Base.metadata,
    Column('model_id', String, ForeignKey('models.id')),
    Column('tag_id', String, ForeignKey('tags.id'))
)

agent_tags = Table(
    'agent_tags',
    Base.metadata,
    Column('agent_id', String, ForeignKey('agents.id')),
    Column('tag_id', String, ForeignKey('tags.id'))
)

project_models = Table(
    'project_models',
    Base.metadata,
    Column('project_id', String, ForeignKey('projects.id')),
    Column('model_id', String, ForeignKey('models.id'))
)

project_agents = Table(
    'project_agents',
    Base.metadata,
    Column('project_id', String, ForeignKey('projects.id')),
    Column('agent_id', String, ForeignKey('agents.id'))
)

class User(Base):
    __tablename__ = 'users'

    username = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    role = Column(String, default='Viewer')  # Admin, Developer, Viewer
    oauth_provider = Column(String, nullable=True)  # e.g., 'google', 'github'
    oauth_id = Column(String, nullable=True)
    workspaces = relationship("Workspace", back_populates="user")
    projects = relationship("Project", back_populates="user")

class Workspace(Base):
    __tablename__ = 'workspaces'

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    user_username = Column(String, ForeignKey('users.username'))
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="workspaces")
    models = relationship("Model", back_populates="workspace")
    agents = relationship("Agent", back_populates="workspace")

class Project(Base):
    __tablename__ = 'projects'

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(String)
    user_username = Column(String, ForeignKey('users.username'))
    storage_space_required = Column(String, nullable=False)  # e.g., "1GB", "500MB"
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user = relationship("User", back_populates="projects")
    models = relationship("Model", secondary=project_models, back_populates="projects")
    agents = relationship("Agent", secondary=project_agents, back_populates="projects")

class Model(Base):
    __tablename__ = 'models'

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(String)
    creator = Column(String, ForeignKey('users.username'))
    model_type = Column(String, nullable=False)
    version = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    downloads = Column(Integer, default=0)
    rating = Column(Float, default=0.0)
    workspace_id = Column(String, ForeignKey('workspaces.id'))
    workspace = relationship("Workspace", back_populates="models")
    tags = relationship("Tag", secondary=model_tags, back_populates="models")
    reviews = relationship("ModelReview", back_populates="model")
    projects = relationship("Project", secondary=project_models, back_populates="models")
    public = Column(Boolean, default=False)
    price = Column(String, default="Free")
    apple_store_url = Column(String, nullable=True)
    google_play_url = Column(String, nullable=True)
    custom_payment_url = Column(String, nullable=True)
    integration = Column(String, nullable=True)  # e.g., 'openai', 'vertexai', 'anthropic', 'cursor'

class Agent(Base):
    __tablename__ = 'agents'

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(String)
    creator = Column(String, ForeignKey('users.username'))
    agent_type = Column(String, nullable=False)
    version = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    downloads = Column(Integer, default=0)
    rating = Column(Float, default=0.0)
    required_models = Column(JSON)
    workspace_id = Column(String, ForeignKey('workspaces.id'))
    workspace = relationship("Workspace", back_populates="agents")
    tags = relationship("Tag", secondary=agent_tags, back_populates="agents")
    reviews = relationship("AgentReview", back_populates="agent")
    projects = relationship("Project", secondary=project_agents, back_populates="agents")
    public = Column(Boolean, default=False)
    price = Column(String, default="Free")
    apple_store_url = Column(String, nullable=True)
    google_play_url = Column(String, nullable=True)
    custom_payment_url = Column(String, nullable=True)
    integration = Column(String, nullable=True)

class Tag(Base):
    __tablename__ = 'tags'

    id = Column(String, primary_key=True)
    name = Column(String, unique=True, nullable=False)
    models = relationship("Model", secondary=model_tags, back_populates="tags")
    agents = relationship("Agent", secondary=agent_tags, back_populates="tags")

class ModelReview(Base):
    __tablename__ = 'model_reviews'

    id = Column(Integer, primary_key=True)
    model_id = Column(String, ForeignKey('models.id'))
    username = Column(String, ForeignKey('users.username'))
    rating = Column(Float, nullable=False)
    comment = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    model = relationship("Model", back_populates="reviews")

class AgentReview(Base):
    __tablename__ = 'agent_reviews'

    id = Column(Integer, primary_key=True)
    agent_id = Column(String, ForeignKey('agents.id'))
    username = Column(String, ForeignKey('users.username'))
    rating = Column(Float, nullable=False)
    comment = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    agent = relationship("Agent", back_populates="reviews")

class AICollection(Base):
    __tablename__ = 'ai_collections'

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(String)
    curator = Column(String, ForeignKey('users.username'))
    created_at = Column(DateTime, default=datetime.utcnow)
    models = relationship("Model", secondary="collection_models")
    public = Column(Boolean, default=False)

class AgentCollection(Base):
    __tablename__ = 'agent_collections'

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(String)
    curator = Column(String, ForeignKey('users.username'))
    created_at = Column(DateTime, default=datetime.utcnow)
    agents = relationship("Agent", secondary="collection_agents")
    public = Column(Boolean, default=False)

# Association tables for collections
collection_models = Table(
    'collection_models',
    Base.metadata,
    Column('collection_id', String, ForeignKey('ai_collections.id')),
    Column('model_id', String, ForeignKey('models.id'))
)

collection_agents = Table(
    'collection_agents',
    Base.metadata,
    Column('collection_id', String, ForeignKey('agent_collections.id')),
    Column('agent_id', String, ForeignKey('agents.id'))
)

class AuditLog(Base):
    __tablename__ = 'audit_logs'

    id = Column(Integer, primary_key=True)
    username = Column(String, ForeignKey('users.username'))
    action = Column(String, nullable=False)
    details = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow) 
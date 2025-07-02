from fastapi import FastAPI, HTTPException, Depends, Body, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import List, Optional
import uvicorn
from datetime import datetime

from src.auth.user_auth import UserAuth
from src.store.model_store import ModelStore
from src.store.agent_store import AgentStore
from src.garden.ai_garden import AIGarden
from src.garden.agent_garden import AgentGarden
from src.api.oauth import router as oauth_router
from src.database.database import SessionLocal
from src.database.models import Model, Agent, User, Project
from src.services.ai_service import ai_service

app = FastAPI(
    title="AI Model Foundry API",
    description="API for managing AI models and agents",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
user_auth = UserAuth()
model_store = ModelStore()
agent_store = AgentStore()
ai_garden = AIGarden()
agent_garden = AgentGarden()

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Dependency to get current user
async def get_current_user(token: str = Depends(oauth2_scheme)):
    username = user_auth.verify_token(token)
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return username

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# User routes
@app.post("/register")
async def register_user(username: str, email: str, password: str):
    try:
        return user_auth.register_user(username, email, password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    token = user_auth.login(form_data.username, form_data.password)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return {"access_token": token, "token_type": "bearer"}

# Model Store routes
@app.post("/models")
async def create_model(
    model_id: str = Body(...),
    name: str = Body(...),
    description: str = Body(...),
    model_type: str = Body(...),
    tags: List[str] = Body(...),
    price: str = Body("Free"),
    public: bool = Body(False),
    integration: Optional[str] = Body(None),
    current_user: str = Depends(get_current_user),
    db: SessionLocal = Depends(get_db)
):
    try:
        # Check if user exists
        user = db.query(User).filter(User.username == current_user).first()
        if not user:
            raise ValueError("User not found")
        
        # Create model in database
        model = Model(
            id=model_id,
            name=name,
            description=description,
            creator=current_user,
            model_type=model_type,
            version="1.0.0",
            workspace_id=f"{current_user}_workspace",
            public=public,
            price=price,
            integration=integration
        )
        
        db.add(model)
        db.commit()
        db.refresh(model)
        
        return {
            "model_id": model.id,
            "name": model.name,
            "description": model.description,
            "creator": model.creator,
            "model_type": model.model_type,
            "version": model.version,
            "public": model.public,
            "price": model.price,
            "integration": model.integration
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.patch("/models/{model_id}/publish")
async def publish_model(
    model_id: str, 
    public: bool = Body(...),
    apple_store_url: Optional[str] = Body(None),
    google_play_url: Optional[str] = Body(None),
    custom_payment_url: Optional[str] = Body(None),
    current_user: str = Depends(get_current_user),
    db: SessionLocal = Depends(get_db)
):
    model = db.query(Model).filter(Model.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    if model.creator != current_user:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    model.public = public
    if apple_store_url is not None:
        model.apple_store_url = apple_store_url
    if google_play_url is not None:
        model.google_play_url = google_play_url
    if custom_payment_url is not None:
        model.custom_payment_url = custom_payment_url
    
    db.commit()
    db.refresh(model)
    
    return {
        "model_id": model.id,
        "public": model.public,
        "apple_store_url": model.apple_store_url,
        "google_play_url": model.google_play_url,
        "custom_payment_url": model.custom_payment_url
    }

@app.get("/models/public")
async def list_public_models(db: SessionLocal = Depends(get_db)):
    models = db.query(Model).filter(Model.public == True).all()
    return [
        {
            "model_id": model.id,
            "name": model.name,
            "description": model.description,
            "creator": model.creator,
            "model_type": model.model_type,
            "version": model.version,
            "public": model.public,
            "price": model.price,
            "integration": model.integration,
            "downloads": model.downloads,
            "rating": model.rating
        }
        for model in models
    ]

@app.get("/models")
async def list_models(
    model_type: Optional[str] = None,
    tags: Optional[List[str]] = None,
    current_user: str = Depends(get_current_user),
    db: SessionLocal = Depends(get_db)
):
    query = db.query(Model).filter(Model.creator == current_user)
    if model_type:
        query = query.filter(Model.model_type == model_type)
    
    models = query.all()
    return [
        {
            "model_id": model.id,
            "name": model.name,
            "description": model.description,
            "creator": model.creator,
            "model_type": model.model_type,
            "version": model.version,
            "public": model.public,
            "price": model.price,
            "integration": model.integration
        }
        for model in models
    ]

@app.put("/models/{model_id}")
async def update_model(
    model_id: str,
    name: str = Body(...),
    description: str = Body(...),
    model_type: str = Body(...),
    tags: List[str] = Body(...),
    price: str = Body("Free"),
    public: bool = Body(False),
    integration: Optional[str] = Body(None),
    current_user: str = Depends(get_current_user),
    db: SessionLocal = Depends(get_db)
):
    model = db.query(Model).filter(Model.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    if model.creator != current_user:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    model.name = name
    model.description = description
    model.model_type = model_type
    model.price = price
    model.public = public
    model.integration = integration
    
    db.commit()
    db.refresh(model)
    
    return {
        "model_id": model.id,
        "name": model.name,
        "description": model.description,
        "creator": model.creator,
        "model_type": model.model_type,
        "version": model.version,
        "public": model.public,
        "price": model.price,
        "integration": model.integration
    }

@app.delete("/models/{model_id}")
async def delete_model(
    model_id: str,
    current_user: str = Depends(get_current_user),
    db: SessionLocal = Depends(get_db)
):
    model = db.query(Model).filter(Model.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    if model.creator != current_user:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.delete(model)
    db.commit()
    
    return {"message": "Model deleted successfully"}

# Agent Store routes
@app.post("/agents")
async def create_agent(
    agent_id: str = Body(...),
    name: str = Body(...),
    description: str = Body(...),
    agent_type: str = Body(...),
    required_models: List[str] = Body(...),
    tags: List[str] = Body(...),
    price: str = Body("Free"),
    public: bool = Body(False),
    integration: Optional[str] = Body(None),
    current_user: str = Depends(get_current_user),
    db: SessionLocal = Depends(get_db)
):
    try:
        # Check if user exists
        user = db.query(User).filter(User.username == current_user).first()
        if not user:
            raise ValueError("User not found")
        
        # Create agent in database
        agent = Agent(
            id=agent_id,
            name=name,
            description=description,
            creator=current_user,
            agent_type=agent_type,
            version="1.0.0",
            required_models=required_models,
            workspace_id=f"{current_user}_workspace",
            public=public,
            price=price,
            integration=integration
        )
        
        db.add(agent)
        db.commit()
        db.refresh(agent)
        
        return {
            "agent_id": agent.id,
            "name": agent.name,
            "description": agent.description,
            "creator": agent.creator,
            "agent_type": agent.agent_type,
            "version": agent.version,
            "required_models": agent.required_models,
            "public": agent.public,
            "price": agent.price,
            "integration": agent.integration
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.patch("/agents/{agent_id}/publish")
async def publish_agent(
    agent_id: str, 
    public: bool = Body(...),
    apple_store_url: Optional[str] = Body(None),
    google_play_url: Optional[str] = Body(None),
    custom_payment_url: Optional[str] = Body(None),
    current_user: str = Depends(get_current_user),
    db: SessionLocal = Depends(get_db)
):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    if agent.creator != current_user:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    agent.public = public
    if apple_store_url is not None:
        agent.apple_store_url = apple_store_url
    if google_play_url is not None:
        agent.google_play_url = google_play_url
    if custom_payment_url is not None:
        agent.custom_payment_url = custom_payment_url
    
    db.commit()
    db.refresh(agent)
    
    return {
        "agent_id": agent.id,
        "public": agent.public,
        "apple_store_url": agent.apple_store_url,
        "google_play_url": agent.google_play_url,
        "custom_payment_url": agent.custom_payment_url
    }

@app.get("/agents/public")
async def list_public_agents(db: SessionLocal = Depends(get_db)):
    agents = db.query(Agent).filter(Agent.public == True).all()
    return [
        {
            "agent_id": agent.id,
            "name": agent.name,
            "description": agent.description,
            "creator": agent.creator,
            "agent_type": agent.agent_type,
            "version": agent.version,
            "required_models": agent.required_models,
            "public": agent.public,
            "price": agent.price,
            "integration": agent.integration,
            "downloads": agent.downloads,
            "rating": agent.rating
        }
        for agent in agents
    ]

@app.get("/agents")
async def list_agents(
    agent_type: Optional[str] = None,
    tags: Optional[List[str]] = None,
    current_user: str = Depends(get_current_user),
    db: SessionLocal = Depends(get_db)
):
    query = db.query(Agent).filter(Agent.creator == current_user)
    if agent_type:
        query = query.filter(Agent.agent_type == agent_type)
    
    agents = query.all()
    return [
        {
            "agent_id": agent.id,
            "name": agent.name,
            "description": agent.description,
            "creator": agent.creator,
            "agent_type": agent.agent_type,
            "version": agent.version,
            "required_models": agent.required_models,
            "public": agent.public,
            "price": agent.price,
            "integration": agent.integration
        }
        for agent in agents
    ]

@app.put("/agents/{agent_id}")
async def update_agent(
    agent_id: str,
    name: str = Body(...),
    description: str = Body(...),
    agent_type: str = Body(...),
    required_models: List[str] = Body(...),
    tags: List[str] = Body(...),
    price: str = Body("Free"),
    public: bool = Body(False),
    integration: Optional[str] = Body(None),
    current_user: str = Depends(get_current_user),
    db: SessionLocal = Depends(get_db)
):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    if agent.creator != current_user:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    agent.name = name
    agent.description = description
    agent.agent_type = agent_type
    agent.required_models = required_models
    agent.price = price
    agent.public = public
    agent.integration = integration
    
    db.commit()
    db.refresh(agent)
    
    return {
        "agent_id": agent.id,
        "name": agent.name,
        "description": agent.description,
        "creator": agent.creator,
        "agent_type": agent.agent_type,
        "version": agent.version,
        "required_models": agent.required_models,
        "public": agent.public,
        "price": agent.price,
        "integration": agent.integration
    }

@app.delete("/agents/{agent_id}")
async def delete_agent(
    agent_id: str,
    current_user: str = Depends(get_current_user),
    db: SessionLocal = Depends(get_db)
):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    if agent.creator != current_user:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.delete(agent)
    db.commit()
    
    return {"message": "Agent deleted successfully"}

# AI Garden routes
@app.post("/ai-garden/collections")
async def create_ai_collection(
    collection_id: str,
    name: str,
    description: str,
    tags: List[str],
    current_user: str = Depends(get_current_user)
):
    try:
        return ai_garden.create_collection(
            collection_id=collection_id,
            name=name,
            description=description,
            curator=current_user,
            tags=tags
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/ai-garden/collections")
async def list_ai_collections(
    curator: Optional[str] = None,
    tags: Optional[List[str]] = None
):
    return ai_garden.list_collections(curator, tags)

# Agent Garden routes
@app.post("/agent-garden/collections")
async def create_agent_collection(
    collection_id: str,
    name: str,
    description: str,
    tags: List[str],
    current_user: str = Depends(get_current_user)
):
    try:
        return agent_garden.create_collection(
            collection_id=collection_id,
            name=name,
            description=description,
            curator=current_user,
            tags=tags
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/agent-garden/collections")
async def list_agent_collections(
    curator: Optional[str] = None,
    tags: Optional[List[str]] = None
):
    return agent_garden.list_collections(curator, tags)

# Payment routes
@app.post("/payment/process")
async def process_payment(
    item_id: str = Body(...),
    item_type: str = Body(...),  # 'model' or 'agent'
    amount: str = Body(...),
    payment_data: dict = Body(...),
    current_user: str = Depends(get_current_user),
    db: SessionLocal = Depends(get_db)
):
    try:
        # Validate item exists and is public
        if item_type == 'model':
            item = db.query(Model).filter(Model.id == item_id, Model.public == True).first()
        else:
            item = db.query(Agent).filter(Agent.id == item_id, Agent.public == True).first()
        
        if not item:
            raise HTTPException(status_code=404, detail="Item not found or not public")
        
        # Validate price
        if item.price != amount and item.price != 'Free':
            raise HTTPException(status_code=400, detail="Price mismatch")
        
        # In a real implementation, you would:
        # 1. Process payment through Stripe, PayPal, or other payment gateway
        # 2. Validate payment data
        # 3. Create transaction record
        # 4. Send confirmation email
        
        # For now, we'll simulate successful payment
        payment_result = {
            "success": True,
            "transaction_id": f"txn_{item_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "amount": amount,
            "item_name": item.name,
            "item_type": item_type,
            "user": current_user,
            "timestamp": datetime.now().isoformat()
        }
        
        # Update download count
        if item_type == 'model':
            item.downloads += 1
        else:
            item.downloads += 1
        db.commit()
        
        return payment_result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Payment processing failed: {str(e)}")

@app.get("/payment/history")
async def get_payment_history(
    current_user: str = Depends(get_current_user),
    db: SessionLocal = Depends(get_db)
):
    # In a real implementation, you would query a payments table
    # For now, return empty array
    return []

# AI endpoints for enhanced Monaco Editor
@app.post("/ai/generate")
async def ai_generate(
    request: dict = Body(...),
    current_user: str = Depends(get_current_user)
):
    """Generate code based on prompt using real AI service"""
    try:
        prompt = request.get("prompt", "")
        language = request.get("language", "python")
        model = request.get("model", "auto")
        
        code = await ai_service.generate_code(prompt, language, model)
        return {"code": code}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

@app.post("/ai/completion")
async def ai_completion(
    request: dict = Body(...),
    current_user: str = Depends(get_current_user)
):
    """Get AI code completion suggestions using real AI service"""
    try:
        prompt = request.get("prompt", "")
        language = request.get("language", "python")
        model = request.get("model", "auto")
        max_tokens = request.get("max_tokens", 100)
        
        completion = await ai_service.get_completion(prompt, language, model)
        return {"completion": completion}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI completion failed: {str(e)}")

@app.post("/ai/chat")
async def ai_chat(
    request: dict = Body(...),
    current_user: str = Depends(get_current_user)
):
    """Chat with AI for code assistance using real AI service"""
    try:
        message = request.get("message", "")
        context = request.get("context", "")
        language = request.get("language", "python")
        model = request.get("model", "auto")
        
        response = await ai_service.chat_assistance(message, context, language, model)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI chat failed: {str(e)}")

@app.post("/ai/refactor")
async def ai_refactor(
    request: dict = Body(...),
    current_user: str = Depends(get_current_user)
):
    """Refactor code using AI"""
    try:
        code = request.get("code", "")
        language = request.get("language", "python")
        model = request.get("model", "chatgpt")
        
        # Simulate AI refactoring
        if language == "python":
            refactored_code = f"""# Refactored Python code
# Original: {code[:50]}...

def refactored_function():
    \"\"\"
    Refactored version with better structure and documentation
    \"\"\"
    # Improved implementation
    return "refactored result"
"""
        elif language == "javascript":
            refactored_code = f"""// Refactored JavaScript code
// Original: {code[:50]}...

/**
 * Refactored function with better structure and documentation
 * @returns {string} The refactored result
 */
function refactoredFunction() {{
    // Improved implementation
    return "refactored result";
}}
"""
        else:
            refactored_code = f"// Refactored {language} code\n// Original: {code[:50]}...\n\n// Improved implementation here"
        
        return {"refactored_code": refactored_code}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI refactoring failed: {str(e)}")

@app.post("/ai/explain")
async def ai_explain(
    request: dict = Body(...),
    current_user: str = Depends(get_current_user)
):
    """Get AI explanation for code terms"""
    try:
        term = request.get("term", "")
        language = request.get("language", "python")
        model = request.get("model", "chatgpt")
        
        # Simulate AI explanation
        explanations = {
            "function": f"In {language}, a function is a reusable block of code that performs a specific task.",
            "class": f"In {language}, a class is a blueprint for creating objects with shared properties and methods.",
            "variable": f"In {language}, a variable is a container for storing data values.",
            "loop": f"In {language}, a loop is used to execute a block of code multiple times.",
            "if": f"In {language}, an if statement is used for conditional execution of code.",
            "import": f"In {language}, import is used to include external modules or libraries.",
            "return": f"In {language}, return is used to exit a function and optionally return a value.",
            "def": f"In Python, def is a keyword used to define a function.",
            "const": f"In JavaScript, const is used to declare a constant variable that cannot be reassigned.",
            "let": f"In JavaScript, let is used to declare a block-scoped variable.",
            "var": f"In JavaScript, var is used to declare a function-scoped variable.",
        }
        
        explanation = explanations.get(term.lower(), f"'{term}' is a programming concept in {language}. It's commonly used for various purposes depending on the context.")
        
        return {"explanation": explanation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI explanation failed: {str(e)}")

# Project Management endpoints
@app.post("/projects")
async def create_project(
    name: str = Body(...),
    description: str = Body(...),
    storage_space_required: str = Body(...),
    current_user: str = Depends(get_current_user),
    db: SessionLocal = Depends(get_db)
):
    """Create a new project"""
    try:
        # Check if user exists
        user = db.query(User).filter(User.username == current_user).first()
        if not user:
            raise ValueError("User not found")
        
        # Generate project ID
        project_id = f"project_{current_user}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Create project
        project = Project(
            id=project_id,
            name=name,
            description=description,
            user_username=current_user,
            storage_space_required=storage_space_required
        )
        
        db.add(project)
        db.commit()
        db.refresh(project)
        
        return {
            "project_id": project.id,
            "name": project.name,
            "description": project.description,
            "storage_space_required": project.storage_space_required,
            "created_at": project.created_at,
            "models": [],
            "agents": []
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/projects")
async def list_projects(
    current_user: str = Depends(get_current_user),
    db: SessionLocal = Depends(get_db)
):
    """List all projects for the current user"""
    projects = db.query(Project).filter(Project.user_username == current_user).all()
    
    result = []
    for project in projects:
        project_data = {
            "project_id": project.id,
            "name": project.name,
            "description": project.description,
            "storage_space_required": project.storage_space_required,
            "created_at": project.created_at,
            "updated_at": project.updated_at,
            "models": [
                {
                    "model_id": model.id,
                    "name": model.name,
                    "model_type": model.model_type,
                    "version": model.version
                }
                for model in project.models
            ],
            "agents": [
                {
                    "agent_id": agent.id,
                    "name": agent.name,
                    "agent_type": agent.agent_type,
                    "version": agent.version
                }
                for agent in project.agents
            ]
        }
        result.append(project_data)
    
    return result

@app.get("/projects/{project_id}")
async def get_project(
    project_id: str,
    current_user: str = Depends(get_current_user),
    db: SessionLocal = Depends(get_db)
):
    """Get a specific project with its models and agents"""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_username == current_user
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return {
        "project_id": project.id,
        "name": project.name,
        "description": project.description,
        "storage_space_required": project.storage_space_required,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
        "models": [
            {
                "model_id": model.id,
                "name": model.name,
                "description": model.description,
                "model_type": model.model_type,
                "version": model.version,
                "creator": model.creator
            }
            for model in project.models
        ],
        "agents": [
            {
                "agent_id": agent.id,
                "name": agent.name,
                "description": agent.description,
                "agent_type": agent.agent_type,
                "version": agent.version,
                "creator": agent.creator
            }
            for agent in project.agents
        ]
    }

@app.put("/projects/{project_id}")
async def update_project(
    project_id: str,
    name: str = Body(...),
    description: str = Body(...),
    storage_space_required: str = Body(...),
    current_user: str = Depends(get_current_user),
    db: SessionLocal = Depends(get_db)
):
    """Update a project"""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_username == current_user
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project.name = name
    project.description = description
    project.storage_space_required = storage_space_required
    project.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(project)
    
    return {
        "project_id": project.id,
        "name": project.name,
        "description": project.description,
        "storage_space_required": project.storage_space_required,
        "updated_at": project.updated_at
    }

@app.delete("/projects/{project_id}")
async def delete_project(
    project_id: str,
    current_user: str = Depends(get_current_user),
    db: SessionLocal = Depends(get_db)
):
    """Delete a project"""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_username == current_user
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db.delete(project)
    db.commit()
    
    return {"message": "Project deleted successfully"}

@app.post("/projects/{project_id}/models/{model_id}")
async def add_model_to_project(
    project_id: str,
    model_id: str,
    current_user: str = Depends(get_current_user),
    db: SessionLocal = Depends(get_db)
):
    """Add a model to a project"""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_username == current_user
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    model = db.query(Model).filter(Model.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    
    # Check if model is already in project
    if model in project.models:
        raise HTTPException(status_code=400, detail="Model already in project")
    
    project.models.append(model)
    project.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": f"Model {model.name} added to project {project.name}"}

@app.delete("/projects/{project_id}/models/{model_id}")
async def remove_model_from_project(
    project_id: str,
    model_id: str,
    current_user: str = Depends(get_current_user),
    db: SessionLocal = Depends(get_db)
):
    """Remove a model from a project"""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_username == current_user
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    model = db.query(Model).filter(Model.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    
    if model not in project.models:
        raise HTTPException(status_code=400, detail="Model not in project")
    
    project.models.remove(model)
    project.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": f"Model {model.name} removed from project {project.name}"}

@app.post("/projects/{project_id}/agents/{agent_id}")
async def add_agent_to_project(
    project_id: str,
    agent_id: str,
    current_user: str = Depends(get_current_user),
    db: SessionLocal = Depends(get_db)
):
    """Add an agent to a project"""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_username == current_user
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Check if agent is already in project
    if agent in project.agents:
        raise HTTPException(status_code=400, detail="Agent already in project")
    
    project.agents.append(agent)
    project.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": f"Agent {agent.name} added to project {project.name}"}

@app.delete("/projects/{project_id}/agents/{agent_id}")
async def remove_agent_from_project(
    project_id: str,
    agent_id: str,
    current_user: str = Depends(get_current_user),
    db: SessionLocal = Depends(get_db)
):
    """Remove an agent from a project"""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_username == current_user
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    if agent not in project.agents:
        raise HTTPException(status_code=400, detail="Agent not in project")
    
    project.agents.remove(agent)
    project.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": f"Agent {agent.name} removed from project {project.name}"}

app.include_router(oauth_router)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
from starlette.requests import Request as StarletteRequest
from src.auth.user_auth import UserAuth
import os

router = APIRouter()

config = Config(environ=os.environ)
oauth = OAuth(config)

# Register Google OAuth client
oauth.register(
    name='google',
    client_id=os.getenv('GOOGLE_CLIENT_ID'),
    client_secret=os.getenv('GOOGLE_CLIENT_SECRET'),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile'
    }
)

user_auth = UserAuth()

@router.get('/auth/google/login')
async def google_login(request: Request):
    redirect_uri = request.url_for('google_callback')
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get('/auth/google/callback')
async def google_callback(request: Request):
    token = await oauth.google.authorize_access_token(request)
    user_info = await oauth.google.parse_id_token(request, token)
    if not user_info:
        raise HTTPException(status_code=400, detail='Google login failed')
    username = user_info['email'].split('@')[0]
    email = user_info['email']
    oauth_provider = 'google'
    oauth_id = user_info['sub']
    user_auth.register_oauth_user(username, email, oauth_provider, oauth_id)
    jwt_token = user_auth.login_oauth(username)
    # Redirect to frontend with token (or return token directly)
    return {"access_token": jwt_token, "token_type": "bearer", "username": username, "email": email} 
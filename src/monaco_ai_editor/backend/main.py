
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import openai
import os

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.post("/api/ai-completion")
async def ai_completion(request: Request):
    data = await request.json()
    prompt = data["prompt"]
    model = data.get("model", "chatgpt")

    if model == "chatgpt":
        openai.api_key = os.getenv("OPENAI_API_KEY")
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=150
        )
        return {"completion": response["choices"][0]["message"]["content"]}

    elif model == "claude":
        return {"completion": "[Claude Integration Placeholder]"}

    elif model == "gemini":
        return {"completion": "[Gemini Integration Placeholder]"}

    return {"completion": "[Unknown model]"}

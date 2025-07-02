import os
import asyncio
import aiohttp
from typing import Optional, Dict, Any
import openai
import anthropic
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

class AIService:
    def __init__(self):
        # Initialize AI clients
        self.openai_client = None
        self.anthropic_client = None
        self.gemini_model = None
        
        # Try to initialize OpenAI
        openai_api_key = os.getenv("OPENAI_API_KEY")
        if openai_api_key:
            try:
                self.openai_client = openai.OpenAI(api_key=openai_api_key)
            except Exception as e:
                print(f"Failed to initialize OpenAI client: {e}")
        
        # Try to initialize Anthropic
        anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
        if anthropic_api_key:
            try:
                self.anthropic_client = anthropic.Anthropic(api_key=anthropic_api_key)
            except Exception as e:
                print(f"Failed to initialize Anthropic client: {e}")
        
        # Try to initialize Google Gemini
        google_api_key = os.getenv("GOOGLE_API_KEY")
        if google_api_key:
            try:
                genai.configure(api_key=google_api_key)
                self.gemini_model = genai.GenerativeModel('gemini-pro')
            except Exception as e:
                print(f"Failed to initialize Google Gemini: {e}")
    
    async def generate_code(self, prompt: str, language: str, model: str = "auto") -> str:
        """Generate code using AI services"""
        try:
            # Determine which AI service to use
            if model == "auto":
                # Try services in order of preference
                if self.openai_client:
                    return await self._generate_with_openai(prompt, language)
                elif self.anthropic_client:
                    return await self._generate_with_anthropic(prompt, language)
                elif self.gemini_model:
                    return await self._generate_with_gemini(prompt, language)
            elif model == "chatgpt" and self.openai_client:
                return await self._generate_with_openai(prompt, language)
            elif model == "claude" and self.anthropic_client:
                return await self._generate_with_anthropic(prompt, language)
            elif model == "gemini" and self.gemini_model:
                return await self._generate_with_gemini(prompt, language)
            
            # Fallback to template generation
            return self._generate_template_code(prompt, language)
            
        except Exception as e:
            print(f"Error in code generation: {e}")
            return self._generate_template_code(prompt, language)
    
    async def chat_assistance(self, message: str, context: str, language: str, model: str = "auto") -> str:
        """Get AI chat assistance"""
        try:
            # Determine which AI service to use
            if model == "auto":
                if self.openai_client:
                    return await self._chat_with_openai(message, context, language)
                elif self.anthropic_client:
                    return await self._chat_with_anthropic(message, context, language)
                elif self.gemini_model:
                    return await self._chat_with_gemini(message, context, language)
            elif model == "chatgpt" and self.openai_client:
                return await self._chat_with_openai(message, context, language)
            elif model == "claude" and self.anthropic_client:
                return await self._chat_with_anthropic(message, context, language)
            elif model == "gemini" and self.gemini_model:
                return await self._chat_with_gemini(message, context, language)
            
            # Fallback to template response
            return self._generate_template_chat_response(message, language)
            
        except Exception as e:
            print(f"Error in chat assistance: {e}")
            return self._generate_template_chat_response(message, language)
    
    async def get_completion(self, prompt: str, language: str, model: str = "auto") -> str:
        """Get AI code completion"""
        try:
            # Determine which AI service to use
            if model == "auto":
                if self.openai_client:
                    return await self._completion_with_openai(prompt, language)
                elif self.anthropic_client:
                    return await self._completion_with_anthropic(prompt, language)
                elif self.gemini_model:
                    return await self._completion_with_gemini(prompt, language)
            elif model == "chatgpt" and self.openai_client:
                return await self._completion_with_openai(prompt, language)
            elif model == "claude" and self.anthropic_client:
                return await self._completion_with_anthropic(prompt, language)
            elif model == "gemini" and self.gemini_model:
                return await self._completion_with_gemini(prompt, language)
            
            # Fallback to template completion
            return self._generate_template_completion(prompt, language)
            
        except Exception as e:
            print(f"Error in code completion: {e}")
            return self._generate_template_completion(prompt, language)
    
    # OpenAI Methods
    async def _generate_with_openai(self, prompt: str, language: str) -> str:
        """Generate code using OpenAI"""
        try:
            system_prompt = f"""You are an expert {language} programmer. Generate clean, well-documented code based on the user's request. 
            Always include proper error handling, comments, and example usage. Return only the code without any explanations."""
            
            response = await asyncio.to_thread(
                self.openai_client.chat.completions.create,
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Generate {language} code for: {prompt}"}
                ],
                max_tokens=1000,
                temperature=0.3
            )
            
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"OpenAI generation error: {e}")
            raise
    
    async def _chat_with_openai(self, message: str, context: str, language: str) -> str:
        """Chat with OpenAI"""
        try:
            system_prompt = f"""You are an expert {language} programming assistant. Provide helpful, accurate, and practical advice. 
            When showing code examples, make sure they are complete and runnable."""
            
            user_content = f"Context: {context}\n\nQuestion: {message}" if context else message
            
            response = await asyncio.to_thread(
                self.openai_client.chat.completions.create,
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content}
                ],
                max_tokens=800,
                temperature=0.7
            )
            
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"OpenAI chat error: {e}")
            raise
    
    async def _completion_with_openai(self, prompt: str, language: str) -> str:
        """Get completion from OpenAI"""
        try:
            system_prompt = f"""You are an expert {language} programmer. Complete the code snippet provided by the user. 
            Return only the completion code, not the full code."""
            
            response = await asyncio.to_thread(
                self.openai_client.chat.completions.create,
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Complete this {language} code: {prompt}"}
                ],
                max_tokens=500,
                temperature=0.2
            )
            
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"OpenAI completion error: {e}")
            raise
    
    # Anthropic Methods
    async def _generate_with_anthropic(self, prompt: str, language: str) -> str:
        """Generate code using Anthropic Claude"""
        try:
            system_prompt = f"""You are an expert {language} programmer. Generate clean, well-documented code based on the user's request. 
            Always include proper error handling, comments, and example usage. Return only the code without any explanations."""
            
            response = await asyncio.to_thread(
                self.anthropic_client.messages.create,
                model="claude-3-sonnet-20240229",
                max_tokens=1000,
                system=system_prompt,
                messages=[{"role": "user", "content": f"Generate {language} code for: {prompt}"}]
            )
            
            return response.content[0].text.strip()
        except Exception as e:
            print(f"Anthropic generation error: {e}")
            raise
    
    async def _chat_with_anthropic(self, message: str, context: str, language: str) -> str:
        """Chat with Anthropic Claude"""
        try:
            system_prompt = f"""You are an expert {language} programming assistant. Provide helpful, accurate, and practical advice. 
            When showing code examples, make sure they are complete and runnable."""
            
            user_content = f"Context: {context}\n\nQuestion: {message}" if context else message
            
            response = await asyncio.to_thread(
                self.anthropic_client.messages.create,
                model="claude-3-sonnet-20240229",
                max_tokens=800,
                system=system_prompt,
                messages=[{"role": "user", "content": user_content}]
            )
            
            return response.content[0].text.strip()
        except Exception as e:
            print(f"Anthropic chat error: {e}")
            raise
    
    async def _completion_with_anthropic(self, prompt: str, language: str) -> str:
        """Get completion from Anthropic Claude"""
        try:
            system_prompt = f"""You are an expert {language} programmer. Complete the code snippet provided by the user. 
            Return only the completion code, not the full code."""
            
            response = await asyncio.to_thread(
                self.anthropic_client.messages.create,
                model="claude-3-sonnet-20240229",
                max_tokens=500,
                system=system_prompt,
                messages=[{"role": "user", "content": f"Complete this {language} code: {prompt}"}]
            )
            
            return response.content[0].text.strip()
        except Exception as e:
            print(f"Anthropic completion error: {e}")
            raise
    
    # Google Gemini Methods
    async def _generate_with_gemini(self, prompt: str, language: str) -> str:
        """Generate code using Google Gemini"""
        try:
            system_prompt = f"""You are an expert {language} programmer. Generate clean, well-documented code based on the user's request. 
            Always include proper error handling, comments, and example usage. Return only the code without any explanations."""
            
            full_prompt = f"{system_prompt}\n\nGenerate {language} code for: {prompt}"
            
            response = await asyncio.to_thread(
                self.gemini_model.generate_content,
                full_prompt,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=1000,
                    temperature=0.3
                )
            )
            
            return response.text.strip()
        except Exception as e:
            print(f"Gemini generation error: {e}")
            raise
    
    async def _chat_with_gemini(self, message: str, context: str, language: str) -> str:
        """Chat with Google Gemini"""
        try:
            system_prompt = f"""You are an expert {language} programming assistant. Provide helpful, accurate, and practical advice. 
            When showing code examples, make sure they are complete and runnable."""
            
            user_content = f"Context: {context}\n\nQuestion: {message}" if context else message
            full_prompt = f"{system_prompt}\n\n{user_content}"
            
            response = await asyncio.to_thread(
                self.gemini_model.generate_content,
                full_prompt,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=800,
                    temperature=0.7
                )
            )
            
            return response.text.strip()
        except Exception as e:
            print(f"Gemini chat error: {e}")
            raise
    
    async def _completion_with_gemini(self, prompt: str, language: str) -> str:
        """Get completion from Google Gemini"""
        try:
            system_prompt = f"""You are an expert {language} programmer. Complete the code snippet provided by the user. 
            Return only the completion code, not the full code."""
            
            full_prompt = f"{system_prompt}\n\nComplete this {language} code: {prompt}"
            
            response = await asyncio.to_thread(
                self.gemini_model.generate_content,
                full_prompt,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=500,
                    temperature=0.2
                )
            )
            
            return response.text.strip()
        except Exception as e:
            print(f"Gemini completion error: {e}")
            raise
    
    # Fallback Template Methods
    def _generate_template_code(self, prompt: str, language: str) -> str:
        """Generate template code when AI services are not available"""
        prompt_lower = prompt.lower()
        
        if "function" in prompt_lower or "def" in prompt_lower:
            if language == "python":
                return f"""def {prompt_lower.split()[0] if len(prompt_lower.split()) > 0 else 'generated'}_function():
    \"\"\"
    {prompt}
    \"\"\"
    # TODO: Implement the function logic
    return "result"

# Example usage
result = {prompt_lower.split()[0] if len(prompt_lower.split()) > 0 else 'generated'}_function()
print(f"Result: {{result}}")"""
            elif language == "javascript":
                return f"""function {prompt_lower.split()[0] if len(prompt_lower.split()) > 0 else 'generated'}Function() {{
    /**
     * {prompt}
     */
    // TODO: Implement the function logic
    return "result";
}}

// Example usage
const result = {prompt_lower.split()[0] if len(prompt_lower.split()) > 0 else 'generated'}Function();
console.log(`Result: ${{result}}`);"""
            else:
                return f"// Generated {language} function for: {prompt}\n// TODO: Implement the requested functionality"
        else:
            if language == "python":
                return f"""# {prompt}

# Import common libraries
import os
import sys
import json
from typing import List, Dict, Any

def main():
    \"\"\"
    Main function to handle {prompt}
    \"\"\"
    print("Starting application...")
    
    # TODO: Implement your logic here
    result = "Hello, World!"
    
    print(f"Result: {{result}}")
    return result

if __name__ == "__main__":
    main()"""
            elif language == "javascript":
                return f"""// {prompt}

/**
 * Main function to handle {prompt}
 * @returns {{any}} The result
 */
function main() {{
    console.log("Starting application...");
    
    // TODO: Implement your logic here
    const result = "Hello, World!";
    
    console.log(`Result: ${{result}}`);
    return result;
}}

// Run the main function
main();"""
            else:
                return f"// Generated {language} code for: {prompt}\n// TODO: Implement the requested functionality"
    
    def _generate_template_chat_response(self, message: str, language: str) -> str:
        """Generate template chat response when AI services are not available"""
        message_lower = message.lower()
        
        if "error" in message_lower or "bug" in message_lower:
            return f"I can help you debug that issue! Here are some common debugging steps for {language}:\n\n1. Check your syntax\n2. Use debugging tools\n3. Add logging statements\n4. Verify your dependencies\n\nCould you share the specific error message you're seeing?"
        elif "how to" in message_lower:
            return f"I'd be happy to help you with that! Could you provide more specific details about what you're trying to accomplish in {language}?"
        else:
            return f"I'm here to help you with {language} programming! I can assist with code generation, debugging, best practices, and more. What specific aspect would you like help with?"
    
    def _generate_template_completion(self, prompt: str, language: str) -> str:
        """Generate template completion when AI services are not available"""
        prompt_lower = prompt.lower()
        
        if "def " in prompt_lower or "function " in prompt_lower:
            if language == "python":
                return f"""    \"\"\"
    Function description
    \"\"\"
    # TODO: Implement function logic
    pass"""
            elif language == "javascript":
                return f"""    /**
     * Function description
     */
    // TODO: Implement function logic
    return null;"""
            else:
                return f"    // TODO: Implement function logic\n    return null;"
        else:
            if language == "python":
                return f"# TODO: Complete the implementation\n# Based on: {prompt}\npass"
            elif language == "javascript":
                return f"// TODO: Complete the implementation\n// Based on: {prompt}\nreturn null;"
            else:
                return f"// TODO: Complete the implementation for {language}\n// Based on: {prompt}"

# Global AI service instance
ai_service = AIService() 
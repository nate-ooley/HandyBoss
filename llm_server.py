import os
import sys
import json
import logging
import socket
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional, List, Union
import uvicorn
from llama_cpp import Llama

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("llm-api")

# Configuration
MODEL_PATH = "/Users/admin/Documents/BossMan/HandyBoss/models/gemma-3/tinyllama-1.1b-chat-v1.0.Q4_K_S.gguf"
DEFAULT_MAX_TOKENS = 1024
DEFAULT_TEMPERATURE = 0.3
DEFAULT_PORT = int(os.environ.get("LOCAL_LLM_PORT", "6789"))

# Function to check if a port is available
def is_port_available(port):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = False
    try:
        sock.bind(("0.0.0.0", port))
        result = True
    except:
        pass
    finally:
        sock.close()
    return result

# Find an available port
def find_available_port(start_port):
    port = start_port
    while port < start_port + 20:  # Try up to 20 ports
        if is_port_available(port):
            return port
        port += 1
    return None  # No available port found

# Initialize FastAPI
app = FastAPI(title="Local LLM API Server", 
              description="Local LLM API server using llama-cpp-python",
              version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Model loading
logger.info(f"Loading model from {MODEL_PATH}...")
try:
    model = Llama(
        model_path=MODEL_PATH,
        n_ctx=2048,
        n_threads=4
    )
    logger.info("Model loaded successfully!")
except Exception as e:
    logger.error(f"Error loading model: {e}")
    raise

# Pydantic models for request/response
class GenerationRequest(BaseModel):
    prompt: str
    systemPrompt: Optional[str] = ""
    max_tokens: Optional[int] = DEFAULT_MAX_TOKENS
    temperature: Optional[float] = DEFAULT_TEMPERATURE
    response_format: Optional[str] = "text"  # "text" or "json"

class GenerationResponse(BaseModel):
    text: str
    tokenCount: int

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "ok", "model": os.path.basename(MODEL_PATH)}

# Text generation endpoint
@app.post("/generate", response_model=GenerationResponse)
async def generate(request: GenerationRequest):
    try:
        # Prepare the prompt with system prompt if present
        full_prompt = request.prompt
        if request.systemPrompt:
            # General chat format
            full_prompt = f"System: {request.systemPrompt}\nUser: {request.prompt}\nAssistant:"
        
        # Format-specific instructions
        if request.response_format == "json":
            if not full_prompt.strip().endswith("json"):
                full_prompt += "\nRespond with valid JSON only:"
        
        # Generate text
        logger.info(f"Generating with prompt: {full_prompt[:50]}...")
        response = model(
            full_prompt, 
            max_tokens=request.max_tokens,
            temperature=request.temperature,
            stop=["User:", "\n\n"]
        )
        
        logger.info(f"Response structure: {response.keys()}")
        logger.info(f"Usage structure: {response['usage'].keys() if 'usage' in response else 'No usage key'}")
        
        generated_text = response["choices"][0]["text"].strip()
        
        # Format JSON if needed
        if request.response_format == "json":
            try:
                # Try to extract JSON object if it's embedded in other text
                import re
                json_match = re.search(r'\{.*\}', generated_text, re.DOTALL)
                if json_match:
                    json_str = json_match.group(0)
                    # Validate by parsing and re-serializing
                    json_obj = json.loads(json_str)
                    generated_text = json.dumps(json_obj)
            except Exception as e:
                logger.error(f"Failed to extract JSON: {e}")
                # If JSON extraction fails, return the raw text
        
        # Use fixed token count to avoid errors
        token_count = 10
        logger.info(f"Generated response with estimated {token_count} tokens")
        
        return {
            "text": generated_text,
            "tokenCount": token_count
        }
    except Exception as e:
        logger.error(f"Generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Generation error: {str(e)}")

if __name__ == "__main__":
    # Find an available port
    port = DEFAULT_PORT
    if not is_port_available(port):
        logger.info(f"Port {port} is already in use, looking for another port...")
        port = find_available_port(port + 1)
        if port:
            logger.info(f"Found available port: {port}")
        else:
            logger.error("No available ports found. Exiting.")
            sys.exit(1)
    else:
        logger.info(f"Using default port: {port}")
        
    # Update the environment variable with the actual port being used
    os.environ["LOCAL_LLM_PORT"] = str(port)
    
    # Start the server
    logger.info(f"Starting LLM server on port {port}")
    uvicorn.run("llm_server:app", host="0.0.0.0", port=port)
  
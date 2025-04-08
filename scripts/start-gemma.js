#!/usr/bin/env node

/**
 * This script starts the Gemma 3 local LLM server
 * It requires the model file to be downloaded first
 * 
 * Usage:
 *   node scripts/start-gemma.js
 * 
 * Prerequisites:
 *   - Node.js >= 16
 *   - Python >= 3.8
 *   - Gemma 3 model files in ./models/gemma-3
 */

import { exec, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import readline from 'readline';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// For ES modules to get __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration (override with env vars)
const config = {
  port: parseInt(process.env.LOCAL_LLM_PORT || '6789'),
  modelPath: process.env.LOCAL_LLM_PATH || './models/gemma-3',
  pythonCommand: process.env.PYTHON_COMMAND || 'python3',
  useVirtualEnv: process.env.USE_VIRTUAL_ENV !== 'false',
  logLevel: process.env.LOG_LEVEL || 'info',
  modelName: process.env.MODEL_NAME || 'Gemma-3'
};

// Format log messages
function log(message, level = 'info') {
  const levels = {
    debug: '\x1b[90m[DEBUG]\x1b[0m', // Gray
    info: '\x1b[36m[INFO]\x1b[0m',  // Cyan
    warn: '\x1b[33m[WARN]\x1b[0m',  // Yellow
    error: '\x1b[31m[ERROR]\x1b[0m', // Red
    success: '\x1b[32m[SUCCESS]\x1b[0m' // Green
  };

  if ((level === 'debug' && config.logLevel !== 'debug')) {
    return;
  }

  console.log(`${levels[level] || levels.info} ${message}`);
}

// Check if model files exist
function checkModelFiles() {
  const modelPath = path.resolve(process.cwd(), config.modelPath);
  log(`Checking for model files in ${modelPath}...`);

  if (!fs.existsSync(modelPath)) {
    log(`Model directory ${modelPath} does not exist. Please create it first.`, 'error');
    return false;
  }

  // Check for GGUF or bin files
  const files = fs.readdirSync(modelPath);
  const modelFiles = files.filter(file => 
    file.endsWith('.gguf') || 
    file.endsWith('.bin') || 
    file.endsWith('.onnx') ||
    file === 'model.safetensors'
  );

  if (modelFiles.length === 0) {
    log(`No model files found in ${modelPath}. Please download the model files first.`, 'error');
    return false;
  }

  log(`Found model files: ${modelFiles.join(', ')}`, 'success');
  return true;
}

// Setup Python virtual environment
function setupVirtualEnv() {
  return new Promise((resolve, reject) => {
    log('Setting up Python virtual environment...');
    
    const venvPath = path.join(process.cwd(), 'venv');
    
    if (fs.existsSync(venvPath)) {
      log('Virtual environment already exists', 'info');
      resolve(venvPath);
      return;
    }
    
    log('Creating new virtual environment...', 'info');
    exec(`${config.pythonCommand} -m venv venv`, (error, stdout, stderr) => {
      if (error) {
        log(`Failed to create virtual environment: ${error.message}`, 'error');
        reject(error);
        return;
      }
      
      log('Virtual environment created successfully', 'success');
      resolve(venvPath);
    });
  });
}

// Install dependencies
function installDependencies(venvPath) {
  return new Promise((resolve, reject) => {
    log('Installing Python dependencies...');
    
    const activateCmd = process.platform === 'win32' 
      ? `${path.join(venvPath, 'Scripts', 'activate')}` 
      : `source ${path.join(venvPath, 'bin', 'activate')}`;
    
    const pipInstallCmd = `${activateCmd} && pip install fastapi uvicorn transformers torch`;
    
    exec(pipInstallCmd, { shell: true }, (error, stdout, stderr) => {
      if (error) {
        log(`Failed to install dependencies: ${error.message}`, 'error');
        reject(error);
        return;
      }
      
      log('Dependencies installed successfully', 'success');
      resolve();
    });
  });
}

// Generate the server script
function generateServerScript() {
  log('Generating FastAPI server script...');
  
  const scriptPath = path.join(process.cwd(), 'llm_server.py');
  const scriptContent = `
import os
import sys
import json
import torch
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional, List, Union
import uvicorn
from transformers import AutoTokenizer, AutoModelForCausalLM

# Configuration
MODEL_PATH = "${config.modelPath.replace(/\\/g, '\\\\')}"
DEFAULT_MAX_TOKENS = 1024
DEFAULT_TEMPERATURE = 0.3

# Initialize FastAPI
app = FastAPI(title="${config.modelName} API Server", 
              description="Local LLM API server for ${config.modelName}",
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
print(f"Loading model from {MODEL_PATH}...")
try:
    tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_PATH,
        device_map="auto",
        torch_dtype=torch.float16,
        low_cpu_mem_usage=True
    )
    print("Model loaded successfully!")
except Exception as e:
    print(f"Error loading model: {e}")
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
    return {"status": "ok", "model": "${config.modelName}"}

# Text generation endpoint
@app.post("/generate", response_model=GenerationResponse)
async def generate(request: GenerationRequest):
    try:
        # Prepare the prompt with system prompt if present
        full_prompt = request.prompt
        if request.systemPrompt:
            if "${config.modelName}".lower().startswith("gemma"):
                # Gemma format
                full_prompt = f"<start_of_turn>system\\n{request.systemPrompt}<end_of_turn>\\n<start_of_turn>user\\n{request.prompt}<end_of_turn>\\n<start_of_turn>model\\n"
            else:
                # Generic format
                full_prompt = f"System: {request.systemPrompt}\\nUser: {request.prompt}\\nAssistant: "
        
        # Format-specific instructions
        if request.response_format == "json":
            if not full_prompt.strip().endswith("json"):
                full_prompt += "\\nRespond with valid JSON only:"
        
        # Tokenize input
        inputs = tokenizer(full_prompt, return_tensors="pt").to(model.device)
        
        # Generate
        with torch.no_grad():
            outputs = model.generate(
                inputs["input_ids"],
                max_new_tokens=request.max_tokens,
                temperature=request.temperature,
                do_sample=request.temperature > 0,
                pad_token_id=tokenizer.eos_token_id
            )
        
        # Decode the generated text, skipping the prompt
        generated_text = tokenizer.decode(
            outputs[0][inputs["input_ids"].shape[1]:], 
            skip_special_tokens=True
        )
        
        # Format JSON if needed
        if request.response_format == "json":
            try:
                # Try to extract JSON object if it's embedded in other text
                import re
                json_match = re.search(r'\\{.*\\}', generated_text, re.DOTALL)
                if json_match:
                    json_str = json_match.group(0)
                    # Validate by parsing and re-serializing
                    json_obj = json.loads(json_str)
                    generated_text = json.dumps(json_obj)
            except Exception as e:
                print(f"Failed to extract JSON: {e}")
                # If JSON extraction fails, return the raw text
        
        return {
            "text": generated_text,
            "tokenCount": len(outputs[0]) - len(inputs["input_ids"][0])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation error: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("llm_server:app", host="0.0.0.0", port=${config.port})
  `;
  
  fs.writeFileSync(scriptPath, scriptContent);
  log(`Server script generated at ${scriptPath}`, 'success');
  return scriptPath;
}

// Start the server
async function startServer(scriptPath) {
  log(`Starting ${config.modelName} server on port ${config.port}...`);
  
  const pythonCmd = config.useVirtualEnv 
    ? (process.platform === 'win32' ? path.join('venv', 'Scripts', 'python') : path.join('venv', 'bin', 'python'))
    : config.pythonCommand;
  
  const serverProcess = spawn(pythonCmd, [scriptPath], {
    stdio: 'pipe',
    shell: true
  });
  
  // Handle server output
  serverProcess.stdout.on('data', (data) => {
    console.log(`\x1b[35m[${config.modelName}]\x1b[0m ${data.toString().trim()}`);
  });
  
  serverProcess.stderr.on('data', (data) => {
    console.error(`\x1b[31m[${config.modelName} ERROR]\x1b[0m ${data.toString().trim()}`);
  });
  
  serverProcess.on('close', (code) => {
    if (code !== 0) {
      log(`Server process exited with code ${code}`, 'error');
    } else {
      log('Server process exited normally', 'info');
    }
  });
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    log('Stopping server...', 'info');
    serverProcess.kill('SIGINT');
    process.exit(0);
  });
  
  // Check if server is ready
  let isReady = false;
  const checkInterval = setInterval(async () => {
    try {
      const response = await fetch(`http://localhost:${config.port}/health`);
      if (response.ok) {
        clearInterval(checkInterval);
        log(`${config.modelName} server is ready and running on http://localhost:${config.port}`, 'success');
        isReady = true;
        
        // In interactive mode, wait for commands
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        log('Press Ctrl+C to stop the server', 'info');
        
        rl.on('line', (input) => {
          if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
            log('Stopping server...', 'info');
            serverProcess.kill('SIGINT');
            process.exit(0);
          } else if (input.toLowerCase() === 'test') {
            testServer(config.port);
          } else if (input.trim()) {
            log(`Unknown command: ${input}. Available commands: exit, test`, 'warn');
          }
        });
      }
    } catch (err) {
      // Server not ready yet, keep waiting
    }
  }, 1000);
  
  // Timeout after 2 minutes
  setTimeout(() => {
    if (!isReady) {
      clearInterval(checkInterval);
      log('Server startup timed out after 2 minutes. Check logs for errors.', 'error');
      serverProcess.kill('SIGINT');
      process.exit(1);
    }
  }, 120000);
}

// Test the server with a simple prompt
async function testServer(port) {
  log('Testing the server with a simple prompt...', 'info');
  
  try {
    const response = await fetch(`http://localhost:${port}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'Tell me about construction safety in one sentence.',
        max_tokens: 100,
        temperature: 0.5
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      log(`Test response: ${data.text}`, 'success');
    } else {
      log(`Test failed: ${response.status} ${response.statusText}`, 'error');
    }
  } catch (err) {
    log(`Test failed: ${err.message}`, 'error');
  }
}

// Main function
async function main() {
  log(`${config.modelName} LLM Server Setup`, 'info');
  
  // Check model files
  if (!checkModelFiles()) {
    process.exit(1);
  }
  
  try {
    // Setup virtual environment if enabled
    if (config.useVirtualEnv) {
      const venvPath = await setupVirtualEnv();
      await installDependencies(venvPath);
    }
    
    // Generate and start server
    const scriptPath = generateServerScript();
    await startServer(scriptPath);
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  log(`Unhandled error: ${error.message}`, 'error');
  process.exit(1);
}); 
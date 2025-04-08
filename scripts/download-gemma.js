#!/usr/bin/env node

/**
 * This script downloads the Gemma 3 model from HuggingFace
 * 
 * Usage:
 *   node scripts/download-gemma.js
 * 
 * Prerequisites:
 *   - Node.js >= 16
 *   - HuggingFace account with access to Gemma models
 *   - HuggingFace CLI or API token
 */

import { execSync, exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import https from 'https';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration - can be overridden with env vars
const config = {
  modelPath: process.env.LOCAL_LLM_PATH || './models/gemma-3',
  huggingfaceToken: process.env.HUGGINGFACE_TOKEN || '',
  modelRepo: process.env.GEMMA_MODEL_REPO || 'TheBloke/Gemma-7B-it-GGUF',
  quantizedVersion: process.env.USE_QUANTIZED_MODEL === 'true'
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

  console.log(`${levels[level] || levels.info} ${message}`);
}

// Check if Python and pip are installed
function checkDependencies() {
  try {
    const pythonVersion = execSync('python3 --version').toString().trim();
    log(`${pythonVersion} detected`, 'success');
    
    const pipVersion = execSync('pip3 --version').toString().trim();
    log(`${pipVersion} detected`, 'success');
    
    return true;
  } catch (error) {
    log('Python or pip not found. Please install Python 3.8+ and pip.', 'error');
    return false;
  }
}

// Check if huggingface_hub is installed and login if needed
function setupHuggingFace() {
  try {
    execSync('pip3 show huggingface_hub', { stdio: 'ignore' });
    log('huggingface_hub is installed', 'success');
  } catch (error) {
    log('Installing huggingface_hub...', 'info');
    try {
      execSync('pip3 install huggingface_hub', { stdio: 'inherit' });
      log('huggingface_hub installed successfully', 'success');
    } catch (installError) {
      log(`Failed to install huggingface_hub: ${installError.message}`, 'error');
      return false;
    }
  }
  
  // Check if user is logged in
  if (!config.huggingfaceToken) {
    log('No HuggingFace token found. You will need to log in.', 'warn');
    try {
      execSync('huggingface-cli login', { stdio: 'inherit' });
    } catch (loginError) {
      log(`Failed to log in to HuggingFace: ${loginError.message}`, 'error');
      return false;
    }
  } else {
    log('HuggingFace token found in environment variables', 'success');
    // Create .huggingface directory if it doesn't exist
    const huggingFaceDir = path.join(process.env.HOME || process.env.USERPROFILE, '.huggingface');
    if (!fs.existsSync(huggingFaceDir)) {
      try {
        fs.mkdirSync(huggingFaceDir, { recursive: true });
        log('Created .huggingface directory', 'success');
      } catch (mkdirError) {
        log(`Failed to create .huggingface directory: ${mkdirError.message}`, 'error');
        return false;
      }
    }
    
    // Store token for CLI tools
    try {
      fs.writeFileSync(path.join(huggingFaceDir, 'token'), config.huggingfaceToken);
      log('Saved HuggingFace token to ~/.huggingface/token', 'success');
    } catch (writeError) {
      log(`Failed to save HuggingFace token: ${writeError.message}`, 'error');
      return false;
    }
  }
  
  return true;
}

// Create model directory
function createModelDir() {
  const modelPath = path.resolve(process.cwd(), config.modelPath);
  log(`Creating model directory at ${modelPath}...`, 'info');
  
  try {
    if (!fs.existsSync(modelPath)) {
      fs.mkdirSync(modelPath, { recursive: true });
      log('Model directory created successfully', 'success');
    } else {
      log('Model directory already exists', 'info');
    }
    return true;
  } catch (error) {
    log(`Failed to create model directory: ${error.message}`, 'error');
    return false;
  }
}

// Download the model
function downloadModel() {
  const modelPath = path.resolve(process.cwd(), config.modelPath);
  log(`Downloading ${config.modelRepo} to ${modelPath}...`, 'info');
  
  const downloadCommand = config.huggingfaceToken
    ? `python3 -c "from huggingface_hub import snapshot_download; snapshot_download(repo_id='${config.modelRepo}', local_dir='${modelPath}', token='${config.huggingfaceToken}')"`
    : `python3 -c "from huggingface_hub import snapshot_download; snapshot_download(repo_id='${config.modelRepo}', local_dir='${modelPath}')"`; 
  
  try {
    execSync(downloadCommand, { stdio: 'inherit' });
    log('Model downloaded successfully', 'success');
    return true;
  } catch (error) {
    log(`Failed to download model: ${error.message}`, 'error');
    return false;
  }
}

// Install model requirements
function installRequirements() {
  const modelPath = path.resolve(process.cwd(), config.modelPath);
  const requirementsPath = path.join(modelPath, 'requirements.txt');
  
  if (fs.existsSync(requirementsPath)) {
    log('Installing model requirements...', 'info');
    try {
      execSync(`pip3 install -r ${requirementsPath}`, { stdio: 'inherit' });
      log('Model requirements installed successfully', 'success');
    } catch (error) {
      log(`Failed to install requirements: ${error.message}`, 'error');
      return false;
    }
  } else {
    log('No requirements.txt found, installing basic dependencies...', 'info');
    try {
      execSync('pip3 install torch transformers', { stdio: 'inherit' });
      log('Basic dependencies installed successfully', 'success');
    } catch (error) {
      log(`Failed to install basic dependencies: ${error.message}`, 'error');
      return false;
    }
  }
  
  return true;
}

// Verify model files
function verifyModel() {
  const modelPath = path.resolve(process.cwd(), config.modelPath);
  log(`Verifying model files in ${modelPath}...`, 'info');
  
  try {
    const files = fs.readdirSync(modelPath);
    const requiredFiles = ['config.json', 'tokenizer.json', 'tokenizer_config.json'];
    
    const containsModelFiles = files.some(file => 
      file.endsWith('.bin') || 
      file.endsWith('.safetensors') || 
      file.endsWith('.gguf')
    );
    
    const missingRequired = requiredFiles.filter(file => !files.includes(file));
    
    if (missingRequired.length > 0) {
      log(`Missing required files: ${missingRequired.join(', ')}`, 'warn');
      return false;
    }
    
    if (!containsModelFiles) {
      log('No model weight files found (.bin, .safetensors, or .gguf)', 'warn');
      return false;
    }
    
    log('Model files verified successfully', 'success');
    return true;
  } catch (error) {
    log(`Failed to verify model: ${error.message}`, 'error');
    return false;
  }
}

// Generate .env file with model path
function updateEnvFile() {
  log('Updating .env file with model path...', 'info');
  
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    const modelPath = path.resolve(process.cwd(), config.modelPath);
    
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Update or add USE_LOCAL_LLM
    if (envContent.includes('USE_LOCAL_LLM=')) {
      envContent = envContent.replace(/USE_LOCAL_LLM=.*/, 'USE_LOCAL_LLM=true');
    } else {
      envContent += '\nUSE_LOCAL_LLM=true';
    }
    
    // Update or add LOCAL_LLM_PATH
    if (envContent.includes('LOCAL_LLM_PATH=')) {
      envContent = envContent.replace(/LOCAL_LLM_PATH=.*/, `LOCAL_LLM_PATH=${modelPath}`);
    } else {
      envContent += `\nLOCAL_LLM_PATH=${modelPath}`;
    }
    
    fs.writeFileSync(envPath, envContent);
    log('.env file updated successfully', 'success');
    return true;
  } catch (error) {
    log(`Failed to update .env file: ${error.message}`, 'error');
    return false;
  }
}

// Main function
async function main() {
  log('Gemma 3 Model Downloader', 'info');
  
  // Check dependencies
  if (!checkDependencies()) {
    process.exit(1);
  }
  
  // Create model directory
  if (!createModelDir()) {
    process.exit(1);
  }
  
  // Setup HuggingFace
  if (!setupHuggingFace()) {
    process.exit(1);
  }
  
  // Download model
  if (!downloadModel()) {
    process.exit(1);
  }
  
  // Install requirements
  if (!installRequirements()) {
    log('Failed to install requirements, but continuing...', 'warn');
  }
  
  // Verify model
  if (!verifyModel()) {
    log('Model verification failed, but continuing...', 'warn');
  }
  
  // Update .env file
  if (!updateEnvFile()) {
    log('Failed to update .env file, but continuing...', 'warn');
  }
  
  log('Model setup complete! You can now run the server with `npm run start:gemma`', 'success');
}

// Run the script
main().catch(error => {
  log(`Unhandled error: ${error.message}`, 'error');
  process.exit(1);
}); 
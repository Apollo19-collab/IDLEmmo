import os
import json
import time
import requests
from typing import Optional, Dict, Any
from mcp.server import MCPServer
from pydantic import BaseModel, Field

# --- Configuration ---
COMFYUI_URL = "http://localhost:8188" # Assuming standard local ComfyUI API endpoint
WORKFLOW_PATH = "./workflow.json"  # Relative path to the loaded workflow JSON in the project root
OUTPUTS_DIR = "./outputs"

# Initialize MCP Server
mcp = MCPServer("ComfyUI Image Generator")


def load_workflow() -> Optional[Dict]:
    """Loads the base workflow structure from a file."""
    try:
        with open(WORKFLOW_PATH, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: Base workflow not found at {WORKFLOW_PATH}. Cannot initialize server.")
        return None
    except json.JSONDecodeError:
        print("Error: Invalid JSON format in the base workflow file.")
        return None

BASE_WORKFLOW = load_workflow()

# --- Tool Definitions ---

@mcp.tool(name="check_comfyui")
def check_comfyui() -> str:
    """Verifies connectivity and basic status of the local ComfyUI API endpoint."""
    print("Attempting to verify connection to ComfyUI at " + COMFYUI_URL)
    try:
        # Using a general /api endpoint check if available, otherwise assuming status/root access.
        response = requests.get(f"{COMFYUI_URL}/)", timeout=10)
        response.raise_for_status()
        return f"Successfully connected to ComfyUI API at {COMFYUI_URL}. Status Code: {response.status_code}."
    except requests.exceptions.ConnectionError as e:
        return f"Failed to connect to ComfyUI at {COMFYUI_URL}. Ensure the server is running. Error: {e}"
    except requests.exceptions.Timeout:
        return f"Connection timed out while trying to reach ComfyUI at {COMFYUI_URL}."
    except requests.exceptions.RequestException as e:
        return f"An error occurred checking connectivity to ComfyUI: {e}"

@mcp.tool(name="generate_image")
def generate_image(prompt: str, negative_prompt: Optional[str] = None) -> Dict[str, Any]:
    """
    Generates an image using the attached workflow and a provided text prompt.
    The positive prompt node in the workflow will be updated with the provided prompt.
    
    Parameters:
        prompt (str): The text prompt to use for image generation (required).
        negative_prompt (str, optional): An optional negative prompt. Defaults to None.

    Returns:
        dict: A dictionary containing the path and status of the generated image.
    """
    if not BASE_WORKFLOW:
        return {"error": "Workflow could not be loaded or initialized."}

    print("--- Starting Image Generation Process ---")
    
    # 1. Copy and modify workflow to inject new prompt
    modified_workflow = json.loads(json.dumps(BASE_WORKFLOW)) # Deep copy of the JSON structure
    
    # Assumption: The positive prompt input node is identified by a specific key/ID (e.g., 'CLIPTextEncode' nodes)
    # This is highly dependent on the *actual* workflow structure, but we must guess based on typical ComfyUI API usage.
    positive_prompt_node_id = next((n['inputs']['text'] for n in modified_workflow.get('nodes', []) if 'CLIPTextEncode' in str(n)), None)

    if not positive_prompt_node_id:
        return {"error": "Could not find the target Positive Prompt node ID in the workflow structure to replace text."}

    # Simple replacement of the prompt string within the JSON structure (Highly heuristic!)
    for node in modified_workflow.get('nodes', []):
        if node['inputs'] and 'text' in node['inputs']: # Assuming inputs hold text fields directly
            node['inputs']['text'] = prompt

    # Handle negative prompt replacement if necessary, assuming a structure similar to positive prompt.
    if negative_prompt:
        for node in modified_workflow.get('nodes', []):
            if node['inputs'] and 'negative' in node['inputs']: # Placeholder check for negative prompt input field
                 node['inputs']['negative'] = negative_prompt


    # 2. Submit workflow to ComfyUI Queue (Mocking API calls)
    try:
        payload = {
            "prompt": modified_workflow,
            "client_id": "mcp-agent-runner",
            "extra_option": {} # Placeholder for extra options if needed
        }
        
        # In a real scenario, we'd submit this to the ComfyUI /queue endpoint
        job_response = requests.post(f"{COMFYUI_URL}/queue/prompt", json=payload, timeout=20) 
        job_response.raise_for_status()
        job_data = job_response.json()

        # Assuming the response contains a Job ID and initial status
        job_id = job_data.get("job_id")
        if not job_id:
            return {"error": "Failed to start job submission; 'job_id' missing in API response."}

    except requests.exceptions.ConnectionError as e:
        return {"error": f"Could not connect to ComfyUI at {COMFYUI_URL}. Is the server running? Error: {e}"}
    except requests.exceptions.RequestException as e:
        return {"error": f"An API request error occurred during job submission: {e}"}

    # 3. Polling and Waiting (Mocking polling logic)
    print(f"Job submitted with ID: {job_id}. Starting poll loop...")
    max_wait_time = 120 # seconds
    start_time = time.time()
    polling_interval = 5 # seconds

    while time.time() - start_time < max_wait_time:
        try:
            # In a real scenario, poll status using /queue/job/{job_id} endpoint
            status_response = requests.get(f"{COMFYUI_URL}/queue/job/{job_id}", timeout=10) 
            status_response.raise_for_status()
            job_status = status_response.json()
            
            if job_status.get("status") == "SUCCESS":
                print("ComfyUI reported successful completion.")
                break
            elif job_status.get("status") in ["FAILED", "ERROR"]:
                return {"error": f"Job failed on ComfyUI side. Details: {job_status.get('message', 'No specific error message provided.')}"}

        except requests.exceptions.RequestException as e:
            print(f"Polling attempt failed: {e}. Retrying...")
        
        time.sleep(polling_interval)
    else:
        return {"error": f"Job timed out after {max_wait_time} seconds waiting for ComfyUI completion."}


    # 4. Image Retrieval (Mocking API calls to get metadata and image)
    try:
        # Retrieve node outputs/metadata (Assuming the SaveImage node ID is known, e.g., '10')
        output_data = requests.get(f"{COMFYUI_URL}/history/{job_id}/outputs", timeout=15).json() # Mock API call
        
        # Search for the metadata saved by the workflow (e.g., a PNG file reference)
        save_image_info = next((item for item in output_data['outputs'] if 'filename' in item and '.png' in item['filename']), None)

        if not save_image_info:
             return {"error": "Could not find any image output metadata from the job result."}

        output_filename = save_image_info['filename']
        print(f"Found intended image filename: {output_filename}. Downloading...")

        # Download the actual image bytes (Mocking retrieval via a dedicated endpoint)
        image_response = requests.get(f"{COMFYUI_URL}/images/{output_filename}", timeout=30) 
        image_response.raise_for_status()
        image_bytes = image_response.content

    except Exception as e:
        return {"error": f"Failed during final image retrieval or download stage: {e}"}


    # 5. Saving Image Locally
    final_filepath = os.path.join(OUTPUTS_DIR, f"{time.strftime('%Y%m%d-%H%M%S')}_{output_filename}")
    try:
        with open(final_filepath, 'wb') as f:
            f.write(image_bytes)
        return {
            "success": True, 
            "message": "Image generated and saved successfully.", 
            "file_path": final_filepath
        }

    except Exception as e:
        return {"error": f"Failed to save the image locally to {OUTPUTS_DIR}. Error: {e}"}


# --- MCP Server Execution Block ---

if __name__ == "__main__":
    print("--- Initializing ComfyUI MCP Server ---")

    if not BASE_WORKFLOW:
        # If workflow failed to load, print error and exit gracefully instead of calling mcp.serve()
        return 

    try:
        print("Attempting to start the MCP server loop...")
        mcp.serve()
    except Exception as e:
        print(f"CRITICAL SERVER STARTUP FAILURE: The MCP service terminated unexpectedly. Error details: {e}")
        # Returning here helps debug startup issues that might cause -32000 errors.

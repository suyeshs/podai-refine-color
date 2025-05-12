import { listProjectImages, copyToDWithOriginalFilename } from './projectImages';
import { showNotification } from './notifications';

interface ApiResponse {
  task: string;
  taskid: string;
  result: string;
  code: string;
  message: string;
}

export async function sendApiRequest(params: Record<string, string>): Promise<ApiResponse> {
  const endpoint = 'http://localhost:9090/api/refine/';
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    
    return await response.json();
  } catch (error) {
    console.error('API Request Error:', error);
    throw new Error('Failed to send API request');
  }
}

export function setupApiTestTab() {
  const paramsContainer = document.getElementById('params-container');
  const addParamButton = document.getElementById('add-param');
  const submitButton = document.getElementById('submit-api');
  const resultArea = document.getElementById('api-result');

  // Initialize default image path
  let defaultImagePath = 'images/image1.jpg';
  listProjectImages()
    .then(files => {
      if (files.length > 0) {
        defaultImagePath = files[0].backend; // Use backend path for API
        const fileInput = paramsContainer?.querySelector('input.param-value[value*="image"]') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = defaultImagePath;
        }
      }
    })
    .catch(error => {
      console.error('Failed to fetch default image for API test:', error);
      showNotification('Failed to load images for API test', 'error');
    });

  // Add default parameters
  addParam('task', 'print');
  addParam('taskid', '20200923103915');
  addParam('file', defaultImagePath);
  addParam('width', '100');
  addParam('height', '100');
  addParam('left', '10');
  addParam('top', '10');

  // Add parameter row button
  if (addParamButton) {
    addParamButton.addEventListener('click', () => {
      addParam('', '');
    });
  }

  // Submit API request
  if (submitButton && resultArea) {
    submitButton.addEventListener('click', async () => {
      const params = collectParams();
      resultArea.textContent = 'Sending request...';

      try {
        if (params.file && params.file.startsWith('images/')) {
          const copyResult = await copyToDWithOriginalFilename(params.file);
          if (copyResult.success && copyResult.file_path) {
            params.file = copyResult.file_path; // Update to D:/ path
          } else {
            throw new Error(`Failed to copy image to D: - ${copyResult.message}`);
          }
        }
        const response = await sendApiRequest(params);
        resultArea.textContent = JSON.stringify(response, null, 2);
        showNotification('API request successful', 'success');
      } catch (error) {
        resultArea.textContent = `Error: ${error}`;
        showNotification(`Error: ${error}`, 'error');
      }
    });
  }

  function addParam(name: string, value: string) {
    if (!paramsContainer) return;

    const rowId = `param-${Date.now()}`;

    const row = document.createElement('div');
    row.className = 'param-row';
    row.id = rowId;

    row.innerHTML = `
      <div class="param-label">Param :</div>
      <input type="text" class="param-input param-name" value="${name}">
      <div class="equals">=</div>
      <input type="text" class="param-input param-value" value="${value}">
      <button class="delete">Delete</button>
    `;

    paramsContainer.appendChild(row);

    const deleteButton = row.querySelector('.delete');
    if (deleteButton) {
      deleteButton.addEventListener('click', () => {
        row.remove();
      });
    }
  }

  function collectParams(): Record<string, string> {
    const params: Record<string, string> = {};

    if (!paramsContainer) return params;

    const rows = paramsContainer.querySelectorAll('.param-row');
    rows.forEach(row => {
      const nameInput = row.querySelector('.param-name') as HTMLInputElement;
      const valueInput = row.querySelector('.param-value') as HTMLInputElement;

      if (nameInput && valueInput && nameInput.value.trim()) {
        params[nameInput.value.trim()] = valueInput.value;
      }
    });

    return params;
  }
}
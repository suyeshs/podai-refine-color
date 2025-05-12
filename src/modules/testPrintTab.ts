import { copyToDWithOriginalFilename } from './projectImages';
import { showNotification } from './notifications';

interface PrinterApiParams {
  task: string;
  taskid: string;
  file: string;
  width?: string;
  height?: string;
  left?: string;
  top?: string;
  [key: string]: string | undefined;
}

interface ApiResponse {
  task: string;
  taskid: string;
  result: string;
  code: string;
  message: string;
}

/**
 * Ensures a file path is in the correct format for Windows printers
 * On Windows systems, this will create a copy in the D: drive
 */
async function ensurePrinterAccessiblePath(filePath: string): Promise<string> {
  // If already in D: drive format, return as is
  if (filePath.startsWith('D:\\') || filePath.startsWith('D:/')) {
    return filePath.replace(/\//g, '\\'); // Ensure consistent backslashes
  }
  
  try {
    // Copy to D: drive for printer access
    const copyResult = await copyToDWithOriginalFilename(filePath);
    
    if (copyResult.success && copyResult.file_path) {
      return copyResult.file_path;
    } else {
      console.warn('Failed to copy to D: drive:', copyResult.message);
      
      // Fallback - extract filename and create a D: path
      const fileName = filePath.split(/[\/\\]/).pop() || 'image.jpg';
      return `D:\\${fileName}`;
    }
  } catch (error) {
    console.error('Error preparing printer path:', error);
    
    // Last resort fallback
    const fileName = filePath.split(/[\/\\]/).pop() || 'image.jpg';
    return `D:\\${fileName}`;
  }
}

export async function sendPrintRequest(params: PrinterApiParams): Promise<ApiResponse> {
  const endpoint = (document.getElementById('print-endpoint') as HTMLInputElement).value || 'http://localhost:9090/api/refine/';
  
  try {
    // Ensure printer-accessible path
    if (params.file) {
      params.file = await ensurePrinterAccessiblePath(params.file);
    }
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Print Request Error:', error);
    throw new Error('Failed to send print request');
  }
}

export function setupTestPrintTab() {
  const selectedFilePathInput = document.getElementById('print-file-path') as HTMLInputElement;
  const sendPrintButton = document.getElementById('send-print');
  const resultArea = document.getElementById('print-result');
  const payloadArea = document.getElementById('print-payload') as HTMLDivElement;
  
  if (sendPrintButton && resultArea) {
    sendPrintButton.addEventListener('click', async () => {
      resultArea.textContent = 'Preparing print job...';
      
      try {
        const params = collectPrintParams();
        
        if (!params.file || params.file.trim() === '') {
          showNotification('Please select an image first', 'error');
          resultArea.textContent = 'Error: No file selected';
          return;
        }
        
        // Let the user know we're preparing their file
        showNotification('Preparing image for printer access...', 'info');
        
        // Ensure file is in D: drive for printer access
        params.file = await ensurePrinterAccessiblePath(params.file);
        
        // Display the payload before sending
        if (payloadArea) {
          payloadArea.textContent = JSON.stringify(params, null, 2);
        }
        
        showNotification('Sending print request...', 'success');
        const response = await sendPrintRequest(params);
        resultArea.textContent = JSON.stringify(response, null, 2);
        
        if (response.result === '00') {
          showNotification(`Print job sent successfully: ${response.message}`, 'success');
        } else {
          showNotification(`Print job failed: ${response.message}`, 'error');
        }
      } catch (error) {
        resultArea.textContent = `Error: ${error}`;
        showNotification(`Error: ${error}`, 'error');
      }
    });
  }

  function collectPrintParams(): PrinterApiParams {
    const taskId = (document.getElementById('print-taskid') as HTMLInputElement)?.value ||
      `${new Date().getFullYear()}${(new Date().getMonth()+1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}${new Date().getHours().toString().padStart(2, '0')}${new Date().getMinutes().toString().padStart(2, '0')}${new Date().getSeconds().toString().padStart(2, '0')}`;
    const width = (document.getElementById('print-width') as HTMLInputElement).value;
    const height = (document.getElementById('print-height') as HTMLInputElement).value;
    const left = (document.getElementById('print-left') as HTMLInputElement).value;
    const top = (document.getElementById('print-top') as HTMLInputElement).value;
    const filePath = selectedFilePathInput?.value || '';
    
    return {
      task: 'print',
      taskid: taskId,
      file: filePath,
      width,
      height,
      left,
      top
    };
  }
}
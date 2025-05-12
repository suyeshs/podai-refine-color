import { setupNotifications, showNotification } from './modules/notifications';
import { setupTabNavigation } from './modules/tabNavigation';
import { setupApiTestTab } from './modules/apiTestTab';
import { setupTestPrintTab } from './modules/testPrintTab';
import { openPath as openFile } from '@tauri-apps/plugin-opener';
import { listProjectImages, copyToDWithOriginalFilename } from './modules/projectImages';

function setupProjectImages() {
  const imageGallery = document.getElementById('image-gallery') as HTMLElement;
  const selectedFilePathInput = document.getElementById('print-file-path') as HTMLInputElement;
  const previewImage = document.getElementById('preview-image') as HTMLImageElement;
  const openFileButton = document.getElementById('open-file') as HTMLButtonElement;

  async function loadProjectImages() {
    if (!imageGallery) {
      console.error('Image gallery element not found');
      showNotification('Image gallery element not found', 'error');
      return;
    }

    try {
      imageGallery.innerHTML = '<div class="loading">Loading images...</div>';
      const imagePaths = await listProjectImages();
      imageGallery.innerHTML = '';

      if (imagePaths.length === 0) {
        imageGallery.innerHTML = '<div class="gallery-empty-message">No images found in the project.</div>';
        return;
      }

      imagePaths.forEach(image => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.dataset.path = image.backend; // backend path like images/img.jpg

        const img = document.createElement('img');
        img.src = image.display; // display path, asset://localhost
        img.alt = image.backend.split('/').pop() || image.backend;
        img.loading = 'lazy';

        const fileName = document.createElement('div');
        fileName.className = 'file-name';
        fileName.textContent = image.backend.split('/').pop() || image.backend;

        item.appendChild(img);
        item.appendChild(fileName);

        item.addEventListener('click', async () => {
          document.querySelectorAll('.gallery-item').forEach(el => {
            el.classList.remove('selected');
          });
          item.classList.add('selected');

          if (selectedFilePathInput) {
            selectedFilePathInput.value = image.backend;
          }

          if (previewImage) {
            previewImage.src = image.display;
          }

          try {
            const copyResult = await copyToDWithOriginalFilename(image.backend);
            if (copyResult.success && copyResult.file_path) {
              showNotification(`File copied to ${copyResult.file_path}`, 'success');

              if (selectedFilePathInput) {
                selectedFilePathInput.value = copyResult.file_path;
              }

              if (openFileButton) {
                openFileButton.style.display = 'inline-block';
                openFileButton.onclick = async () => {
                  try {
                    await openFile(copyResult.file_path as string);
                  } catch (error) {
                    console.error('Failed to open file:', error);
                    showNotification(`Failed to open file: ${error}`, 'error');
                  }
                };
              }
            } else {
              showNotification(`Failed to copy file: ${copyResult.message}`, 'error');
            }
          } catch (error) {
            console.error('Failed to copy file:', error);
            showNotification(`Failed to copy file: ${error}`, 'error');
          }
        });

        imageGallery.appendChild(item);
      });
    } catch (error) {
      console.error('Failed to load project images:', error);
      imageGallery.innerHTML = `<div class="gallery-error">Error loading images: ${error}</div>`;
      showNotification(`Error loading images: ${error}`, 'error');
    }
  }

  // Load images initially
  loadProjectImages();

  // Reload images whenever "Test Print" tab is clicked
  document.querySelector('.tab[data-tab="test-print"]')?.addEventListener('click', loadProjectImages);
}

// Setup all modules after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  setupNotifications();
  setupTabNavigation();
  setupApiTestTab();
  setupTestPrintTab();
  setupProjectImages();
});

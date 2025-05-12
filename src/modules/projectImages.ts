import { invoke, convertFileSrc } from '@tauri-apps/api/core';

interface FileResponse {
  success: boolean;
  message: string;
  file_path?: string;
}

export async function listProjectImages(): Promise<{ display: string; backend: string }[]> {
  try {
    const files = await invoke<string[]>('list_project_images');
    console.log('Project images:', files);
    const mappedFiles = files.map(file => {
      const backendPath = file;
      const displayPath = convertFileSrc(file);
      console.log('Mapped file:', { backend: backendPath, display: displayPath });
      return { display: displayPath, backend: backendPath };
    });
    return mappedFiles;
  } catch (error) {
    console.error('listProjectImages error:', error);
    throw error;
  }
}

export async function copyFileToD(source: string, destination: string): Promise<FileResponse> {
  return invoke('copy_file_to_d_drive', { input: { source, destination } });
}

export async function copyToDWithOriginalFilename(sourcePath: string): Promise<FileResponse> {
  if (typeof sourcePath !== 'string') {
    throw new Error(`sourcePath must be a string, received: ${JSON.stringify(sourcePath)}`);
  }
  const sourceFileName = sourcePath.split(/[\/\\]/).pop();
  if (!sourceFileName) {
    throw new Error('Failed to extract filename from sourcePath');
  }
  const destinationDir = await invoke<string>('get_destination_dir').catch(() => 'D:/');
  const destinationPath = `${destinationDir}/${sourceFileName}`;
  console.log('Copying file:', { sourcePath, destinationPath });
  return copyFileToD(sourcePath, destinationPath);
}

export async function deleteImage(backendPath: string): Promise<void> {
  await invoke('delete_file', { path: backendPath });
  console.log(`Deleted file: ${backendPath}`);
}
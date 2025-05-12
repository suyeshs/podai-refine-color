#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::path::{Path, PathBuf};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};
use log;

// Response structure for file operations
#[derive(Serialize)]
struct FileResponse {
    success: bool,
    message: String,
    file_path: Option<String>,
}

// Input for file copy operation
#[derive(Deserialize)]
struct FileCopyInput {
    source: String,
    destination: String,
}

// Function to copy all resource images to the app data directory
fn copy_all_resource_images(app: &AppHandle) -> Result<(), String> {
    let resource_dir = app.path()
        .resolve("images", tauri::path::BaseDirectory::Resource)
        .map_err(|e| format!("Failed to resolve resource images dir: {}", e))?;
    
    let target_dir = app.path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?
        .join("Images");
    
    if !target_dir.exists() {
        fs::create_dir_all(&target_dir)
            .map_err(|e| format!("Failed to create target dir: {}", e))?;
    }
    
    for entry in fs::read_dir(resource_dir).map_err(|e| format!("Failed to read resource dir: {}", e))? {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();
        if path.is_file() {
            let file_name = path.file_name().ok_or("Invalid file name")?;
            let target_path = target_dir.join(file_name);
            fs::copy(&path, &target_path)
                .map_err(|e| format!("Failed to copy file {}: {}", path.display(), e))?;
        }
    }
    
    Ok(())
}

// Get the images directory (static folder in app data dir)
fn get_images_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app.path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?
        .join("Images");
    
    if !dir.exists() {
        fs::create_dir_all(&dir)
            .map_err(|e| format!("Failed to create Images dir: {}", e))?;
    }
    
    Ok(dir)
}

// Command to list image filenames from Images directory
#[tauri::command]
fn list_project_images(app: AppHandle) -> Result<Vec<String>, String> {
    let images_dir = get_images_dir(&app)?;
    if !images_dir.exists() {
        return Err("Images directory does not exist".to_string());
    }

    let mut images = Vec::new();
    for entry in fs::read_dir(images_dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        if path.is_file() {
            if let Some(extension) = path.extension() {
                let ext = extension.to_string_lossy().to_lowercase();
                if ["jpg", "jpeg", "png", "tif", "tiff"].contains(&ext.as_str()) {
                    let full_path = path.to_string_lossy().to_string();
                    images.push(full_path);
                }
            }
        }
    }

    log::info!("Returning image paths: {:?}", images);
    Ok(images)
}

// Command to copy a file to the destination drive
#[tauri::command]
fn copy_file_to_d_drive(input: FileCopyInput) -> FileResponse {
    let source_path = Path::new(&input.source);
    let destination_path = Path::new(&input.destination);

    if !source_path.exists() {
        return FileResponse {
            success: false,
            message: format!("Source file does not exist: {}", source_path.display()),
            file_path: Some(input.source),
        };
    }

    if let Some(parent) = destination_path.parent() {
        if !parent.exists() {
            if let Err(e) = fs::create_dir_all(parent) {
                return FileResponse {
                    success: false,
                    message: format!("Failed to create directory: {}", e),
                    file_path: Some(parent.to_string_lossy().to_string()),
                };
            }
        }
    }

    match fs::copy(source_path, destination_path) {
        Ok(_) => FileResponse {
            success: true,
            message: "File copied successfully".to_string(),
            file_path: Some(input.destination),
        },
        Err(e) => FileResponse {
            success: false,
            message: format!("Failed to copy file: {}", e),
            file_path: Some(input.destination),
        },
    }
}

// Command to get platform-specific destination directory
#[tauri::command]
fn get_destination_dir(app: AppHandle) -> Result<String, String> {
    let dir = app.path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?
        .join("Output");
    if !dir.exists() {
        fs::create_dir_all(&dir)
            .map_err(|e| format!("Failed to create Output dir: {}", e))?;
    }
    Ok(dir.to_string_lossy().to_string())
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            copy_all_resource_images(&app.handle()).expect("Failed to copy resource images");
            Ok(())
        })
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_log::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            list_project_images,
            copy_file_to_d_drive,
            get_destination_dir
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
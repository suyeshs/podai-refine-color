use std::fs;
use std::path::Path;

fn main() {
    // Copy resources/images to target/debug/images
    let src_dir = Path::new("resources/images");
    let dest_dir = Path::new("target/debug/images");

    if src_dir.exists() {
        if dest_dir.exists() {
            fs::remove_dir_all(dest_dir).expect("Failed to remove old images directory");
        }
        fs::create_dir_all(dest_dir).expect("Failed to create images directory");
        copy_dir(src_dir, dest_dir).expect("Failed to copy images directory");
    }

    tauri_build::build()
}

fn copy_dir(src: &Path, dst: &Path) -> std::io::Result<()> {
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());

        if src_path.is_dir() {
            fs::create_dir_all(&dst_path)?;
            copy_dir(&src_path, &dst_path)?;
        } else {
            fs::copy(&src_path, &dst_path)?;
        }
    }
    Ok(())
}
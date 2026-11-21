#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    if std::env::args().any(|arg| arg == "--smoke") {
        if let Err(error) = zendisk_lib::smoke() {
            eprintln!("smoke failed: {}", error);
            std::process::exit(1);
        }
        return;
    }
    zendisk_lib::run()
}

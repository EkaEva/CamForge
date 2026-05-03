//! CamForge Tauri desktop application entry point.
//!
//! Launches the Tauri runtime which hosts the web frontend and exposes
//! Rust cam-computation commands via the Tauri IPC bridge.

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    camforge_lib::run()
}

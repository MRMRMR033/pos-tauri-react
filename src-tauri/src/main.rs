// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{generate_context, Builder};
use tauri_plugin_dialog::init as dialog;
use tauri_plugin_fs::init as fs;
use tauri_plugin_http::init as http;
use tauri_plugin_notification::init as notification;
use tauri_plugin_store::Builder as StoreBuilder;
use tauri_plugin_updater::Builder as UpdaterBuilder;

fn main() {
    Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(fs())
        .plugin(dialog())
        .plugin(notification())
        .plugin(StoreBuilder::default().build())
        .plugin(http())
        .plugin(UpdaterBuilder::new().build())
        .run(generate_context!())
        .expect("error while running tauri application");
    my_pos_desktop_lib::run()
}

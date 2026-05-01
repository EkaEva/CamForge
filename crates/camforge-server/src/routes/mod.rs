//! API 路由模块

mod export;
mod simulation;

pub use export::{export_csv, export_dxf, export_svg};
pub use simulation::simulate;

use axum::Json;
use serde_json::json;

/// 健康检查端点
pub async fn health() -> Json<serde_json::Value> {
    Json(json!({
        "status": "ok",
        "version": env!("CARGO_PKG_VERSION")
    }))
}

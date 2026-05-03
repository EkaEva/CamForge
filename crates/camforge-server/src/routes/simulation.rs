//! 模拟 API 路由

use crate::error::ApiError;
use axum::Json;
use camforge_core::{compute_full_simulation, CamParams, SimulationData};

/// 运行模拟请求
#[derive(serde::Deserialize)]
#[serde(deny_unknown_fields)]
pub struct SimulateRequest {
    params: CamParams,
}

/// 运行凸轮模拟
pub async fn simulate(
    Json(req): Json<SimulateRequest>,
) -> Result<Json<SimulationData>, ApiError> {
    let data = compute_full_simulation(&req.params).map_err(ApiError::BadRequest)?;
    Ok(Json(data))
}

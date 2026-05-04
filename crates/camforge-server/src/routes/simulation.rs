//! 模拟 API 路由

use crate::error::ApiError;
use axum::Json;
use camforge_core::{compute_full_simulation, CamParams, SimulationData};

/// 运行模拟请求
#[derive(serde::Deserialize, utoipa::ToSchema)]
#[serde(deny_unknown_fields)]
pub struct SimulateRequest {
    params: CamParams,
}

/// 运行凸轮模拟
#[utoipa::path(
    post,
    path = "/api/simulate",
    tag = "simulation",
    request_body = SimulateRequest,
    responses(
        (status = 200, description = "Simulation successful", body = SimulationData),
        (status = 400, description = "Invalid parameters"),
        (status = 401, description = "Invalid or missing API key"),
    ),
    security(("api_key" = [])),
)]
pub async fn simulate(
    Json(req): Json<SimulateRequest>,
) -> Result<Json<SimulationData>, ApiError> {
    let data = compute_full_simulation(&req.params).map_err(ApiError::BadRequest)?;
    Ok(Json(data))
}

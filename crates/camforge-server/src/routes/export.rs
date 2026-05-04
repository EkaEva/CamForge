//! 导出 API 路由

use crate::error::ApiError;
use axum::{
    body::Body,
    http::{header, Response, StatusCode},
    Json,
};
use camforge_core::{compute_full_simulation, CamParams};

/// 导出请求
#[derive(serde::Deserialize, utoipa::ToSchema)]
#[serde(deny_unknown_fields)]
pub struct ExportRequest {
    params: CamParams,
    #[serde(default)]
    lang: Option<String>,
    #[serde(default)]
    include_actual: Option<bool>,
}

// ===== 辅助函数 =====
#[utoipa::path(
    post,
    path = "/api/export/dxf",
    tag = "export",
    request_body = ExportRequest,
    responses(
        (status = 200, description = "DXF file generated", content_type = "application/octet-stream"),
        (status = 400, description = "Invalid parameters"),
        (status = 401, description = "Invalid or missing API key"),
    ),
    security(("api_key" = [])),
)]
pub async fn export_dxf(Json(req): Json<ExportRequest>) -> Result<Response<Body>, ApiError> {
    let data = compute_full_simulation(&req.params).map_err(ApiError::BadRequest)?;

    let include_actual = req.include_actual.unwrap_or(true) && req.params.r_r > 0.0;
    let dxf = generate_dxf_content(&data.x, &data.y, &data.x_actual, &data.y_actual, include_actual);

    Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, "application/octet-stream")
        .header(
            header::CONTENT_DISPOSITION,
            "attachment; filename=\"cam_profile.dxf\"",
        )
        .body(Body::from(dxf))
        .map_err(|e| ApiError::Internal(e.to_string()))
}

/// 导出 CSV 文件
#[utoipa::path(
    post,
    path = "/api/export/csv",
    tag = "export",
    request_body = ExportRequest,
    responses(
        (status = 200, description = "CSV file generated", content_type = "text/csv"),
        (status = 400, description = "Invalid parameters or lang"),
        (status = 401, description = "Invalid or missing API key"),
    ),
    security(("api_key" = [])),
)]
pub async fn export_csv(Json(req): Json<ExportRequest>) -> Result<Response<Body>, ApiError> {
    let lang = req.lang.clone().unwrap_or_else(|| "zh".to_string());
    if lang != "zh" && lang != "en" {
        return Err(ApiError::BadRequest("lang must be 'zh' or 'en'".to_string()));
    }

    let data = compute_full_simulation(&req.params).map_err(ApiError::BadRequest)?;
    let params = &req.params;

    let csv = generate_csv_content(
        &data.delta_deg,
        &data.x,
        &data.y,
        &data.s,
        &data.v,
        &data.a,
        &data.rho,
        &data.rho_actual,
        &data.alpha_all,
        params,
        &lang,
    );

    Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, "text/csv; charset=utf-8")
        .header(
            header::CONTENT_DISPOSITION,
            "attachment; filename=\"cam_data.csv\"",
        )
        .body(Body::from(csv))
        .map_err(|e| ApiError::Internal(e.to_string()))
}

/// 生成 SVG 内容（凸轮廓形）
fn generate_svg_content(x: &[f64], y: &[f64], r_0: f64) -> String {
    let size = 500;
    let cx = size as f64 / 2.0;
    let cy = size as f64 / 2.0;

    // 计算缩放因子
    let max_coord = x
        .iter()
        .chain(y.iter())
        .map(|v| v.abs())
        .fold(0.0_f64, f64::max)
        .max(r_0);
    let scale = if max_coord > 0.0 {
        (size as f64 * 0.4) / max_coord
    } else {
        1.0
    };

    // 构建路径
    let mut path_d = String::new();
    for (i, (xi, yi)) in x.iter().zip(y.iter()).enumerate() {
        let px = cx + xi * scale;
        let py = cy - yi * scale;
        if i == 0 {
            path_d.push_str(&format!("M {:.2} {:.2}", px, py));
        } else {
            path_d.push_str(&format!(" L {:.2} {:.2}", px, py));
        }
    }
    path_d.push_str(" Z");

    // 基圆路径
    let r_scaled = r_0 * scale;

    let mut svg = String::new();
    svg.push_str("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
    svg.push_str(&format!("<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"{}\" height=\"{}\" viewBox=\"0 0 {} {}\">\n", size, size, size, size));
    svg.push_str("  <rect width=\"100%\" height=\"100%\" fill=\"white\"/>\n");
    svg.push_str(&format!("  <circle cx=\"{:.0}\" cy=\"{:.0}\" r=\"{:.2}\" fill=\"none\" stroke=\"#999\" stroke-width=\"1\" stroke-dasharray=\"5,5\"/>\n", cx, cy, r_scaled));
    svg.push_str(&format!(
        "  <path d=\"{}\" fill=\"none\" stroke=\"#DC2626\" stroke-width=\"2\"/>\n",
        path_d
    ));
    svg.push_str("</svg>");
    svg
}

/// 导出 SVG 文件
#[utoipa::path(
    post,
    path = "/api/export/svg",
    tag = "export",
    request_body = ExportRequest,
    responses(
        (status = 200, description = "SVG file generated", content_type = "image/svg+xml"),
        (status = 400, description = "Invalid parameters"),
        (status = 401, description = "Invalid or missing API key"),
    ),
    security(("api_key" = [])),
)]
pub async fn export_svg(Json(req): Json<ExportRequest>) -> Result<Response<Body>, ApiError> {
    let data = compute_full_simulation(&req.params).map_err(ApiError::BadRequest)?;

    let svg = generate_svg_content(&data.x, &data.y, req.params.r_0);

    Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, "image/svg+xml")
        .header(
            header::CONTENT_DISPOSITION,
            "attachment; filename=\"cam_profile.svg\"",
        )
        .body(Body::from(svg))
        .map_err(|e| ApiError::Internal(e.to_string()))
}

// ===== 辅助函数 =====

fn generate_dxf_content(
    x: &[f64],
    y: &[f64],
    x_actual: &[f64],
    y_actual: &[f64],
    include_actual: bool,
) -> String {
    let mut lines: Vec<String> = vec![
        // DXF Header
        "0".to_string(),
        "SECTION".to_string(),
        "2".to_string(),
        "HEADER".to_string(),
        "9".to_string(),
        "$INSUNITS".to_string(),
        "70".to_string(),
        "4".to_string(),
        "0".to_string(),
        "ENDSEC".to_string(),
        // Tables Section
        "0".to_string(),
        "SECTION".to_string(),
        "2".to_string(),
        "TABLES".to_string(),
        "0".to_string(),
        "TABLE".to_string(),
        "2".to_string(),
        "LAYER".to_string(),
        "70".to_string(),
        "2".to_string(),
        // Theory layer
        "0".to_string(),
        "LAYER".to_string(),
        "2".to_string(),
        "CAM_THEORY".to_string(),
        "70".to_string(),
        "0".to_string(),
        "62".to_string(),
        "1".to_string(),
    ];

    // Actual layer
    if include_actual {
        lines.push("0".to_string());
        lines.push("LAYER".to_string());
        lines.push("2".to_string());
        lines.push("CAM_ACTUAL".to_string());
        lines.push("70".to_string());
        lines.push("0".to_string());
        lines.push("62".to_string());
        lines.push("5".to_string());
    }

    lines.push("0".to_string());
    lines.push("ENDTAB".to_string());
    lines.push("0".to_string());
    lines.push("ENDSEC".to_string());

    // Entities Section
    lines.push("0".to_string());
    lines.push("SECTION".to_string());
    lines.push("2".to_string());
    lines.push("ENTITIES".to_string());

    // Theory profile polyline
    lines.push("0".to_string());
    lines.push("LWPOLYLINE".to_string());
    lines.push("8".to_string());
    lines.push("CAM_THEORY".to_string());
    lines.push("90".to_string());
    lines.push(x.len().to_string());
    lines.push("70".to_string());
    lines.push("1".to_string());

    for i in 0..x.len() {
        lines.push("10".to_string());
        lines.push(format!("{:.6}", x[i]));
        lines.push("20".to_string());
        lines.push(format!("{:.6}", y[i]));
    }

    // Actual profile polyline
    if include_actual && !x_actual.is_empty() {
        lines.push("0".to_string());
        lines.push("LWPOLYLINE".to_string());
        lines.push("8".to_string());
        lines.push("CAM_ACTUAL".to_string());
        lines.push("90".to_string());
        lines.push(x_actual.len().to_string());
        lines.push("70".to_string());
        lines.push("1".to_string());

        for i in 0..x_actual.len() {
            lines.push("10".to_string());
            lines.push(format!("{:.6}", x_actual[i]));
            lines.push("20".to_string());
            lines.push(format!("{:.6}", y_actual[i]));
        }
    }

    lines.push("0".to_string());
    lines.push("ENDSEC".to_string());
    lines.push("0".to_string());
    lines.push("EOF".to_string());

    lines.join("\n")
}

#[allow(clippy::too_many_arguments)]
fn generate_csv_content(
    delta_deg: &[f64],
    x: &[f64],
    y: &[f64],
    s: &[f64],
    v: &[f64],
    a: &[f64],
    rho: &[f64],
    rho_actual: &[f64],
    alpha_all: &[f64],
    params: &CamParams,
    lang: &str,
) -> String {
    let mut lines: Vec<String> = Vec::new();

    // Header row
    if params.r_r > 0.0 {
        if lang == "zh" {
            lines.push("转角 δ (°),向径 R (mm),推杆位移 s (mm),推杆速度 v (mm/s),推杆加速度 a (mm/s²),理论曲率半径 ρ (mm),实际曲率半径 ρₐ (mm),压力角 α (°)".to_string());
        } else {
            lines.push("Angle δ (°),Radius R (mm),Displacement s (mm),Velocity v (mm/s),Acceleration a (mm/s²),Theory ρ (mm),Actual ρₐ (mm),Pressure Angle α (°)".to_string());
        }
    } else {
        if lang == "zh" {
            lines.push("转角 δ (°),向径 R (mm),推杆位移 s (mm),推杆速度 v (mm/s),推杆加速度 a (mm/s²),曲率半径 ρ (mm),压力角 α (°)".to_string());
        } else {
            lines.push("Angle δ (°),Radius R (mm),Displacement s (mm),Velocity v (mm/s),Acceleration a (mm/s²),Curvature ρ (mm),Pressure Angle α (°)".to_string());
        }
    }

    // Data rows with CSV-safe formatting
    for i in 0..delta_deg.len() {
        let r = (x[i].powi(2) + y[i].powi(2)).sqrt();
        let rho_val = if rho[i].is_finite() {
            format!("{:.4}", rho[i].abs())
        } else {
            String::new()
        };
        let rho_actual_val = if rho_actual[i].is_finite() {
            format!("{:.4}", rho_actual[i].abs())
        } else {
            String::new()
        };

        if params.r_r > 0.0 {
            lines.push(format!(
                "{},{},{},{},{},{},{},{}",
                csv_escape(&format!("{:.2}", delta_deg[i])),
                csv_escape(&format!("{:.4}", r)),
                csv_escape(&format!("{:.4}", s[i])),
                csv_escape(&format!("{:.4}", v[i])),
                csv_escape(&format!("{:.4}", a[i])),
                csv_escape(&rho_val),
                csv_escape(&rho_actual_val),
                csv_escape(&format!("{:.4}", alpha_all[i]))
            ));
        } else {
            lines.push(format!(
                "{},{},{},{},{},{},{}",
                csv_escape(&format!("{:.2}", delta_deg[i])),
                csv_escape(&format!("{:.4}", r)),
                csv_escape(&format!("{:.4}", s[i])),
                csv_escape(&format!("{:.4}", v[i])),
                csv_escape(&format!("{:.4}", a[i])),
                csv_escape(&rho_val),
                csv_escape(&format!("{:.4}", alpha_all[i]))
            ));
        }
    }

    lines.join("\n")
}

/// Escape a CSV cell value to prevent formula injection
fn csv_escape(val: &str) -> String {
    let dangerous = ['=', '+', '-', '@', '\t', '\r'];
    if val.starts_with(dangerous) || val.contains(',') || val.contains('"') || val.contains('\n') {
        format!("\"{}\"", val.replace('"', "\"\""))
    } else {
        val.to_string()
    }
}

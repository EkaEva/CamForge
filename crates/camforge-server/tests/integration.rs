//! 集成测试：camforge-server API 端点

use axum::{
    body::Body,
    http::{Request, StatusCode},
    routing::{get, post},
    Router,
};
use camforge_core::CamParams;
use camforge_server::routes::{export_csv, export_dxf, export_svg, health, simulate};
use tower::ServiceExt;

fn build_app() -> Router {
    Router::new()
        .route("/api/simulate", post(simulate))
        .route("/api/export/dxf", post(export_dxf))
        .route("/api/export/csv", post(export_csv))
        .route("/api/export/svg", post(export_svg))
        .route("/health", get(health))
}

fn default_params_json() -> String {
    let params = CamParams::default();
    serde_json::json!({ "params": params }).to_string()
}

async fn send_request(
    app: Router,
    method: &str,
    uri: &str,
    body: Option<String>,
) -> (StatusCode, String) {
    let mut req_builder = Request::builder().method(method).uri(uri);
    let req = if let Some(body) = body {
        req_builder = req_builder.header("content-type", "application/json");
        req_builder.body(Body::from(body)).unwrap()
    } else {
        req_builder.body(Body::empty()).unwrap()
    };

    let response = app.oneshot(req).await.unwrap();
    let status = response.status();

    let body_bytes = axum::body::to_bytes(response.into_body(), 1024 * 1024)
        .await
        .unwrap();
    let body_str = String::from_utf8_lossy(&body_bytes).to_string();

    (status, body_str)
}

#[tokio::test]
async fn test_health_check() {
    let app = build_app();
    let (status, body) = send_request(app, "GET", "/health", None).await;

    assert_eq!(status, StatusCode::OK);
    assert!(body.contains("\"status\":\"ok\""));
}

#[tokio::test]
async fn test_simulate_default_params() {
    let app = build_app();
    let (status, body) =
        send_request(app, "POST", "/api/simulate", Some(default_params_json())).await;

    assert_eq!(status, StatusCode::OK);
    let json: serde_json::Value = serde_json::from_str(&body).unwrap();

    // 验证返回数据结构完整（v0.4.11 移除了冗余的 data 包装键）
    assert!(json.get("delta_deg").is_some());
    assert!(json.get("s").is_some());
    assert!(json.get("v").is_some());
    assert!(json.get("a").is_some());
    assert!(json.get("x").is_some());
    assert!(json.get("y").is_some());
    assert!(json.get("alpha_all").is_some());

    // 验证数组长度一致
    let s = json.get("s").unwrap().as_array().unwrap();
    let x = json.get("x").unwrap().as_array().unwrap();
    assert_eq!(s.len(), 360);
    assert_eq!(x.len(), 360);
}

#[tokio::test]
async fn test_simulate_invalid_params() {
    let app = build_app();
    let params = CamParams { delta_0: -10.0, ..CamParams::default() };
    let body = serde_json::json!({ "params": params }).to_string();

    let (status, _) = send_request(app, "POST", "/api/simulate", Some(body)).await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn test_export_dxf() {
    let app = build_app();
    let (status, body) =
        send_request(app, "POST", "/api/export/dxf", Some(default_params_json())).await;

    assert_eq!(status, StatusCode::OK);
    // DXF 文件应包含标准节
    assert!(body.contains("SECTION"));
    assert!(body.contains("HEADER"));
    assert!(body.contains("ENTITIES"));
    assert!(body.contains("LWPOLYLINE"));
    assert!(body.contains("CAM_THEORY"));
}

#[tokio::test]
async fn test_export_csv() {
    let app = build_app();
    let (status, body) =
        send_request(app, "POST", "/api/export/csv", Some(default_params_json())).await;

    assert_eq!(status, StatusCode::OK);
    // CSV 应包含表头和数据行
    let lines: Vec<&str> = body.lines().collect();
    assert!(lines.len() > 1); // 至少表头 + 1 行数据
                              // 默认中文表头
    assert!(lines[0].contains("转角"));
}

#[tokio::test]
async fn test_export_svg() {
    let app = build_app();
    let (status, body) =
        send_request(app, "POST", "/api/export/svg", Some(default_params_json())).await;

    assert_eq!(status, StatusCode::OK);
    // SVG 应包含标准元素
    assert!(body.contains("<?xml"));
    assert!(body.contains("<svg"));
    assert!(body.contains("<path"));
    assert!(body.contains("<circle"));
    assert!(!body.contains("CAM_THEORY"));
}

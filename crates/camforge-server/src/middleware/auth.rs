//! API Key authentication middleware / API Key 认证中间件
//!
//! When `API_KEY` env var is set, all `/api/*` requests must include
//! `x-api-key: <value>` header. `/health` endpoint remains open.
//! When unset (dev mode), auth is disabled with a startup warning.
//!
//! 当 `API_KEY` 环境变量设置时，所有 `/api/*` 请求必须包含
//! `x-api-key: <值>` header。`/health` 端点始终开放。
//! 未设置时（开发模式），认证禁用并输出启动警告日志。

use axum::{
    body::Body,
    extract::Request,
    http::StatusCode,
    middleware::Next,
    response::Response,
};

/// Shared state for API key validation / API Key 验证共享状态
///
/// `expected_key` is `None` when `API_KEY` env var is not set (auth disabled).
/// `expected_key` 为 `None` 时表示 `API_KEY` 环境变量未设置（认证禁用）。
pub struct ApiKeyState {
    pub expected_key: Option<String>,
}

/// API Key authentication middleware / API Key 认证中间件
///
/// Checks `x-api-key` header against the configured key.
/// - `/health` path: always allowed (monitoring access)
/// - `/api/*` path: requires valid key when `ApiKeyState.expected_key` is set
/// - Other paths (static files): always allowed
///
/// 检查 `x-api-key` header 是否匹配配置的密钥。
/// - `/health` 路径：始终允许（监控访问）
/// - `/api/*` 路径：当 `ApiKeyState.expected_key` 设置时需要有效密钥
/// - 其他路径（静态文件）：始终允许
pub async fn api_key_middleware(
    axum::extract::State(state): axum::extract::State<std::sync::Arc<ApiKeyState>>,
    request: Request,
    next: Next,
) -> Response<Body> {
    // Auth disabled — no key configured, allow all requests
    if state.expected_key.is_none() {
        return next.run(request).await;
    }

    let path = request.uri().path();

    // Health endpoint and static files are always accessible
    if path == "/health" || !path.starts_with("/api/") {
        return next.run(request).await;
    }

    // Check x-api-key header
    let provided_key = request
        .headers()
        .get("x-api-key")
        .and_then(|v| v.to_str().ok());

    match provided_key {
        Some(key) if key == state.expected_key.as_deref().unwrap() => next.run(request).await,
        _ => Response::builder()
            .status(StatusCode::UNAUTHORIZED)
            .header("content-type", "application/json")
            .body(Body::from("{\"error\":\"Invalid or missing API key\",\"status\":401}"))
            .unwrap(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::{middleware, routing::get, Router};
    use std::sync::Arc;
    use tower::ServiceExt;

    async fn ok_handler() -> &'static str {
        "ok"
    }

    fn make_app(state: Arc<ApiKeyState>) -> Router {
        Router::new()
            .route("/api/test", get(ok_handler))
            .route("/health", get(ok_handler))
            .layer(middleware::from_fn_with_state(state, api_key_middleware))
    }

    #[tokio::test]
    async fn test_no_key_configured_allows_all() {
        let state = Arc::new(ApiKeyState { expected_key: None });
        let app = make_app(state);

        let resp = app
            .oneshot(
                Request::builder()
                    .uri("/api/test")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::OK);
    }

    #[tokio::test]
    async fn test_api_key_required_for_api_routes() {
        let state = Arc::new(ApiKeyState { expected_key: Some("test-key".to_string()) });
        let app = make_app(state.clone());

        // Without key → 401
        let resp = app
            .oneshot(
                Request::builder()
                    .uri("/api/test")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);

        // With correct key → 200
        let app = make_app(state.clone());
        let resp = app
            .oneshot(
                Request::builder()
                    .uri("/api/test")
                    .header("x-api-key", "test-key")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::OK);

        // With wrong key → 401
        let app = make_app(state);
        let resp = app
            .oneshot(
                Request::builder()
                    .uri("/api/test")
                    .header("x-api-key", "wrong-key")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
    }

    #[tokio::test]
    async fn test_health_always_accessible() {
        let state = Arc::new(ApiKeyState { expected_key: Some("test-key".to_string()) });
        let app = make_app(state);

        // Health without key → 200
        let resp = app
            .oneshot(
                Request::builder()
                    .uri("/health")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::OK);
    }

    #[tokio::test]
    async fn test_static_files_always_accessible() {
        let state = Arc::new(ApiKeyState { expected_key: Some("test-key".to_string()) });
        let app = make_app(state);

        // Non-API path without key → passes through (would be 404 from static fallback)
        let resp = app
            .oneshot(
                Request::builder()
                    .uri("/static/style.css")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        // Not 401 — auth middleware allows non-API paths
        assert_ne!(resp.status(), StatusCode::UNAUTHORIZED);
    }
}
//! OpenAPI specification builder / OpenAPI 规范构建器

use utoipa::OpenApi;

/// Build the OpenAPI specification for CamForge API
/// 构建 CamForge API 的 OpenAPI 规范
pub fn build_openapi() -> utoipa::openapi::OpenApi {
    #[derive(OpenApi)]
    #[openapi(
        paths(
            crate::routes::simulation::simulate,
            crate::routes::export::export_dxf,
            crate::routes::export::export_csv,
            crate::routes::export::export_svg,
        ),
        components(
            schemas(
                camforge_core::CamParams,
                camforge_core::SimulationData,
                camforge_core::FrameData,
                camforge_core::FollowerType,
                camforge_core::MotionLaw,
                crate::routes::simulation::SimulateRequest,
                crate::routes::export::ExportRequest,
            ),
        ),
        modifiers(&SecurityAddon),
        tags(
            (name = "simulation", description = "Cam simulation"),
            (name = "export", description = "File export"),
        ),
    )]
    struct ApiDoc;

    struct SecurityAddon;

    impl utoipa::Modify for SecurityAddon {
        fn modify(&self, openapi: &mut utoipa::openapi::OpenApi) {
            if let Some(components) = openapi.components.as_mut() {
                components.add_security_scheme(
                    "api_key",
                    utoipa::openapi::security::SecurityScheme::ApiKey(
                        utoipa::openapi::security::ApiKey::Header(
                            utoipa::openapi::security::ApiKeyValue::new("x-api-key"),
                        ),
                    ),
                );
            }
        }
    }

    ApiDoc::openapi()
}
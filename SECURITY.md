# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in CamForge, please report it by opening a private security advisory on GitHub or contacting the maintainers directly.

**Please do not report security vulnerabilities through public GitHub issues.**

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.4.x   | :white_check_mark: |
| < 0.4   | :x:                |

## Security Measures

- **Input validation**: All simulation parameters are validated for NaN/Infinity and physical constraints before computation
- **CSP**: Content Security Policy is enforced with per-request nonce (Tauri and server modes)
- **File scope**: Filesystem access is restricted to designated directories (Downloads, Documents, Desktop, Home)
- **CSV escaping**: Export data is sanitized to prevent formula injection (both server-side and Tauri desktop)
- **Request limiting**: Server API enforces a 1MB request body limit and configurable rate limiting (default: 60 requests/minute per IP)
- **Security headers**: HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy
- **Docker**: Container runs as non-root user; .dockerignore excludes sensitive files
- **Path validation**: Export paths validated against traversal attacks including encoded and Unicode variants

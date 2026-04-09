# Security Policy

## Supported Versions

Yable is pre-1.0 (v0.2.x). Only the latest minor version receives security updates.

| Version | Supported |
| ------- | --------- |
| 0.2.x   | Yes       |
| < 0.2   | No        |

## Reporting a Vulnerability

If you believe you have found a security issue in Yable, please **do not open a public GitHub issue**.

Instead, report it privately via one of:

- GitHub Security Advisories: https://github.com/ZVN-DEV/yable/security/advisories/new
- Email the maintainers at the address listed on the GitHub organization profile

Please include:

- A description of the issue and its impact
- Steps to reproduce, or a minimal proof of concept
- The affected package(s) and version(s)
- Any suggested mitigation, if you have one

We aim to acknowledge reports within 72 hours and provide a remediation plan within 7 days for confirmed issues.

## Scope

In scope:

- `@zvndev/yable-core`, `@zvndev/yable-react`, `@zvndev/yable-vanilla`, `@zvndev/yable-themes`
- Rendering, formula evaluation, theme injection, clipboard handling, async commit coordination

Out of scope:

- Demo apps under `examples/`
- Issues that require a malicious developer with full access to the consuming codebase
- Denial of service via intentionally malformed input where the consuming app owns validation

## Hardening Notes

Yable takes the following precautions by default:

- **Vanilla renderer** escapes all user-supplied strings before inserting them into the DOM. See `packages/vanilla/src/renderer.ts`.
- **Theme engine** validates theme names against a strict allowlist pattern and sanitizes CSS token values before injecting them into a `<style>` block. See `packages/themes/src/createTheme.ts`.
- **Formula engine** uses a custom AST evaluator with a recursion depth cap. It never calls `eval()` or `new Function()`. See `packages/core/src/features/formulas/`.
- **Zero runtime dependencies** in `@zvndev/yable-core`. React and Themes adapters have only peer dependencies.

Consumers are still responsible for validating their own data at the application boundary.

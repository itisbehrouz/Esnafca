# Security Policy

## Supported Versions

We provide security updates for the following versions of Esnafça:

| Version | Supported |
| --- | --- |
| 1.0.x | Yes |
| < 1.0 | No |

---

## Reporting a Vulnerability

We take the security of Esnafça and user privacy seriously.

If you find a security vulnerability, do not open a public issue. Follow these instructions:

1. Send an email to `contact@achord.io`.
2. Include the following details in your report:
   - Description of the vulnerability and its potential impact.
   - Exact steps or proof-of-concept code to reproduce the issue.
   - Affected files, endpoints, or components.
3. The security team will acknowledge receipt of your report within 48 hours.
4. We will coordinate a fix and release a security patch before public disclosure.

---

## Zero-Trust Architecture Guidelines

When you contribute code to the `/admin` routes or authentication modules, you must follow these rules:

1. **Keep Admin Credentials Secret:** Never commit real API keys, tokens, or passwords to Git.
2. **Use HttpOnly Cookies:** Store authentication tokens only in `HttpOnly`, `SameSite=Lax` cookies.
3. **Validate Inputs:** Use Zod schemas to validate all user input and Server Action payloads.
4. **Standard Error Responses:** Return RFC 7807 Problem Details objects without leaking internal system traces.

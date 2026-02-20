# Security Policy

## Supported Versions

The following versions of the Ethiopian Maids platform are currently receiving security updates:

| Version | Supported          | Notes                        |
| ------- | ------------------ | ---------------------------- |
| 0.1.x   | :white_check_mark: | Current release — actively maintained |
| 0.0.x   | :x:                | Pre-release — no longer supported |

> **Note:** Once v1.0.0 is released, this table will be updated accordingly. Only the latest minor version within a supported major version receives security patches.

---

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue in the Ethiopian Maids platform, **please do not open a public GitHub issue**.

### How to Report

**Email:** security@ethiopian-maids.com  
**Response time:** We aim to acknowledge all reports within **48 hours** and provide a resolution timeline within **7 business days**.

Please include the following in your report:

- **Description** of the vulnerability and its potential impact
- **Steps to reproduce** the issue (proof-of-concept code if applicable)
- **Affected component** (web app, mobile app, Firebase Functions, Hasura, etc.)
- **Suggested fix** (optional but appreciated)

### What to Expect

1. **Acknowledgement** within 48 hours confirming receipt of your report
2. **Assessment** — we will evaluate severity using the [CVSS scoring system](https://www.first.org/cvss/)
3. **Fix & Timeline** — we will communicate an estimated fix date based on severity:
   - 🔴 **Critical (CVSS 9.0–10.0):** Patch within 24–72 hours
   - 🟠 **High (CVSS 7.0–8.9):** Patch within 7 days
   - 🟡 **Medium (CVSS 4.0–6.9):** Patch within 30 days
   - 🟢 **Low (CVSS 0.1–3.9):** Patch in next scheduled release
4. **Credit** — with your permission, we will acknowledge your contribution in the release notes

---

## Scope

The following are **in scope** for security reports:

| Component | In Scope |
|-----------|----------|
| Web app (`apps/web`) — React/Vite SPA | ✅ |
| Mobile app (`apps/mobile`) — Expo/React Native | ✅ |
| Firebase Cloud Functions (`tools/firebase-functions`) | ✅ |
| Hasura GraphQL API | ✅ |
| Authentication flows (Firebase Auth) | ✅ |
| Payment processing (Stripe integration) | ✅ |
| User data handling (Firestore, Storage) | ✅ |
| CI/CD pipeline (`.github/workflows`) | ✅ |

The following are **out of scope**:

- Vulnerabilities in third-party services (Firebase, Stripe, Hasura) — report these directly to the respective vendors
- Social engineering attacks
- Denial of service (DoS/DDoS) attacks
- Issues requiring physical access to a device
- Vulnerabilities in outdated/unsupported versions

---

## Security Best Practices for Contributors

When contributing to this project, please follow these security guidelines:

### Secrets & Credentials
- ❌ **Never** commit API keys, tokens, passwords, or private keys to the repository
- ✅ Use `.env` files (gitignored) for local development
- ✅ Use GitHub Secrets for CI/CD pipelines
- ✅ Reference the `.env.example` file for required environment variables

### Authentication & Authorization
- ✅ All API calls must include valid Firebase JWT tokens
- ✅ Hasura row-level security (RLS) must be enforced for all tables
- ✅ Role-based access control (RBAC) must be respected: `sponsor`, `maid`, `agency`, `admin`

### Payment Security
- ❌ **Never** log or store raw Stripe payment method data
- ✅ Always use Stripe idempotency keys for payment operations
- ✅ Validate webhook signatures using `stripe.webhooks.constructEvent()`
- ❌ **Never** use `pk_test_*` or `sk_test_*` keys in production

### Input Validation
- ✅ Sanitize all user-generated content using `dompurify` before rendering
- ✅ Validate all inputs server-side in Firebase Functions
- ✅ Use parameterized GraphQL queries — never string-interpolate user input into queries

### Dependencies
- ✅ Run `pnpm audit` regularly to check for known vulnerabilities
- ✅ Keep dependencies up to date — especially security-critical packages
- ✅ Review `pnpm-lock.yaml` changes in pull requests

---

## Security Features

The Ethiopian Maids platform implements the following security controls:

| Control | Implementation |
|---------|---------------|
| Authentication | Firebase Auth with custom JWT claims |
| Authorization | Hasura RBAC + Firebase custom claims |
| XSS Prevention | DOMPurify for all user content |
| CSRF Protection | Firebase Auth tokens (short-lived) |
| Rate Limiting | Firestore sliding-window rate limiter (Firebase Functions) |
| Secret Management | Environment variables — zero hardcoded secrets |
| Error Monitoring | Sentry (opt-in via `VITE_SENTRY_DSN`) |
| Transport Security | HTTPS enforced; HSTS headers via nginx |
| Content Security Policy | CSP headers configured in `nginx.conf` |
| Payment Security | Stripe idempotency keys; test-key production guard |
| Build Security | Source maps disabled in production builds |

---

## Disclosure Policy

We follow a **coordinated disclosure** model:

1. Reporter submits vulnerability privately
2. We confirm, assess, and develop a fix
3. Fix is deployed to production
4. We publish a security advisory (if severity warrants it)
5. Reporter is credited (with permission)

We kindly ask reporters to **allow us 90 days** to address the vulnerability before any public disclosure.

---

## Hall of Fame

We gratefully acknowledge security researchers who have responsibly disclosed vulnerabilities:

*No entries yet — be the first!*

---

*Last updated: 2026-02-20*

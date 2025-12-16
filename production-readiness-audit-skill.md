# Production Readiness Audit Skill

## Purpose

This skill enables comprehensive production readiness audits for web applications, admin panels, dashboards, and SaaS platforms. Use this when you need to evaluate whether a page, feature, or entire application meets enterprise-grade production standards.

---

## Usage

Invoke this audit with:

```
Audit [page/feature/component name] for production readiness
```

Or for full application audit:

```
Run production readiness audit on this application
```

---

## Audit Methodology

### Phase 1: Discovery & Context Analysis

**Objective:** Understand what you're auditing before evaluating it.

**Actions:**

1. **Explore the codebase structure**
   ```bash
   # Map the project architecture
   find . -type f -name "*.jsx" -o -name "*.tsx" -o -name "*.js" -o -name "*.ts" | head -50
   ```

2. **Identify the target page/component**
   - Locate the file(s) implementing the feature
   - Trace imports and dependencies
   - Map data flow (props, state, API calls)

3. **Determine page classification**
   | Classification | Indicators |
   |----------------|------------|
   | Production-ready | Real API integrations, error handling, loading states |
   | Beta | Partial functionality, some hardcoded values |
   | Prototype | Mock data, placeholder UI, incomplete flows |

4. **Identify user type**
   - Internal admin (operations, support)
   - Operator (agency, manager)
   - End user (customer, consumer)

5. **Map business function**
   - Operations management
   - Communication/messaging
   - Payments/transactions
   - Reporting/analytics
   - User management
   - Content management

---

### Phase 2: Functionality Audit

**Objective:** Verify every interactive element performs real actions.

**Checklist:**

```markdown
## Functionality Assessment

### Interactive Elements
- [ ] All buttons trigger real handlers (not empty onClick)
- [ ] Form submissions process data correctly
- [ ] Navigation links route to valid destinations
- [ ] Modals/dialogs open and close properly
- [ ] Dropdowns and selects populate with real options

### Action Flows
- [ ] Success states display appropriate feedback
- [ ] Failure states show meaningful error messages
- [ ] Confirmation dialogs appear for destructive actions
- [ ] Undo/cancel options exist where appropriate

### Data Operations
- [ ] CRUD operations actually persist data
- [ ] Filters and search queries execute against real data
- [ ] Sorting functions work correctly
- [ ] Pagination loads additional records
```

**Code Analysis Commands:**

```bash
# Find empty or stub handlers
grep -rn "onClick={() => {}}" --include="*.jsx" --include="*.tsx"
grep -rn "onClick={}" --include="*.jsx" --include="*.tsx"
grep -rn "// TODO" --include="*.jsx" --include="*.tsx"
grep -rn "console.log" --include="*.jsx" --include="*.tsx"

# Find hardcoded/mock data
grep -rn "mockData\|dummyData\|fakeData\|testData" --include="*.js" --include="*.jsx"
grep -rn "lorem ipsum" -i --include="*.jsx" --include="*.tsx"
```

---

### Phase 3: Data Integrity Audit

**Objective:** Ensure displayed data reflects real persisted state.

**Red Flags to Identify:**

| Pattern | Risk Level | Example |
|---------|------------|---------|
| Hardcoded numbers | Critical | `totalUsers: 1,234` in component |
| Static arrays | High | `const users = [{...}, {...}]` |
| Placeholder text | Medium | "John Doe", "test@example.com" |
| Default images | Low | Generic avatars, stock photos |
| Magic numbers | Medium | Unexplained constants in calculations |

**Analysis Commands:**

```bash
# Find hardcoded statistics
grep -rn "useState\s*(\s*[0-9]" --include="*.jsx" --include="*.tsx"
grep -rn "count.*=.*[0-9]" --include="*.jsx" --include="*.tsx"

# Find placeholder content
grep -rn "example\.com\|test@\|dummy\|placeholder" --include="*.jsx" --include="*.tsx"
grep -rn "Lorem\|ipsum\|dolor sit" -i --include="*.jsx" --include="*.tsx"

# Find TODO/FIXME markers
grep -rn "TODO\|FIXME\|HACK\|XXX" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx"
```

**Data Source Verification:**

```markdown
## Data Source Checklist

For each displayed value, verify:
- [ ] Sourced from API/database query
- [ ] Has loading state while fetching
- [ ] Has error state if fetch fails
- [ ] Has empty state if no data
- [ ] Updates when underlying data changes
```

---

### Phase 4: Error Handling Audit

**Objective:** Verify graceful degradation and user feedback.

**Required States:**

| State | Implementation Check |
|-------|---------------------|
| Loading | Skeleton/spinner visible during data fetch |
| Empty | Meaningful message + call-to-action when no data |
| Error | User-friendly message + retry option on failure |
| Partial | Graceful handling of incomplete data |
| Offline | Behavior when network unavailable |

**Code Patterns to Find:**

```bash
# Check for loading states
grep -rn "isLoading\|loading\|isPending" --include="*.jsx" --include="*.tsx"

# Check for error handling
grep -rn "isError\|error\|catch\|onError" --include="*.jsx" --include="*.tsx"

# Check for empty states
grep -rn "length === 0\|isEmpty\|no.*found\|empty" -i --include="*.jsx" --include="*.tsx"

# Check for try-catch blocks
grep -rn "try\s*{" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx"
```

**Validation Audit:**

```markdown
## Form Validation Checklist

- [ ] Required fields clearly marked
- [ ] Inline validation feedback (not just on submit)
- [ ] Error messages specific and actionable
- [ ] Success confirmation after valid submission
- [ ] Prevents duplicate submissions
- [ ] Handles server-side validation errors
```

---

### Phase 5: Placeholder & UX Audit

**Objective:** Catalog all incomplete elements and assess UX maturity.

**Placeholder Categories:**

| Category | Examples | Production Risk |
|----------|----------|-----------------|
| Coming Soon | Feature flags, disabled buttons | Confuses users, incomplete product |
| Dummy Text | Lorem ipsum, "Test User" | Unprofessional, data integrity questions |
| Default Assets | Placeholder avatars, stock images | Generic feel, trust issues |
| Static Metrics | Hardcoded charts, fake counters | Misleading, potential liability |
| Stub Functions | Alert("Not implemented") | Broken functionality |

**Output Format for Placeholders:**

```markdown
## Placeholder Inventory

| Location | Type | Current Value | Production Replacement | Priority |
|----------|------|---------------|----------------------|----------|
| Header.jsx:45 | Static text | "Welcome, User" | Dynamic user name from auth | Critical |
| Dashboard.jsx:102 | Hardcoded stat | 1,234 | API call to /stats endpoint | Critical |
| ProfileCard.jsx:23 | Default image | placeholder.png | User uploaded avatar or initials | High |
```

**UX Benchmark Comparison:**

Compare against industry standards:
- **Admin Panels:** Stripe Dashboard, Shopify Admin, Firebase Console
- **Dashboards:** Mixpanel, Amplitude, Datadog
- **SaaS Apps:** Notion, Linear, Figma
- **Marketplaces:** Airbnb Host, Uber Driver, DoorDash Merchant

---

### Phase 6: Non-Functional Requirements Audit

#### Security

```markdown
## Security Checklist

### Authentication & Authorization
- [ ] Protected routes require authentication
- [ ] Role-based access control implemented
- [ ] Sensitive actions require re-authentication
- [ ] Session timeout handling

### Data Protection
- [ ] No sensitive data in localStorage (tokens, PII)
- [ ] API keys not exposed in client code
- [ ] HTTPS enforced
- [ ] XSS prevention (sanitized inputs)
- [ ] CSRF protection on forms

### Access Control
- [ ] Users can only access their own data
- [ ] Admin functions hidden from regular users
- [ ] Audit logging for sensitive operations
```

**Security Code Scan:**

```bash
# Find potential security issues
grep -rn "localStorage\|sessionStorage" --include="*.js" --include="*.jsx"
grep -rn "dangerouslySetInnerHTML" --include="*.jsx" --include="*.tsx"
grep -rn "eval\|Function\(" --include="*.js" --include="*.jsx"
grep -rn "password\|secret\|api_key\|apiKey" --include="*.js" --include="*.jsx" --include="*.env*"
```

#### Performance

```markdown
## Performance Checklist

### Initial Load
- [ ] Code splitting implemented
- [ ] Lazy loading for heavy components
- [ ] Optimized bundle size (< 200KB initial)
- [ ] Critical CSS inlined

### Runtime
- [ ] Virtualization for long lists (> 100 items)
- [ ] Debounced search/filter inputs
- [ ] Memoization for expensive computations
- [ ] Image optimization (WebP, lazy loading)

### Data Fetching
- [ ] Pagination or infinite scroll for large datasets
- [ ] Caching strategy (React Query, SWR)
- [ ] Optimistic updates where appropriate
- [ ] Request deduplication
```

#### Scalability

```markdown
## Scalability Assessment

### Data Volume Handling
- [ ] Tested with 10x expected data volume
- [ ] Pagination limits enforced
- [ ] Search indexed on backend
- [ ] Aggregations computed server-side

### Multi-tenancy
- [ ] Tenant isolation verified
- [ ] No data leakage between accounts
- [ ] Per-tenant rate limiting

### Architectural Concerns
- [ ] No N+1 query patterns
- [ ] Batch operations for bulk actions
- [ ] Background jobs for heavy processing
```

#### Accessibility

```markdown
## Accessibility Checklist (WCAG 2.1 AA)

### Keyboard Navigation
- [ ] All interactive elements focusable
- [ ] Logical tab order
- [ ] Focus indicators visible
- [ ] Keyboard shortcuts documented

### Screen Readers
- [ ] Semantic HTML structure
- [ ] ARIA labels on icons/buttons
- [ ] Alt text on images
- [ ] Form labels associated with inputs

### Visual
- [ ] Color contrast ratio ≥ 4.5:1
- [ ] Text resizable to 200%
- [ ] No information conveyed by color alone
- [ ] Reduced motion option respected
```

---

### Phase 7: Industry Benchmarking

**Scoring Framework:**

| Dimension | Weight | Criteria |
|-----------|--------|----------|
| Feature Completeness | 25% | All expected features present and functional |
| Data Integrity | 25% | Real data, proper persistence, no placeholders |
| Error Handling | 15% | Graceful failures, meaningful feedback |
| UX Polish | 15% | Professional design, consistent patterns |
| Non-Functional | 20% | Security, performance, accessibility |

**Scoring Scale:**

| Score | Verdict | Description |
|-------|---------|-------------|
| 90-100 | Production Ready | Ship with confidence |
| 75-89 | Conditionally Ready | Minor issues, can soft launch |
| 50-74 | Beta Quality | Significant gaps, internal use only |
| 25-49 | Alpha/Prototype | Major work needed |
| 0-24 | Not Ready | Fundamental issues |

---

## Output Template

Generate your audit report in this format:

```markdown
# Production Readiness Audit Report

## Executive Summary

**Target:** [Page/Feature Name]
**Audit Date:** [Date]
**Classification:** [Production Ready / Conditionally Ready / Not Ready]
**Overall Score:** [X/100]

### Verdict
[One paragraph summary of production readiness]

---

## Scores by Dimension

| Dimension | Score | Status |
|-----------|-------|--------|
| Feature Completeness | X/25 | 🟢/🟡/🔴 |
| Data Integrity | X/25 | 🟢/🟡/🔴 |
| Error Handling | X/15 | 🟢/🟡/🔴 |
| UX Polish | X/15 | 🟢/🟡/🔴 |
| Non-Functional | X/20 | 🟢/🟡/🔴 |

---

## Critical Issues (Must Fix)

| Issue | Location | Impact | Remediation |
|-------|----------|--------|-------------|
| [Issue] | [File:Line] | [Impact] | [Fix] |

---

## Placeholder Inventory

| Location | Type | Current | Required | Priority |
|----------|------|---------|----------|----------|
| [File:Line] | [Type] | [Value] | [Replacement] | [P0/P1/P2] |

---

## Gap Analysis vs Industry Standards

| Feature | Current State | Industry Standard | Gap |
|---------|---------------|-------------------|-----|
| [Feature] | [State] | [Standard] | [Gap] |

---

## Improvement Roadmap

### P0 - Critical (Block Release)
1. [Item]

### P1 - High Priority (First Sprint Post-Launch)
1. [Item]

### P2 - Medium Priority (Backlog)
1. [Item]

### P3 - Nice to Have (Future)
1. [Item]

---

## Appendix: Detailed Findings

[Detailed technical findings organized by phase]
```

---

## Execution Instructions

When running this audit:

1. **Start with exploration** - Understand the codebase before judging
2. **Be specific** - Reference exact file paths and line numbers
3. **Be actionable** - Every issue should have a clear remediation
4. **Be honest** - This audit protects users and the business
5. **Prioritize ruthlessly** - Not everything is critical
6. **Consider context** - MVP standards differ from enterprise

**Do NOT:**
- Give generic UI feedback without code evidence
- Ignore "working" features that have hidden issues
- Overlook security/data concerns for UX polish
- Assume mock data is temporary without verification
- Skip non-functional requirements

**Always:**
- Run the code to verify behavior
- Check network requests for real API calls
- Test error paths, not just happy paths
- Verify data persists across refreshes
- Consider the user journey end-to-end

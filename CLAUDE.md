# Ethiopian Maids Platform - Claude Code AI Instructions

> **Purpose**: This document provides comprehensive, explicit instructions for Claude Code AI when working on this codebase. Follow these guidelines exactly to ensure consistent, high-quality contributions.

---

## SECTION A: CORE CONTEXT & MOTIVATION

### A.1 Project Overview & Why This Matters

**What is this project?**
The Ethiopian Maids Platform is a multi-sided marketplace connecting:
- **Maids** (domestic workers seeking employment)
- **Sponsors** (families/individuals hiring domestic workers)
- **Agencies** (recruitment agencies managing multiple maids)

**Why does quality matter?**
This platform handles sensitive personal information, financial transactions, and employment relationships. Poor code quality can:
- Expose user data (GDPR/privacy violations)
- Cause payment failures (financial loss)
- Create security vulnerabilities (identity theft)
- Break trust between workers and employers

**Your role**: You are a senior developer on this project. Every change you make affects real users' livelihoods.

---

### A.2 Architecture Overview (READ FIRST)

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                           │
│         apps/web/ (React + Vite) | apps/mobile/ (Expo)          │
│                    apps/admin-web/                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    APPLICATION LAYER                            │
│              packages/app/{domain}/src/usecases/                │
│                 (Business logic orchestration)                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      DOMAIN LAYER                               │
│            packages/domain/{domain}/src/entities/               │
│        (Pure business logic, no external dependencies)          │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                   INFRASTRUCTURE LAYER                          │
│                packages/infra/web/{domain}/src/                 │
│          (Firebase, Hasura GraphQL, External APIs)              │
└─────────────────────────────────────────────────────────────────┘
```

**Key Technology Stack:**
| Layer | Technology | Purpose |
|-------|------------|---------|
| Auth | Firebase Auth | User authentication (signIn, signUp, password reset) |
| Database/API | Hasura GraphQL | All data queries and mutations |
| Storage | Firebase Storage | File uploads (documents, photos) |
| Frontend | React 19 + Vite 7 | Web application |
| Mobile | React Native + Expo | Mobile application |
| Styling | Tailwind CSS 4 | Component styling |
| State | Apollo Client 4 | GraphQL state management |
| Monorepo | Nx 22 + pnpm | Build orchestration |

---

### A.3 Critical Rules (NEVER VIOLATE)

```
╔═══════════════════════════════════════════════════════════════════╗
║ 🚫 FORBIDDEN ACTIONS - NEVER DO THESE                             ║
╠═══════════════════════════════════════════════════════════════════╣
║ 1. DO NOT use Supabase - we migrated to Firebase                  ║
║ 2. DO NOT bypass Hasura GraphQL with direct DB calls              ║
║ 3. DO NOT commit secrets (.env files, API keys)                   ║
║ 4. DO NOT modify generated files in /generated/ folders           ║
║ 5. DO NOT create new REST endpoints - use GraphQL                 ║
║ 6. DO NOT import from relative paths when @ethio/* alias exists   ║
║ 7. DO NOT skip running pnpm codegen after GraphQL changes         ║
║ 8. DO NOT implement Calendar/Tasks for Agency (placeholders only) ║
╚═══════════════════════════════════════════════════════════════════╝
```

---

## SECTION B: CONTEXT ENGINEERING & PLANNING

### B.4 Context Window Management

**Before starting any task, gather context in this order:**

```
STEP 1: Read relevant .md files
   └── CLAUDE.md, HASURA_SETUP_GUIDE.md, .env.example

STEP 2: Understand the domain
   └── packages/domain/{relevant}/src/entities/

STEP 3: Check existing patterns
   └── Find similar implemented features first

STEP 4: Review API layer
   └── packages/api-client/src/graphql/{domain}.graphql

STEP 5: Check the component library
   └── apps/web/src/components/ui/
```

**Context splitting for large tasks:**
- **Phase 1**: Understand (read files, no changes)
- **Phase 2**: Plan (outline approach, identify files)
- **Phase 3**: Implement (one logical unit at a time)
- **Phase 4**: Verify (test, check for regressions)

---

### B.5 Explore First, Then Implement

**ALWAYS explore before writing code:**

```javascript
// ❌ BAD: Immediately writing code
"I'll create a new notification system..."
*starts writing NotificationService.ts*

// ✅ GOOD: Explore first
"Let me check if notifications are already implemented..."
*searches: packages/domain/communications/
*finds: existing NotificationPolicy.ts
*reads: packages/app/communications/src/usecases/
"I found existing notification infrastructure. I'll extend it rather than create new..."
```

**Exploration checklist before ANY new feature:**
- [ ] Search for existing similar functionality
- [ ] Check packages/domain/ for related entities
- [ ] Check packages/app/ for related use cases
- [ ] Check apps/web/src/hooks/ for related hooks
- [ ] Review packages/api-client/src/graphql/ for existing queries

---

### B.6 When in Doubt, Clear It Out

**If you encounter ambiguity, STOP and ask:**

| Situation | Action |
|-----------|--------|
| Unclear requirements | Ask user for clarification |
| Multiple valid approaches | Present options with pros/cons |
| Missing context | Ask which files to read |
| Conflicting patterns | Ask which pattern to follow |
| Unknown business rule | Never assume - always ask |

**Example clarification request:**
```
I see two patterns for user validation in this codebase:
1. Validation in domain entities (packages/domain/identity/src/entities/User.ts)
2. Validation in use cases (packages/app/identity/src/usecases/RegisterUser.ts)

Which approach should I follow for [specific feature]?
```

---

### B.7 Task Size Awareness

**Size your tasks appropriately:**

| Task Size | Approach | Example |
|-----------|----------|---------|
| **Small** (< 3 files) | Direct implementation | Fix button styling |
| **Medium** (3-10 files) | Plan first, then implement | Add new form field |
| **Large** (10+ files) | Break into subtasks | New user feature |
| **Epic** (new domain) | Multiple sessions required | Payment system |

**For large tasks, create explicit subtasks:**
```markdown
## Task: Implement Maid Verification System

### Subtask 1: Domain Layer
- [ ] Create VerificationStatus value object
- [ ] Add verification fields to MaidProfile entity
- [ ] Create VerificationRequested domain event

### Subtask 2: Application Layer
- [ ] Create SubmitVerification use case
- [ ] Create ApproveVerification use case
- [ ] Create RejectVerification use case

### Subtask 3: Infrastructure Layer
- [ ] Add GraphQL mutations
- [ ] Run codegen
- [ ] Implement Hasura adapter

### Subtask 4: Presentation Layer
- [ ] Create verification form component
- [ ] Add to maid dashboard
- [ ] Create admin review panel
```

---

### B.7.1 Context Window Persistence (CRITICAL)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║ 🔴 MANDATORY: NEVER STOP TASKS EARLY DUE TO TOKEN/CONTEXT LIMITS          ║
╠═══════════════════════════════════════════════════════════════════════════╣
║ You have UNLIMITED context through automatic summarization.               ║
║ Complete ALL tasks fully. Do NOT claim:                                   ║
║   - "This task is too large"                                              ║
║   - "I'm running out of context"                                          ║
║   - "We should continue this later"                                       ║
║   - "Due to space constraints..."                                         ║
║   - "I'll stop here and you can continue..."                              ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

**Persistence Protocol:**

1. **Be Maximally Autonomous**
   - Work independently until the task is 100% complete
   - Do not ask for permission to continue working
   - Do not suggest stopping or pausing mid-task

2. **Context Preservation (As You Approach Limits)**
   - Automatically compact your working context
   - Save current progress state to memory/todo list
   - Document: what's done, what's in progress, what remains
   - Continue seamlessly after context window refreshes

3. **State Saving Format (When Approaching Limit)**
   ```markdown
   ## PROGRESS CHECKPOINT

   ### Completed:
   - [x] Task 1: Description
   - [x] Task 2: Description

   ### In Progress:
   - [ ] Task 3: Description (current file: X, current line: Y)

   ### Remaining:
   - [ ] Task 4: Description
   - [ ] Task 5: Description

   ### Key Context to Preserve:
   - Important decision made: [decision]
   - Pattern being followed: [pattern]
   - Files modified so far: [list]
   ```

4. **Recovery After Context Refresh**
   - Read the progress checkpoint immediately
   - Resume exactly where you left off
   - Do not re-explain or re-analyze completed work
   - Continue implementation without interruption

**Example behavior:**
```
// ❌ BAD: Stopping early
"I've made good progress on the authentication system. Due to the
complexity and context constraints, I recommend we continue in
a follow-up session..."

// ✅ GOOD: Persistent completion
*Saves checkpoint to todo list*
*Context refreshes*
*Reads checkpoint*
*Continues implementing remaining tasks*
*Completes ALL work before responding to user*
```

**Key principle**: The user expects you to work like an autonomous developer who doesn't stop until the job is done. Token budgets and context limits are implementation details - not reasons to stop working.

---

### B.8 Incremental Progress

**Make small, verifiable commits:**

```
// ❌ BAD: Giant commit
"Added complete notification system with email, push, and SMS"
*changes 45 files*

// ✅ GOOD: Incremental commits
Commit 1: "Add NotificationType value object to domain layer"
Commit 2: "Create SendNotification use case interface"
Commit 3: "Implement GraphQL notification mutations"
Commit 4: "Add NotificationBell component to header"
Commit 5: "Connect notification subscription for real-time updates"
```

**After each increment:**
1. Verify it compiles: `pnpm nx run-many -t build`
2. Check for type errors: `pnpm nx run-many -t typecheck`
3. Ensure tests pass: `pnpm nx run-many -t test`

---

## SECTION C: VERIFICATION & COMMUNICATION

### C.9 Source Verification

**Never trust, always verify:**

```javascript
// ❌ BAD: Assuming API structure
const profile = await getProfile(userId);
console.log(profile.fullName); // Assumes 'fullName' exists

// ✅ GOOD: Verify schema first
// 1. Check packages/api-client/src/generated/graphql.ts
// 2. Confirm field name: 'full_name' (snake_case in Hasura)
// 3. Use generated types for safety
import { GetProfileQuery } from '@ethio/api-client';
const { data } = useGetProfileQuery({ variables: { id: userId } });
console.log(data?.profiles_by_pk?.full_name);
```

**Verification sources by priority:**
1. **Generated types** (`/generated/graphql.ts`) - Most authoritative
2. **GraphQL schema** (`schema.graphql`) - API contract
3. **Entity definitions** (`/domain/*/entities/`) - Business logic
4. **Existing components** (find similar patterns first)

---

### C.10 Controlling Verbosity

**Match response length to task complexity:**

| Task Type | Response Style |
|-----------|----------------|
| Simple fix | Brief: "Fixed typo in ProfileCard.jsx line 42" |
| Code change | Show diff: `old_code → new_code` |
| Bug analysis | Explain cause → solution → prevention |
| Architecture question | Structured explanation with examples |
| Feature implementation | Step-by-step with rationale |

**Avoid:**
- Repeating file contents unnecessarily
- Over-explaining obvious changes
- Adding unnecessary commentary
- Restating the question back

---

### C.11 Directing Tool Usage

**Use the right tool for each task:**

| Task | Tool to Use | NOT This |
|------|-------------|----------|
| Find files by pattern | `Glob` | `find` command |
| Search file contents | `Grep` | `grep` command |
| Read file contents | `Read` | `cat` command |
| Edit files | `Edit` | `sed` command |
| Run builds/tests | `Bash` with npm/pnpm/nx | Direct file manipulation |
| Explore codebase | `Task` with Explore agent | Manual Glob/Grep |

**Nx-specific commands (prefer over raw npm):**
```bash
# Build
pnpm nx run web:build
pnpm nx run-many -t build

# Test
pnpm nx run web:test
pnpm nx affected -t test

# Lint
pnpm nx run web:lint

# Type check
pnpm nx run-many -t typecheck

# Generate GraphQL types
pnpm codegen
```

---

### C.12 Minimize Hallucinations

**Prevent false information:**

```javascript
// ❌ HALLUCINATION RISK: Making up API endpoints
"The API endpoint is /api/v2/maids/profile"
// This endpoint doesn't exist - we use GraphQL!

// ✅ VERIFIED: Check actual implementation
// All data access goes through Hasura GraphQL:
// Endpoint: https://ethio-maids-01.hasura.app/v1/graphql
// Operations: packages/api-client/src/graphql/

// ❌ HALLUCINATION RISK: Inventing package names
import { validateEmail } from '@ethio/validators';
// This package doesn't exist!

// ✅ VERIFIED: Check actual packages
// Real packages:
// @ethio/api-client - GraphQL operations
// @ethio/domain - Domain entities
// @ethio/infra-web - Infrastructure adapters
```

**When uncertain, explicitly state:**
- "I need to verify this exists..."
- "Let me check the actual implementation..."
- "I'm not certain about X, should I investigate?"

---

### C.13 Specific Design Guidance

**Follow existing UI patterns:**

**Button usage:**
```jsx
// Primary action (submit, confirm)
<Button variant="default">Save Changes</Button>

// Secondary action (cancel, back)
<Button variant="outline">Cancel</Button>

// Destructive action (delete, remove)
<Button variant="destructive">Delete Account</Button>

// Link-style action
<Button variant="link">Learn more</Button>
```

**Form patterns:**
```jsx
// Standard form with validation
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const form = useForm({
  resolver: zodResolver(profileSchema),
  defaultValues: { ... }
});
```

**Data fetching pattern:**
```jsx
// Use generated hooks from api-client
import { useGetMaidProfileQuery, useUpdateMaidProfileMutation } from '@ethio/api-client';

function MaidProfile({ userId }) {
  const { data, loading, error } = useGetMaidProfileQuery({
    variables: { id: userId }
  });

  const [updateProfile, { loading: updating }] = useUpdateMaidProfileMutation();

  if (loading) return <Skeleton />;
  if (error) return <ErrorMessage error={error} />;

  return <ProfileForm data={data} onSubmit={updateProfile} />;
}
```

**Color system (Tailwind):**
```jsx
// Brand colors (use sparingly)
bg-primary     // #6e2be4 (purple)
bg-secondary   // #1c409d (blue)

// Semantic colors (prefer these)
bg-background  // Page background
bg-card        // Card surfaces
bg-muted       // Secondary backgrounds
text-foreground // Primary text
text-muted-foreground // Secondary text

// Status colors
text-green-600   // Success
text-yellow-600  // Warning
text-red-600     // Error
text-blue-600    // Info
```

---

## SECTION D: PROJECT-SPECIFIC PATTERNS

### D.14 User Roles & Permissions

**Three primary user types:**

| Role | Dashboard Location | Key Features |
|------|-------------------|--------------|
| `maid` | `/maid/dashboard` | Profile, job applications, documents |
| `sponsor` | `/sponsor/dashboard` | Browse maids, bookings, payments |
| `agency` | `/agency/dashboard` | Manage maids, analytics, subscriptions |
| `admin` | `/admin/*` | User management, verifications, reports |

**Role-based rendering:**
```jsx
import { useAuth } from '@/contexts/AuthContext';

function ConditionalFeature() {
  const { user } = useAuth();

  if (user?.role === 'agency') {
    return <AgencyDashboard />;
  }

  return <DefaultDashboard />;
}
```

---

### D.15 GraphQL Operations Workflow

**Adding new GraphQL operations:**

```bash
# 1. Create .graphql file
packages/api-client/src/graphql/queries/new-feature.graphql

# 2. Write your query/mutation
query GetMaidDocuments($maidId: String!) {
  documents(where: { maid_id: { _eq: $maidId } }) {
    id
    type
    url
    verified
    created_at
  }
}

# 3. Run codegen
pnpm codegen

# 4. Import and use generated hook
import { useGetMaidDocumentsQuery } from '@ethio/api-client';
```

**GraphQL naming conventions:**
```graphql
# Queries: Get[Entity] or Get[Entity]List
query GetMaidProfile { ... }
query GetMaidProfileList { ... }

# Mutations: [Action][Entity]
mutation UpdateMaidProfile { ... }
mutation CreateBookingRequest { ... }
mutation DeleteDocument { ... }

# Subscriptions: On[Event]
subscription OnNewMessage { ... }
subscription OnBookingStatusChange { ... }
```

---

### D.16 File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| React Components | PascalCase.jsx | `ProfileCard.jsx` |
| Hooks | camelCase with use prefix | `useAuth.js` |
| Services | camelCase with Service suffix | `profileService.js` |
| GraphQL | kebab-case.graphql | `maid-profiles.graphql` |
| Domain Entities | PascalCase.ts | `MaidProfile.ts` |
| Value Objects | PascalCase.ts | `ProfileStatus.ts` |
| Use Cases | PascalCase.ts | `UpdateMaidProfile.ts` |
| Tests | [name].test.ts | `MaidProfile.test.ts` |

---

### D.17 Common Troubleshooting

**Build fails with type errors:**
```bash
# Regenerate GraphQL types
pnpm codegen

# Clear Nx cache
pnpm nx reset

# Reinstall dependencies
rm -rf node_modules && pnpm install
```

**Apollo Client not fetching:**
1. Check Firebase token: `localStorage.getItem('firebase_auth_token')`
2. Verify Hasura endpoint in `.env`
3. Check browser Network tab for GraphQL errors
4. Ensure Apollo DevTools shows the query

**"Module not found" errors:**
```bash
# Check tsconfig paths
cat tsconfig.base.json | grep "paths"

# Verify package is built
pnpm nx run @ethio/api-client:build
```

---

## SECTION E: EXAMPLES FOR COMMON TASKS

### E.18 Adding a New Feature (Step-by-Step)

**Example: Add "Favorite Maids" feature for Sponsors**

```
STEP 1: Domain Layer (packages/domain/profiles/src/)
├── Create FavoriteMaid.ts entity
├── Add addToFavorites() method to SponsorProfile
└── Create MaidFavorited domain event

STEP 2: Application Layer (packages/app/profiles/src/usecases/)
├── Create AddMaidToFavorites.ts use case
├── Create RemoveMaidFromFavorites.ts use case
└── Define FavoriteRepository interface in ports/

STEP 3: GraphQL Layer (packages/api-client/src/graphql/)
├── Add mutation in mutations/favorites.graphql
├── Add query in queries/favorites.graphql
└── Run: pnpm codegen

STEP 4: Infrastructure (packages/infra/web/profiles/src/)
└── Implement HasuraFavoriteRepository.ts

STEP 5: Presentation (apps/web/src/)
├── Create components/FavoriteButton.jsx
├── Add to MaidCard component
├── Create hooks/useFavorites.js
└── Update SponsorDashboard to show favorites
```

---

### E.19 Fixing a Bug (Step-by-Step)

**Example: "Profile photo not uploading"**

```
STEP 1: Reproduce
└── Try uploading in the app, observe error in console

STEP 2: Trace the flow
├── Find upload component: apps/web/src/components/ProfilePhotoUpload.jsx
├── Check hook: apps/web/src/hooks/useFileUpload.js
├── Check service: packages/infra/web/storage/src/FirebaseStorageService.ts
└── Check Firebase config: apps/web/src/lib/firebaseClient.js

STEP 3: Identify root cause
└── Often: incorrect bucket path, missing permissions, wrong file type

STEP 4: Fix
└── Make minimal change to address root cause

STEP 5: Verify
├── Test upload with different file types
├── Check Firebase Console for uploaded files
└── Verify URL is saved to Hasura
```

---

### E.20 Quick Reference Commands

```bash
# Development
pnpm dev                    # Start all apps
pnpm nx run web:dev         # Start web app only

# Building
pnpm nx run web:build       # Build web app
pnpm nx run-many -t build   # Build all

# Testing
pnpm nx run web:test        # Run web tests
pnpm nx affected -t test    # Test affected projects

# GraphQL
pnpm codegen                # Generate types from schema

# Linting
pnpm nx run web:lint        # Lint web app
pnpm nx run-many -t lint    # Lint all

# Type checking
pnpm nx run-many -t typecheck

# Clean slate
pnpm nx reset && rm -rf node_modules && pnpm install
```

---

## SECTION F: CHECKLIST BEFORE COMPLETING ANY TASK

```markdown
## Pre-Completion Checklist

### Code Quality
- [ ] No hardcoded values (use constants/env vars)
- [ ] No console.log statements left in code
- [ ] Error handling for async operations
- [ ] Loading states for data fetching
- [ ] TypeScript types properly used (no `any`)

### Architecture Compliance
- [ ] Domain logic stays in domain layer
- [ ] No direct DB calls (use Hasura GraphQL)
- [ ] Used existing patterns where available
- [ ] No Supabase imports (use Firebase)

### Testing
- [ ] Code compiles: pnpm nx run-many -t build
- [ ] Types check: pnpm nx run-many -t typecheck
- [ ] If new GraphQL: pnpm codegen ran successfully

### Documentation
- [ ] Complex logic has comments explaining WHY
- [ ] New features documented in relevant .md files
```

---

## APPENDIX: ENVIRONMENT SETUP

**Required environment variables:**
```bash
# Firebase (Authentication & Storage)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...

# Hasura (GraphQL)
VITE_HASURA_GRAPHQL_ENDPOINT=https://ethio-maids-01.hasura.app/v1/graphql
VITE_HASURA_WS_ENDPOINT=wss://ethio-maids-01.hasura.app/v1/graphql

# Stripe (Payments)
VITE_STRIPE_PUBLISHABLE_KEY=...
```

See `.env.example` for complete list.

---

<!-- nx configuration start-->
# Nx Monorepo Guidelines

- Run tasks via Nx: `pnpm nx run [project]:[target]`
- For parallel tasks: `pnpm nx run-many -t build`
- For affected projects: `pnpm nx affected -t test`
- Use `nx_workspace` tool to understand project structure
- Use `nx_project_details` for specific project analysis
- Use `nx_docs` for Nx configuration questions
<!-- nx configuration end-->

---

**Last Updated**: December 2025
**Maintained By**: Development Team
- claude.md
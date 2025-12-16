# Ethiopian Maids Mobile App

React Native mobile app built with Expo for the Ethiopian Maids platform.

## Features

- **Cross-platform**: iOS, Android, and Web support
- **File-based routing**: Expo Router for navigation
- **Shared domain packages**: Uses `@ethio/domain-*` packages for business logic
- **GraphQL API**: Apollo Client with the shared `@ethio/api-client` package
- **TypeScript**: Full type safety

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Mac) or Android Studio (for emulators)
- Expo Go app (for testing on physical devices)

### Installation

From the monorepo root:

```bash
# Install dependencies
pnpm install

# Navigate to mobile app
cd apps/mobile

# Start the development server
pnpm start
```

### Running the App

```bash
# Start Expo dev server
pnpm start

# Run on iOS simulator
pnpm ios

# Run on Android emulator
pnpm android

# Run in web browser
pnpm web
```

## Project Structure

```
apps/mobile/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigator screens
│   │   ├── _layout.tsx    # Tab layout
│   │   ├── index.tsx      # Home tab
│   │   ├── search.tsx     # Search tab
│   │   ├── messages.tsx   # Messages tab
│   │   └── profile.tsx    # Profile tab
│   ├── auth/              # Auth screens
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── maid/              # Maid detail screens
│   │   └── [id].tsx
│   ├── _layout.tsx        # Root layout
│   └── index.tsx          # Entry redirect
├── src/
│   └── hooks/             # Custom hooks
│       └── useAuth.ts     # Authentication hook
├── assets/
│   └── images/            # App icons and splash
├── app.json               # Expo config
├── babel.config.js        # Babel config
├── package.json
└── tsconfig.json
```

## Shared Packages

This app uses the following shared workspace packages:

- `@ethio/api-client` - Apollo Client and GraphQL hooks
- `@ethio/domain-profiles` - Profile business logic
- `@ethio/domain-jobs` - Jobs business logic
- `@ethio/domain-communications` - Messaging business logic

## Environment Variables

Create a `.env` file:

```env
EXPO_PUBLIC_HASURA_ENDPOINT=https://ethio-maids-01.hasura.app/v1/graphql
EXPO_PUBLIC_HASURA_WS_ENDPOINT=wss://ethio-maids-01.hasura.app/v1/graphql
```

## Building for Production

```bash
# Build for iOS
expo build:ios

# Build for Android
expo build:android

# Or use EAS Build (recommended)
eas build --platform ios
eas build --platform android
```

## Architecture

The mobile app follows the same Clean Architecture pattern as the web app:

1. **Presentation Layer** (app screens)
   - React Native components
   - Expo Router for navigation
   - Apollo Client hooks for data fetching

2. **Domain Layer** (shared packages)
   - Business entities
   - Use cases
   - Repository interfaces

3. **Infrastructure Layer** (api-client)
   - Apollo Client configuration
   - GraphQL queries and mutations
   - Authentication handling

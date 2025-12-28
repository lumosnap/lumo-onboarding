# LumoSnap Auth Client

A simple authentication client for Nuxt 4 using Better Auth, supporting both Google OAuth and email/password authentication with callback URL redirection.

## Overview

This is a client-side authentication implementation that:
- Provides Google OAuth sign-in
- Supports email/password sign-in and sign-up
- Redirects to a callback URL after successful authentication
- Sends bearer token and base64-encoded user data to the callback server

## Prerequisites

- Nuxt 4 application
- Better Auth server configured with bearer plugin
- Google OAuth credentials configured on the server
- Node.js and pnpm installed

## Setup

### 1. Configuration

Update `app/config/auth.config.ts` with your backend server URL:

```typescript
export const authClient = createAuthClient({
  baseURL: process.env.NUXT_PUBLIC_AUTH_BASE_URL || "http://localhost:3001",
})
```

### 2. Environment Variables (Optional)

Create a `.env` file in the project root:

```env
NUXT_PUBLIC_AUTH_BASE_URL=http://your-server-url
```

### 3. Update Nuxt Config

The `nuxt.config.ts` is already configured with:

```typescript
runtimeConfig: {
  public: {
    authBaseURL: process.env.NUXT_PUBLIC_AUTH_BASE_URL || 'http://localhost:3001'
  }
}
```

## Usage

### Opening the Auth Page

To initiate the authentication flow, open your app with a callback URL parameter:

```
http://localhost:3000/?callback=http%3A%2F%2Flocalhost%3A9876%2Fauth%2Fcallback
```

The callback URL will be URL-encoded in the query parameter.

### Authentication Flow

1. **User lands on auth page** with callback URL in query params
2. **User authenticates** via Google OAuth or email/password
3. **On successful auth**, the app:
   - Retrieves the session token from Better Auth
   - Base64-encodes the user JSON data
   - Redirects to the callback URL with parameters:
     ```
     {callback}?token={bearer_token}&user={base64_encoded_user_json}
     ```

### Callback URL Format

Your callback server should expect these query parameters:

- `token` - The bearer token from Better Auth
- `user` - Base64-encoded JSON string containing user data

Example decoded user object:
```json
{
  "id": "user_123",
  "email": "user@example.com",
  "name": "John Doe",
  "emailVerified": true,
  "createdAt": "2025-01-15T00:00:00.000Z",
  "updatedAt": "2025-01-15T00:00:00.000Z"
}
```

## Features

### Google OAuth
- One-click authentication using Google account
- Automatic redirect handling
- Seamless session management

### Email/Password Authentication
- Sign up with name, email, and password
- Sign in with email and password
- Automatic session creation

### Callback Integration
- Automatic detection of callback URL from query params
- Base64 encoding of user data for secure transmission
- Automatic redirect after successful authentication

### Session Management
- Reactive session state using Better Auth's `useSession()` hook
- Automatic session refresh
- Sign out functionality

## File Structure

```
lumo-auth/
├── app/
│   ├── app.vue              # Main auth UI component
│   └── config/
│       └── auth.config.ts   # Better Auth client configuration
├── nuxt.config.ts           # Nuxt configuration
├── package.json             # Dependencies
└── README.md               # This file
```

## Development

### Run the development server:

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`

## Testing the Callback Flow

1. Start your development server
2. Open: `http://localhost:3000/?callback=http%3A%2F%2Flocalhost%3A9876%2Fauth%2Fcallback`
3. Sign in using Google or email/password
4. After successful auth, you'll be redirected to: `http://localhost:9876/auth/callback?token=...&user=...`

## Troubleshooting

### Callback URL not working
- Ensure the callback URL is properly URL-encoded in the query parameter
- Check that your callback server is running and accessible
- Verify the callback URL doesn't contain invalid characters

### Session not redirecting
- Check browser console for errors
- Verify Better Auth server is running and accessible
- Ensure the session token is being generated correctly

### Base64 decoding issues
- The user data is URL-safe base64 encoded
- Use proper base64 decoding that handles URL-safe characters
- Replace `-` with `+` and `_` with `/` if needed, then add padding `=`

## Dependencies

- `better-auth`: ^1.4.9
- `nuxt`: ^4.2.2
- `vue`: ^3.5.26

## Notes

- This is a client-only implementation - all auth logic is handled by your Better Auth server
- The session display card is only shown when no callback URL is present (useful for debugging)
- Loading states are handled for better UX
- Error messages are displayed for failed authentication attempts
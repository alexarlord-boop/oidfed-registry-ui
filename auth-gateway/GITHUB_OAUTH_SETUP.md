# GitHub OAuth Setup Guide

This guide explains how to configure GitHub OAuth authentication for the OIDFED Registry UI.

## Prerequisites

- A GitHub account
- Admin access to create OAuth applications

## Step 1: Create a GitHub OAuth Application

1. Go to GitHub Settings: https://github.com/settings/developers
2. Click on "OAuth Apps" in the left sidebar
3. Click "New OAuth App" button
4. Fill in the application details:
   - **Application name**: `OIDFED Registry UI (Dev)`
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:9000/auth/oidc/github/callback`
   - **Application description**: (optional) `OAuth integration for OIDFED Registry UI`
5. Click "Register application"

## Step 2: Get Your Client Credentials

After creating the app, you'll see:
- **Client ID**: A public identifier (looks like `Iv1.a1b2c3d4e5f6g7h8`)
- **Client Secret**: Click "Generate a new client secret" to create one

⚠️ **Important**: Copy the client secret immediately - you won't be able to see it again!

## Step 3: Configure the Auth Gateway

Edit the `.env` file in the `auth-gateway/` directory:

```bash
# GitHub OAuth Configuration
GITHUB_ENABLED=true
GITHUB_CLIENT_ID=your-github-client-id-here
GITHUB_CLIENT_SECRET=your-github-client-secret-here
GITHUB_REDIRECT_URI=http://localhost:9000/auth/oidc/github/callback
```

Replace:
- `your-github-client-id-here` with your actual Client ID
- `your-github-client-secret-here` with your actual Client Secret

## Step 4: Restart the Auth Gateway

If the auth gateway is running in Docker:

```bash
cd auth-gateway
docker-compose down
docker-compose up -d
```

If running directly:

```bash
cd auth-gateway
# Stop the existing process (Ctrl+C)
# Then restart
python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 9000
```

## Step 5: Test the OAuth Flow

1. Open your browser to: http://localhost:3000
2. Click "Sign in with GitHub"
3. You should be redirected to GitHub's authorization page
4. Authorize the application
5. You'll be redirected back to the app and logged in

## OAuth Flow Details

The GitHub OAuth flow works as follows:

1. **Authorization Request**: Frontend redirects to `/auth/oidc/github/authorize` with PKCE parameters
2. **Redirect to GitHub**: Auth gateway redirects to GitHub's OAuth authorization page
3. **User Authorization**: User logs in and authorizes the app on GitHub
4. **Callback**: GitHub redirects to `/auth/oidc/github/callback` with authorization code
5. **Token Exchange**: Auth gateway exchanges the code for an access token
6. **User Info**: Auth gateway fetches user profile and email from GitHub API
7. **User Creation/Update**: Creates new user or links GitHub account to existing user
8. **JWT Issuance**: Issues our own JWT tokens (access + refresh + id tokens)
9. **Frontend Redirect**: Redirects to frontend with tokens in URL fragment

## Scopes Requested

The GitHub integration requests the following scopes:
- `read:user` - Read user profile information
- `user:email` - Read user email addresses (including private emails)

## User Account Creation

When a user signs in with GitHub for the first time:

- **Username**: Set to GitHub login (with random suffix if taken)
- **Email**: Primary verified email from GitHub
- **Full Name**: GitHub display name (or login if not set)
- **Organization**: GitHub company field (if set)
- **Role**: `PENDING` (requires admin approval)
- **Status**: Active but not approved

## Production Deployment

For production:

1. Create a new OAuth app with production URLs:
   - Homepage URL: `https://your-domain.com`
   - Callback URL: `https://your-auth-gateway.com/auth/oidc/github/callback`

2. Update environment variables:
   ```bash
   GITHUB_ENABLED=true
   GITHUB_CLIENT_ID=production-client-id
   GITHUB_CLIENT_SECRET=production-client-secret
   GITHUB_REDIRECT_URI=https://your-auth-gateway.com/auth/oidc/github/callback
   ```

3. Ensure HTTPS is enabled for all URLs

## Troubleshooting

### Error: "GitHub OAuth provider not configured"

- Check that `GITHUB_ENABLED=true` in `.env`
- Verify `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are set
- Restart the auth gateway after changing `.env`

### Error: "Unable to retrieve email from GitHub"

- User's primary email may not be verified on GitHub
- Ask user to verify their email at https://github.com/settings/emails
- Alternatively, user needs to make their email public in GitHub settings

### Error: "Token exchange failed"

- Verify the callback URL matches exactly in GitHub OAuth app settings
- Check that client ID and secret are correct
- Look at auth gateway logs for detailed error messages

### Users redirected to wrong URL after login

- Check `FRONTEND_REDIRECT_URI` in auth gateway `.env`
- Verify frontend is running on the expected port

## Security Notes

- Client secrets should never be committed to version control
- Use environment variables for all sensitive configuration
- In production, enable HTTPS for all OAuth endpoints
- Regularly rotate client secrets
- Monitor OAuth application access logs on GitHub

## API Endpoints

GitHub OAuth adds these endpoints to the auth gateway:

- `GET /auth/oidc/github/authorize` - Start GitHub OAuth flow
- `GET /auth/oidc/github/callback` - Handle GitHub OAuth callback

Both integrate seamlessly with the existing OIDC-style authentication flow.

# Google Authentication Setup Guide

## ✅ What's Already Done

I've implemented the Google sign-in functionality in your app:

1. **Login Page**: Google button now functional with `handleGoogleSignIn()`
2. **Signup Page**: Google button now functional with `handleGoogleSignIn()`
3. **OAuth Flow**: Configured to redirect to `/userdashboard` after successful authentication
4. **Error Handling**: Proper error messages for failed Google authentication

## 🔧 What You Need to Do in Supabase

### 1. Configure Google OAuth Provider

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **Providers**
4. Find **Google** and click **Configure**

### 2. Get Google OAuth Credentials

You need to create a Google OAuth application:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
5. Set **Application type** to "Web application"
6. Add **Authorized redirect URIs**:
   - `https://your-project-ref.supabase.co/auth/v1/callback`
   - For development: `http://localhost:3000/auth/callback`

### 3. Configure Supabase with Google Credentials

In your Supabase Google provider settings:

1. **Client ID**: Paste your Google OAuth Client ID
2. **Client Secret**: Paste your Google OAuth Client Secret
3. **Redirect URL**: Should be automatically set to your Supabase callback URL

### 4. Update Site URL (Important!)

In Supabase Dashboard:
1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to your domain (e.g., `https://yourdomain.com`)
3. Add **Redirect URLs**:
   - `https://yourdomain.com/userdashboard`
   - `http://localhost:3000/userdashboard` (for development)

## 🚀 How It Works

### User Flow:
1. User clicks "Google" button on login/signup page
2. Redirected to Google OAuth consent screen
3. User grants permissions
4. Google redirects back to Supabase
5. Supabase processes the authentication
6. User is redirected to `/userdashboard`

### Code Implementation:
```typescript
const handleGoogleSignIn = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/userdashboard`
    }
  })
}
```

## 🧪 Testing

### Development Testing:
1. Make sure your local development server is running
2. Click the Google button on login/signup page
3. Complete Google OAuth flow
4. Should redirect to dashboard

### Production Testing:
1. Deploy your app
2. Update Supabase Site URL to your production domain
3. Test Google authentication flow

## 🔍 Troubleshooting

### Common Issues:

1. **"Invalid redirect URI"**
   - Check that your Google OAuth redirect URI matches Supabase callback URL
   - Format: `https://your-project-ref.supabase.co/auth/v1/callback`

2. **"Site URL mismatch"**
   - Update Site URL in Supabase to match your domain
   - Add your domain to Redirect URLs

3. **"Google sign-in failed"**
   - Check Google OAuth credentials are correct
   - Verify Google+ API is enabled
   - Check browser console for detailed error messages

### Debug Steps:
1. Check browser console for errors
2. Verify Supabase logs in dashboard
3. Test with different browsers
4. Check network tab for failed requests

## 📱 User Experience

- **New Users**: Can sign up with Google (creates account automatically)
- **Existing Users**: Can log in with Google (if email matches)
- **Seamless**: No additional forms needed
- **Secure**: OAuth 2.0 standard authentication

## 🎯 Next Steps

1. Complete the Supabase configuration
2. Test the authentication flow
3. Deploy and test in production
4. Consider adding more OAuth providers (GitHub, etc.)

Your Google authentication is now fully implemented and ready to use!

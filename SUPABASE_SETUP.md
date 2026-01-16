# Supabase Email Verification Setup

## Issue: Email Verification Required for Login

If you're getting "Email not confirmed" errors even though you've verified your email, here are the solutions:

## Solution 1: Disable Email Confirmation (Recommended for Development)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** → **Settings**
4. Scroll down to **User Signups** section
5. **Disable** "Enable email confirmations"
6. Click **Save**

## Solution 2: Check Email Verification Status

1. In Supabase Dashboard, go to **Authentication** → **Users**
2. Find your user account
3. Check if `email_confirmed_at` field has a timestamp
4. If it's null, the email is not confirmed

## Solution 3: Manual Email Confirmation (If needed)

If you need to manually confirm an email:

1. Go to **Authentication** → **Users**
2. Find your user
3. Click the **Edit** button
4. Set `email_confirmed_at` to current timestamp
5. Save changes

## Solution 4: Use the Resend Verification Feature

The login page now includes a "Resend Verification Email" button that appears when email confirmation is required.

## Testing the Fix

After disabling email confirmation:
1. Try logging in again
2. Check browser console for debug logs
3. The login should work immediately

## Production Considerations

For production, you should:
- Keep email confirmation enabled
- Set up proper email templates
- Configure your domain for email sending
- Test the verification flow thoroughly

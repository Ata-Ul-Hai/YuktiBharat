# Chat Messages Database Setup

## Overview

The YUKTI chat system stores all conversations in Supabase with the following information:
- **User ID** - Links to the authenticated user
- **Email** - User's email address
- **Full Name** - User's display name
- **Thread ID** - Groups messages in conversations
- **Role** - Either 'user' or 'assistant'
- **Content** - The actual message text
- **Timestamps** - When messages were created/updated

## Database Setup

### 1. Create the Table

Run the SQL script `supabase_chat_messages_table.sql` in your Supabase SQL Editor:

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor**
4. Copy and paste the contents of `supabase_chat_messages_table.sql`
5. Click **Run**

### 2. Verify Table Creation

After running the SQL, verify the table was created:

1. Go to **Table Editor** in your Supabase Dashboard
2. You should see a `chat_messages` table
3. Check that it has the following columns:
   - `id` (UUID, Primary Key)
   - `thread_id` (Text)
   - `user_id` (UUID, Foreign Key to auth.users)
   - `email` (Text)
   - `full_name` (Text, nullable)
   - `role` (Text, constrained to 'user' or 'assistant')
   - `content` (Text)
   - `created_at` (Timestamp)
   - `updated_at` (Timestamp)

### 3. Test the Setup

1. **Login to your app** with a user account
2. **Start a chat** with YUKTI
3. **Send a message** (text or voice)
4. **Check Supabase** - Go to Table Editor → chat_messages
5. **Verify data** - You should see your message stored with:
   - Your user ID
   - Your email
   - Your full name
   - The message content
   - Proper timestamps

## Features

### ✅ What's Already Working

- **Automatic Storage** - All chat messages are automatically saved
- **User Linking** - Messages are linked to user accounts
- **Thread Management** - Messages are grouped by conversation threads
- **Chat History** - Previous conversations are loaded in the popup
- **Real-time Updates** - New messages appear in chat history immediately

### 🔒 Security Features

- **Row Level Security (RLS)** - Users can only see their own messages
- **Authentication Required** - Only logged-in users can chat
- **Data Isolation** - Each user's chat history is private

### 📊 Data Structure

```sql
-- Example of stored data:
{
  "id": "uuid-here",
  "thread_id": "thread-12345",
  "user_id": "user-uuid-here",
  "email": "user@example.com",
  "full_name": "John Doe",
  "role": "user",
  "content": "What are the best career options in AI?",
  "created_at": "2024-12-16T10:30:00Z",
  "updated_at": "2024-12-16T10:30:00Z"
}
```

## Troubleshooting

### Common Issues

1. **"Table doesn't exist" error**
   - Run the SQL script in Supabase SQL Editor
   - Check that the table was created successfully

2. **"Permission denied" error**
   - Ensure RLS policies are properly set up
   - Check that the user is authenticated

3. **Messages not saving**
   - Check browser console for errors
   - Verify Supabase connection
   - Ensure user is logged in

4. **Chat history not loading**
   - Check that messages exist in the database
   - Verify the user_id matches the authenticated user
   - Check browser console for fetch errors

### Debug Steps

1. **Check Supabase Logs**
   - Go to Supabase Dashboard → Logs
   - Look for any database errors

2. **Check Browser Console**
   - Open Developer Tools
   - Look for JavaScript errors
   - Check Network tab for failed requests

3. **Verify Authentication**
   - Ensure user is properly logged in
   - Check that `currentUser` is not null

## API Endpoints

The chat system uses these Supabase operations:

- **INSERT** - Save new messages
- **SELECT** - Load chat history
- **Real-time** - Automatic updates (if enabled)

## Performance

- **Indexed queries** - Fast retrieval by user_id and thread_id
- **Efficient storage** - Only essential data is stored
- **Automatic cleanup** - Old messages can be archived if needed

## Future Enhancements

Potential improvements:
- Message search functionality
- Export chat history
- Message reactions/ratings
- Conversation analytics
- Message encryption
- File attachments

# Supabase Integration

## Setup Instructions

This application uses Supabase for data persistence. Follow these steps to set up your environment:

1. Create a `.env.local` file in the root of your project with the following content:

```
NEXT_PUBLIC_SUPABASE_URL=https://gbkfhnbfbcfsltdlzclx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdia2ZobmJmYmNmc2x0ZGx6Y2x4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwNjU5MTEsImV4cCI6MjA2MjY0MTkxMX0.SvO2hPsJdGqQC-iEI61-FcRc5hQlG_9zNNenEwSagzo
```

2. Execute the SQL in `supabase-setup.sql` in your Supabase dashboard to create the required tables and security policies:
   - Go to the Supabase dashboard
   - Navigate to the SQL Editor
   - Copy and paste the contents of `supabase-setup.sql`
   - Run the SQL script

> **Note:** The setup script includes logic to drop existing policies before creating new ones, so it's safe to run multiple times. If you encounter errors about existing objects, make sure you're running the latest version of the setup script.

## Database Structure

The application uses two main tables:

### profiles
- `id` - UUID converted from the Firebase Auth UID
- `name` - User's display name
- `email` - User's email address
- `avatar_url` - URL to user's avatar image
- `background_image_url` - URL to user's profile background image
- `bio` - User's biography text
- `time_available` - User's available time (text format)
- `time_balance` - User's time balance (in minutes)

### skills
- `id` - Unique identifier for the skill (UUID)
- `profile_id` - Reference to the profile this skill belongs to (UUID)
- `name` - Name of the skill
- `type` - Either 'offered' or 'wanted'

## Firebase UID to UUID Conversion

Since Supabase uses UUIDs and Firebase uses string UIDs, the application includes a conversion function that:
1. Checks if the Firebase UID is already in UUID format
2. If not, generates a deterministic UUID based on the Firebase UID
3. This ensures the same Firebase UID always maps to the same Supabase UUID

## Security

Row Level Security is enabled on both tables with policies that:
- Allow anyone to read all profiles and skills
- Restrict users to only update or insert their own profile
- Restrict users to only insert, update, or delete skills linked to their own profile

## Troubleshooting

If you encounter issues with the Supabase integration:

1. Check that your `.env.local` file contains the correct credentials
2. Ensure the tables and policies were created successfully
3. Look for errors in the browser console
4. The app will fall back to local state if it cannot connect to Supabase

### Common Errors

- **UUID conversion errors**: If you see errors about incompatible types between UUID and VARCHAR, make sure you're using the updated schema that uses UUID types for IDs.
- **RLS policy errors**: Supabase requires authenticated users to match their user ID with the profile ID. The convertToUUID function helps manage this mapping.
- **Policy already exists errors**: If you see errors like "policy X already exists," it means you're trying to create a policy that's already defined. The updated setup script handles this by dropping existing policies first.
- **Table doesn't exist**: If you see errors about missing tables, make sure the tables are created before the policies are applied. 
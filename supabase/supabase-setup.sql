-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    avatar_url TEXT,
    background_image_url TEXT,
    bio TEXT,
    time_available TEXT,
    time_balance INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create skills table
CREATE TABLE IF NOT EXISTS skills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('offered', 'wanted')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
BEGIN
    -- Drop profiles policies
    BEGIN
        DROP POLICY IF EXISTS "Users can read any profile" ON profiles;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Policy does not exist';
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Policy does not exist';
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Policy does not exist';
    END;
    
    -- Drop skills policies
    BEGIN
        DROP POLICY IF EXISTS "Users can read any skills" ON skills;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Policy does not exist';
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Users can insert own skills" ON skills;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Policy does not exist';
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Users can update own skills" ON skills;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Policy does not exist';
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Users can delete own skills" ON skills;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Policy does not exist';
    END;
END;
$$;

-- Create policies for profiles table
CREATE POLICY "Users can read any profile"
ON profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Create policies for skills table
CREATE POLICY "Users can read any skills"
ON skills FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert own skills"
ON skills FOR INSERT
TO authenticated
WITH CHECK (
    profile_id IN (
        SELECT id FROM profiles 
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can update own skills"
ON skills FOR UPDATE
TO authenticated
USING (
    profile_id IN (
        SELECT id FROM profiles 
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can delete own skills"
ON skills FOR DELETE
TO authenticated
USING (
    profile_id IN (
        SELECT id FROM profiles 
        WHERE id = auth.uid()
    )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS skills_profile_id_idx ON skills(profile_id); 
-- Create profiles table
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    name TEXT NOT NULL,
    bio TEXT,
    background_image_url TEXT,
    time_available TEXT,
    email TEXT,
    time_balance INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create skills table
CREATE TABLE skills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('offered', 'wanted')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

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
CREATE INDEX skills_profile_id_idx ON skills(profile_id);
CREATE INDEX skills_type_idx ON skills(type); 
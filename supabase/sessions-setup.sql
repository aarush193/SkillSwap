-- Create sessions table for SkillSwap
CREATE TABLE IF NOT EXISTS sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exchange_id UUID NOT NULL REFERENCES exchanges(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    learner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    meeting_link TEXT CHECK (meeting_link IS NULL OR meeting_link ~* '^https?://'),
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_exchange_session UNIQUE (exchange_id)
);

-- Enable Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DO $$
BEGIN
    BEGIN
        DROP POLICY IF EXISTS "Participants can view their sessions" ON sessions;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
        DROP POLICY IF EXISTS "Participants can create sessions for accepted exchanges" ON sessions;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
        DROP POLICY IF EXISTS "Participants can update their sessions" ON sessions;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
END;
$$;

-- RLS Policy: Participants can view their sessions
CREATE POLICY "Participants can view their sessions"
ON sessions FOR SELECT
TO authenticated
USING (
    auth.uid() = teacher_id OR auth.uid() = learner_id
);

-- RLS Policy: Participants can insert sessions for accepted exchanges they belong to
CREATE POLICY "Participants can create sessions for accepted exchanges"
ON sessions FOR INSERT
TO authenticated
WITH CHECK (
    (auth.uid() = teacher_id OR auth.uid() = learner_id)
    AND EXISTS (
        SELECT 1 FROM exchanges e
        WHERE e.id = exchange_id
        AND e.status = 'accepted'
        AND (e.requester_id = auth.uid() OR e.provider_id = auth.uid())
    )
);

-- RLS Policy: Participants can update their sessions
CREATE POLICY "Participants can update their sessions"
ON sessions FOR UPDATE
TO authenticated
USING (
    auth.uid() = teacher_id OR auth.uid() = learner_id
);

-- Trigger for auto-updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_sessions_updated_at ON sessions;
CREATE TRIGGER trigger_update_sessions_updated_at
BEFORE UPDATE ON sessions
FOR EACH ROW
EXECUTE FUNCTION update_sessions_updated_at();

-- Trigger for validating future date & time on scheduled sessions in session's stored timezone
CREATE OR REPLACE FUNCTION validate_session_future_time()
RETURNS TRIGGER AS $$
BEGIN
    -- Only validate when creating or updating a scheduled session
    IF NEW.status = 'scheduled' AND (NEW.scheduled_date + NEW.scheduled_time) <= (NOW() AT TIME ZONE COALESCE(NEW.timezone, 'Asia/Kolkata')) THEN
        RAISE EXCEPTION 'Sessions cannot be scheduled or rescheduled in the past.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_session_future_time ON sessions;
CREATE TRIGGER trigger_validate_session_future_time
BEFORE INSERT OR UPDATE ON sessions
FOR EACH ROW
EXECUTE FUNCTION validate_session_future_time();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_exchange_id ON sessions(exchange_id);
CREATE INDEX IF NOT EXISTS idx_sessions_teacher_id ON sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_sessions_learner_id ON sessions(learner_id);

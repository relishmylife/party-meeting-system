CREATE TABLE meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_type VARCHAR(50) NOT NULL CHECK (meeting_type IN ('committee',
    'assembly',
    'group_meeting',
    'lecture')),
    title VARCHAR(255) NOT NULL,
    content TEXT,
    organizer_id UUID NOT NULL,
    planned_date TIMESTAMP NOT NULL,
    location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'planned' CHECK (status IN ('planned',
    'in_progress',
    'completed',
    'cancelled')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
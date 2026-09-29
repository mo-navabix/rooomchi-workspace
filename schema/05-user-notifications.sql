-- In-app notifications per user (bell + dashboard)

CREATE TABLE IF NOT EXISTS user_in_app_notifications (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id VARCHAR(64) REFERENCES organizations(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(32) NOT NULL DEFAULT 'system',
    booking_id VARCHAR(64),
    room_name VARCHAR(255),
    booking_date DATE,
    start_time VARCHAR(16),
    end_time VARCHAR(16),
    organizer_name VARCHAR(128),
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_in_app_notif_user
    ON user_in_app_notifications(user_id, created_at DESC);

-- Media Storage Table
-- Supports storing images and videos up to 64MB
CREATE TABLE media_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK(file_type IN ('image', 'video')),
    file_data BLOB NOT NULL,
    file_size INTEGER NOT NULL CHECK(file_size <= 67108864), -- 64MB in bytes
    upload_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    mime_type TEXT NOT NULL,
    description TEXT,
    user_id INTEGER,  -- Optional: link to user who uploaded
    is_public BOOLEAN DEFAULT 0
);

-- Index for faster queries
CREATE INDEX idx_media_type ON media_files(file_type);
CREATE INDEX idx_upload_timestamp ON media_files(upload_timestamp); 
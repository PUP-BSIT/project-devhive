-- User Profile Table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,  -- Hashed password for security
    salt TEXT NOT NULL,  -- Salt for password hashing
    
    -- Profile Details
    full_name TEXT,
    profile_image_id INTEGER,  -- Reference to media_files table
    bio TEXT,
    
    -- Account Management
    is_active BOOLEAN DEFAULT 1,
    registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    
    -- Additional Profile Information
    date_of_birth DATE,
    location TEXT,
    
    FOREIGN KEY (profile_image_id) REFERENCES media_files(id)
);

-- Indexes for performance
CREATE INDEX idx_username ON users(username);
CREATE INDEX idx_email ON users(email);
CREATE INDEX idx_last_login ON users(last_login);

-- User Roles or Permissions Table (Optional)
CREATE TABLE user_roles (
    user_id INTEGER,
    role TEXT NOT NULL CHECK(role IN ('user', 'admin', 'moderator')),
    PRIMARY KEY (user_id, role),
    FOREIGN KEY (user_id) REFERENCES users(id)
); 
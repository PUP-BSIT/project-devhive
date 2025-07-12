import sqlite3
import hashlib
import os
from datetime import datetime

class UserManager:
    def __init__(self, db_path='users.db'):
        self.conn = sqlite3.connect(db_path)
        self.create_tables()

    def create_tables(self):
        cursor = self.conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                salt TEXT NOT NULL,
                full_name TEXT,
                profile_image_id INTEGER,
                bio TEXT,
                is_active BOOLEAN DEFAULT 1,
                registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_login DATETIME,
                date_of_birth DATE,
                location TEXT
            )
        ''')
        self.conn.commit()

    def _hash_password(self, password, salt=None):
        if salt is None:
            salt = os.urandom(32)  # 32 bytes = 256 bits
        
        # Use PBKDF2 with SHA256
        pwdhash = hashlib.pbkdf2_hmac('sha256', 
                                      password.encode('utf-8'), 
                                      salt, 
                                      100000)
        return salt, pwdhash

    def register_user(self, username, email, password, full_name=None, bio=None):
        # Generate salt and hash the password
        salt, password_hash = self._hash_password(password)
        
        try:
            cursor = self.conn.cursor()
            cursor.execute('''
                INSERT INTO users 
                (username, email, password_hash, salt, full_name, bio) 
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (username, email, password_hash, salt, full_name, bio))
            self.conn.commit()
            return cursor.lastrowid
        except sqlite3.IntegrityError:
            return None  # Username or email already exists

    def login(self, username, password):
        cursor = self.conn.cursor()
        cursor.execute('SELECT password_hash, salt FROM users WHERE username = ?', (username,))
        user = cursor.fetchone()
        
        if not user:
            return False
        
        # Verify password
        _, stored_hash = self._hash_password(password, user[1])
        
        if stored_hash == user[0]:
            # Update last login
            cursor.execute('UPDATE users SET last_login = ? WHERE username = ?', 
                           (datetime.now(), username))
            self.conn.commit()
            return True
        return False

    def get_user_profile(self, username):
        cursor = self.conn.cursor()
        cursor.execute('''
            SELECT username, email, full_name, bio, 
                   profile_image_id, registration_date, last_login 
            FROM users 
            WHERE username = ?
        ''', (username,))
        return cursor.fetchone()

    def update_profile(self, username, full_name=None, bio=None, 
                       profile_image_id=None, location=None):
        cursor = self.conn.cursor()
        update_fields = []
        params = []
        
        if full_name is not None:
            update_fields.append('full_name = ?')
            params.append(full_name)
        if bio is not None:
            update_fields.append('bio = ?')
            params.append(bio)
        if profile_image_id is not None:
            update_fields.append('profile_image_id = ?')
            params.append(profile_image_id)
        if location is not None:
            update_fields.append('location = ?')
            params.append(location)
        
        if not update_fields:
            return False
        
        params.append(username)
        query = f'UPDATE users SET {", ".join(update_fields)} WHERE username = ?'
        
        cursor.execute(query, params)
        self.conn.commit()
        return cursor.rowcount > 0

    def close(self):
        self.conn.close()

# Example usage
if __name__ == '__main__':
    user_manager = UserManager()
    
    # Register a new user
    user_id = user_manager.register_user(
        username='johndoe', 
        email='john@example.com', 
        password='securepassword123',
        full_name='John Doe',
        bio='Software developer'
    )
    
    # Login
    if user_manager.login('johndoe', 'securepassword123'):
        print("Login successful!")
        
        # Get profile
        profile = user_manager.get_user_profile('johndoe')
        print("User Profile:", profile)
        
        # Update profile
        user_manager.update_profile(
            username='johndoe', 
            bio='Full-stack developer', 
            location='New York'
        )
    
    user_manager.close() 
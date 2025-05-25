# Database Setup for Team Development

## Initial Setup (Do this once)

## 1. Start XAMPP

• Start Apache and MySQL in XAMPP Control Panel

## 2. Create Local Database

• Open phpMyAdmin: http://localhost/phpmyadmin
• Go to "Import" tab
• Select database/devhivespace.sql from this project
• Click "Go" to create database structure

## 3. Add Sample Data

• Still in phpMyAdmin, go to "Import" tab again
• Select database/sample_data.sql from this project
• Click "Go" to add test data

# When Database Structure Changes

# If YOU made the changes:

## 1. Export your local database structure:

• phpMyAdmin → Export → Structure only → Go
• Save as database/devhivespace.sql (replace existing)
• Export sample data if needed
• Commit and push to GitHub

# If SOMEONE ELSE made changes:

## 1. Pull latest changes from GitHub

## 2. In phpMyAdmin:

• Drop your local database (if major changes)
• Import the new database/devhivespace.sql
• Import database/sample_data.sql

# Testing Login Credentials

• Username: testuser1, Password: password123
• Username: testuser2, Password: password123
• Or create your own test accounts

# Live Database (Hostinger)

• Only update live database when feature is complete and tested
• NEVER test directly on live database
• Always test locally first

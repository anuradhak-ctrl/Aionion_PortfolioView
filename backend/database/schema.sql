-- PortfolioView Database Schema
-- MySQL/MariaDB Version

-- Create database
CREATE DATABASE IF NOT EXISTS portfolioview;
USE portfolioview;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL COMMENT 'bcrypt hashed password',
    name VARCHAR(255) NOT NULL,
    role ENUM('rm', 'client', 'branch_manager', 'zonal_head', 'super_admin', 'director') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL,
    
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Activity logs table (optional but recommended)
CREATE TABLE IF NOT EXISTS activity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    details JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sessions table (for token blacklist - optional)
CREATE TABLE IF NOT EXISTS sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token_hash),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample data (DELETE THIS SECTION IN PRODUCTION)
-- Password for all demo users: demo123
-- Hash: $2b$10$rKvFNQZ8fGWYGN0FqvqPZO6HMQqGqxB5L0qH7kH7kH7kH7kH7kH7kO

-- Uncomment to create demo users:
/*
INSERT INTO users (email, password, name, role) VALUES 
('admin@example.com', '$2b$10$K8q3rH7kH7kH7kH7kH7kH7O2', 'Super Admin', 'super_admin'),
('director@example.com', '$2b$10$K8q3rH7kH7kH7kH7kH7kH7O2', 'Michael Chen', 'director'),
('zh@example.com', '$2b$10$K8q3rH7kH7kH7kH7kH7kH7O2', 'Sarah Williams', 'zonal_head'),
('bm@example.com', '$2b$10$K8q3rH7kH7kH7kH7kH7kH7O2', 'Robert Johnson', 'branch_manager'),
('rm@example.com', '$2b$10$K8q3rH7kH7kH7kH7kH7kH7O2', 'John Doe', 'rm'),
('client@example.com', '$2b$10$K8q3rH7kH7kH7kH7kH7kH7O2', 'Jane Smith', 'client');
*/

-- Display created tables
SHOW TABLES;

-- Verify users table structure
DESCRIBE users;

SELECT 'Database setup complete!' AS status;

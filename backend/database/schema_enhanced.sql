-- ==================================================================================
-- PortfolioView Enhanced Database Schema
-- PostgreSQL Version (Aurora Serverless v2)
-- For Role Mapping and Hierarchical Access Control
-- ==================================================================================

-- ==================== ENUMS ====================

-- User roles with clear hierarchy
CREATE TYPE user_role AS ENUM (
    'client',           -- Regular trading client
    'rm',               -- Relationship Manager
    'branch_manager',   -- Branch Manager (manages RMs)
    'zonal_head',       -- Zonal Head (manages Branch Managers)
    'super_admin'       -- Super Admin (full access)
);

-- User status
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'pending', 'suspended');

-- ==================== ZONES TABLE ====================
-- Master table for zones/regions

CREATE TABLE IF NOT EXISTS zones (
    id SERIAL PRIMARY KEY,
    zone_code VARCHAR(20) UNIQUE NOT NULL,
    zone_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zones_code ON zones(zone_code);
CREATE INDEX IF NOT EXISTS idx_zones_active ON zones(is_active);

-- ==================== BRANCHES TABLE ====================
-- Master table for branches (belongs to a zone)

CREATE TABLE IF NOT EXISTS branches (
    id SERIAL PRIMARY KEY,
    branch_code VARCHAR(20) UNIQUE NOT NULL,
    branch_name VARCHAR(100) NOT NULL,
    zone_id INT REFERENCES zones(id) ON DELETE SET NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_branches_code ON branches(branch_code);
CREATE INDEX IF NOT EXISTS idx_branches_zone_id ON branches(zone_id);
CREATE INDEX IF NOT EXISTS idx_branches_active ON branches(is_active);

-- ==================== USERS TABLE ====================
-- Main users table with role and hierarchy info

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    
    -- Identity (linked to Cognito)
    client_id VARCHAR(50) UNIQUE NOT NULL,  -- Cognito username/sub
    cognito_sub VARCHAR(100) UNIQUE,        -- Cognito sub (UUID)
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    
    -- Role & Status
    role user_role NOT NULL DEFAULT 'client',
    status user_status DEFAULT 'active',
    user_type VARCHAR(20) NOT NULL DEFAULT 'client' CHECK (user_type IN ('client', 'internal')),
    
    -- Hierarchy - Direct parent reference
    parent_id INT REFERENCES users(id) ON DELETE SET NULL,
    
    -- Hierarchy - Materialized path for fast ancestor/descendant queries
    -- Format: "/1/5/12/45/" where numbers are user IDs
    hierarchy_path TEXT DEFAULT '/',
    hierarchy_level INT DEFAULT 0,  -- 0=root, 1=zone head, 2=branch manager, 3=rm, 4=client
    
    -- Location mapping
    branch_id INT REFERENCES branches(id) ON DELETE SET NULL,
    zone_id INT REFERENCES zones(id) ON DELETE SET NULL,
    
    -- Metadata
    employee_code VARCHAR(50),      -- For internal staff
    client_code VARCHAR(50),       -- For clients (same as client_id for clients)
    pan_number VARCHAR(20),
    
    -- MFA & Security
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_verified BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT valid_hierarchy CHECK (
        (role = 'super_admin' AND parent_id IS NULL) OR
        (role != 'super_admin')
    )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_client_id ON users(client_id);
CREATE INDEX IF NOT EXISTS idx_users_cognito_sub ON users(cognito_sub);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_parent_id ON users(parent_id);
CREATE INDEX IF NOT EXISTS idx_users_branch_id ON users(branch_id);
CREATE INDEX IF NOT EXISTS idx_users_zone_id ON users(zone_id);
CREATE INDEX IF NOT EXISTS idx_users_hierarchy_path ON users USING gin(hierarchy_path gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_hierarchy_level ON users(hierarchy_level);
CREATE INDEX IF NOT EXISTS idx_users_client_code ON users(client_code);

-- ==================== USER ASSIGNMENTS TABLE ====================
-- For many-to-many relationships (e.g., RM manages multiple clients)
-- This provides flexibility beyond the single parent_id

CREATE TABLE IF NOT EXISTS user_assignments (
    id SERIAL PRIMARY KEY,
    manager_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subordinate_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) DEFAULT 'primary',  -- primary, secondary, temporary
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by INT REFERENCES users(id),
    valid_from DATE DEFAULT CURRENT_DATE,
    valid_until DATE,  -- NULL means indefinite
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    
    -- Prevent duplicate active assignments of same type
    CONSTRAINT unique_active_assignment 
        UNIQUE (manager_id, subordinate_id, relationship_type, is_active)
);

CREATE INDEX IF NOT EXISTS idx_assignments_manager ON user_assignments(manager_id);
CREATE INDEX IF NOT EXISTS idx_assignments_subordinate ON user_assignments(subordinate_id);
CREATE INDEX IF NOT EXISTS idx_assignments_active ON user_assignments(is_active);
CREATE INDEX IF NOT EXISTS idx_assignments_type ON user_assignments(relationship_type);

-- ==================== ROLE PERMISSIONS TABLE ====================
-- Define what each role can do

CREATE TABLE IF NOT EXISTS role_permissions (
    id SERIAL PRIMARY KEY,
    role user_role NOT NULL,
    permission_name VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,  -- e.g., 'users', 'reports', 'portfolio'
    can_create BOOLEAN DEFAULT FALSE,
    can_read BOOLEAN DEFAULT FALSE,
    can_update BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    scope VARCHAR(50) DEFAULT 'own',  -- 'own', 'subordinates', 'branch', 'zone', 'all'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_role_permission UNIQUE (role, permission_name, resource)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);

-- ==================== ACCESS SCOPE TABLE ====================
-- Defines which users can access which other users' data

CREATE TABLE IF NOT EXISTS access_scope (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    can_access_user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    access_level VARCHAR(50) DEFAULT 'read',  -- 'read', 'write', 'full'
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    granted_by INT REFERENCES users(id),
    reason TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT unique_access_scope UNIQUE (user_id, can_access_user_id)
);

CREATE INDEX IF NOT EXISTS idx_access_scope_user ON access_scope(user_id);
CREATE INDEX IF NOT EXISTS idx_access_scope_target ON access_scope(can_access_user_id);

-- ==================== ACTIVITY LOGS TABLE ====================

CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100),
    resource_id VARCHAR(100),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);

-- ==================== FUNCTIONS ====================

-- Function: Update hierarchy path when parent changes
CREATE OR REPLACE FUNCTION update_hierarchy_path()
RETURNS TRIGGER AS $$
DECLARE
    parent_path TEXT;
    parent_level INT;
BEGIN
    IF NEW.parent_id IS NULL THEN
        NEW.hierarchy_path := '/' || NEW.id || '/';
        NEW.hierarchy_level := 0;
    ELSE
        SELECT hierarchy_path, hierarchy_level 
        INTO parent_path, parent_level 
        FROM users WHERE id = NEW.parent_id;
        
        NEW.hierarchy_path := parent_path || NEW.id || '/';
        NEW.hierarchy_level := COALESCE(parent_level, 0) + 1;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Get all subordinates of a user (recursive)
CREATE OR REPLACE FUNCTION get_all_subordinates(manager_user_id INT)
RETURNS TABLE(user_id INT, name VARCHAR, role user_role, level INT) AS $$
DECLARE
    manager_path TEXT;
BEGIN
    SELECT hierarchy_path INTO manager_path FROM users WHERE id = manager_user_id;
    
    RETURN QUERY
    SELECT u.id, u.name, u.role, u.hierarchy_level
    FROM users u
    WHERE u.hierarchy_path LIKE manager_path || '%'
      AND u.id != manager_user_id
    ORDER BY u.hierarchy_level, u.name;
END;
$$ LANGUAGE plpgsql;

-- Function: Get all ancestors of a user (up the chain)
CREATE OR REPLACE FUNCTION get_all_ancestors(user_id_param INT)
RETURNS TABLE(user_id INT, name VARCHAR, role user_role, level INT) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE ancestors AS (
        SELECT u.id, u.name, u.role, u.hierarchy_level, u.parent_id
        FROM users u
        WHERE u.id = (SELECT parent_id FROM users WHERE id = user_id_param)
        
        UNION ALL
        
        SELECT u.id, u.name, u.role, u.hierarchy_level, u.parent_id
        FROM users u
        INNER JOIN ancestors a ON u.id = a.parent_id
    )
    SELECT a.id, a.name, a.role, a.hierarchy_level
    FROM ancestors a
    ORDER BY a.hierarchy_level;
END;
$$ LANGUAGE plpgsql;

-- Function: Check if user has access to another user's data
CREATE OR REPLACE FUNCTION can_access_user(accessor_id INT, target_id INT)
RETURNS BOOLEAN AS $$
DECLARE
    accessor_role user_role;
    accessor_path TEXT;
    target_path TEXT;
BEGIN
    -- Get accessor info
    SELECT role, hierarchy_path INTO accessor_role, accessor_path 
    FROM users WHERE id = accessor_id;
    
    -- Super admin can access everyone
    IF accessor_role = 'super_admin' THEN
        RETURN TRUE;
    END IF;
    
    -- Get target path
    SELECT hierarchy_path INTO target_path FROM users WHERE id = target_id;
    
    -- Check if target is a subordinate (target's path starts with accessor's path)
    IF target_path LIKE accessor_path || '%' THEN
        RETURN TRUE;
    END IF;
    
    -- Check explicit access grants
    IF EXISTS (
        SELECT 1 FROM access_scope 
        WHERE user_id = accessor_id 
          AND can_access_user_id = target_id
          AND (expires_at IS NULL OR expires_at > NOW())
    ) THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- ==================== TRIGGERS ====================

-- Trigger: Update hierarchy path on insert/update
CREATE TRIGGER trigger_update_hierarchy_path
    BEFORE INSERT OR UPDATE OF parent_id ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_hierarchy_path();

-- Trigger: Update timestamps
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_zones_updated_at
    BEFORE UPDATE ON zones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_branches_updated_at
    BEFORE UPDATE ON branches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==================== VIEWS ====================

-- View: Users with full hierarchy info
CREATE OR REPLACE VIEW v_users_full AS
SELECT 
    u.id,
    u.client_id,
    u.email,
    u.name,
    u.phone,
    u.role,
    u.status,
    u.hierarchy_path,
    u.hierarchy_level,
    u.mfa_enabled,
    u.parent_id,
    p.name AS parent_name,
    p.role AS parent_role,
    b.branch_code,
    b.branch_name,
    z.zone_code,
    z.zone_name,
    u.client_code,
    u.employee_code,
    u.created_at,
    u.last_login_at,
    (SELECT COUNT(*) FROM users sub WHERE sub.parent_id = u.id) AS direct_subordinates_count
FROM users u
LEFT JOIN users p ON u.parent_id = p.id
LEFT JOIN branches b ON u.branch_id = b.id
LEFT JOIN zones z ON u.zone_id = z.id;

-- View: Role hierarchy summary
CREATE OR REPLACE VIEW v_role_hierarchy AS
SELECT 
    role,
    COUNT(*) AS total_users,
    COUNT(*) FILTER (WHERE status = 'active') AS active_users,
    COUNT(*) FILTER (WHERE mfa_enabled = TRUE) AS mfa_enabled_count
FROM users
GROUP BY role
ORDER BY 
    CASE role 
        WHEN 'super_admin' THEN 1
        WHEN 'zonal_head' THEN 2
        WHEN 'branch_manager' THEN 3
        WHEN 'rm' THEN 4
        WHEN 'client' THEN 5
    END;

-- View: Zone-wise user distribution
CREATE OR REPLACE VIEW v_zone_distribution AS
SELECT 
    z.zone_code,
    z.zone_name,
    COUNT(DISTINCT b.id) AS branch_count,
    COUNT(DISTINCT u.id) AS total_users,
    COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'branch_manager') AS branch_managers,
    COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'rm') AS relationship_managers,
    COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'client') AS clients
FROM zones z
LEFT JOIN branches b ON b.zone_id = z.id
LEFT JOIN users u ON u.zone_id = z.id OR u.branch_id = b.id
GROUP BY z.id, z.zone_code, z.zone_name
ORDER BY z.zone_name;

-- ==================== VERIFICATION ====================

SELECT 'Enhanced schema for role mapping and hierarchy created successfully!' AS status;


-- Add user_type column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS user_type VARCHAR(20) NOT NULL DEFAULT 'client' 
CHECK (user_type IN ('client', 'internal'));

-- Set internal users based on role
UPDATE users SET user_type = 'internal' 
WHERE role IN ('super_admin', 'zonal_head', 'branch_manager', 'rm');

-- Verify
SELECT role, user_type, COUNT(*) FROM users GROUP BY role, user_type;
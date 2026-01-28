-- ==================================================================================
-- Operations Dashboard - MF and Bond Tables
-- PostgreSQL Schema for Portfolio Management
-- ==================================================================================

-- ==================== MUTUAL FUNDS TABLE ====================
-- Stores Mutual Fund holdings data uploaded via CSV

CREATE TABLE IF NOT EXISTS mf_reports (
    id SERIAL PRIMARY KEY,
    
    -- Client Information
    client_id VARCHAR(50) NOT NULL,
    
    -- MF Details (from CSV columns)
    amc_name VARCHAR(255),                    -- AMC Name
    scheme_name VARCHAR(255),                 -- Scheme Name
    scheme_code VARCHAR(100),                 -- Scheme Code
    folio_no VARCHAR(100),                    -- Folio No
    scheme_category VARCHAR(100),             -- Scheme Category
    units DECIMAL(15, 4),                     -- Units
    avg_cost DECIMAL(15, 4),                  -- Avg Cost (₹)
    invested_amount DECIMAL(15, 2),           -- Invested Amount (₹)
    current_nav DECIMAL(15, 4),               -- Current NAV (₹)
    nav_date DATE,                            -- NAV Date
    current_value DECIMAL(15, 2),             -- Current Value (₹)
    unrealized_pl DECIMAL(15, 2),             -- Unrealized P&L (₹)
    unrealized_pl_percent DECIMAL(10, 2),     -- Unrealized P&L %
    
    -- Metadata
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_by INT,
    report_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraint (optional - depends on your users table)
    CONSTRAINT fk_mf_client FOREIGN KEY (client_id) 
        REFERENCES users(client_id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mf_reports_client_id ON mf_reports(client_id);
CREATE INDEX IF NOT EXISTS idx_mf_reports_scheme_code ON mf_reports(scheme_code);
CREATE INDEX IF NOT EXISTS idx_mf_reports_folio_no ON mf_reports(folio_no);
CREATE INDEX IF NOT EXISTS idx_mf_reports_uploaded_at ON mf_reports(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_mf_reports_report_date ON mf_reports(report_date);

-- ==================== BONDS TABLE ====================
-- Stores Bond holdings data uploaded via CSV

CREATE TABLE IF NOT EXISTS bond_reports (
    id SERIAL PRIMARY KEY,
    
    -- Client Information
    client_id VARCHAR(50) NOT NULL,
    
    -- Bond Details (from CSV columns)
    bond_name VARCHAR(255),                   -- Bond Name
    isin VARCHAR(50),                         -- ISIN
    issuer_name VARCHAR(255),                 -- Issuer Name
    bond_type VARCHAR(100),                   -- Bond type
    invested_principal_amount DECIMAL(15, 2), -- Invested/ Principal Amount
    issue_date DATE,                          -- Issue Date
    purchase_date DATE,                       -- Purchase Date
    coupon_rate DECIMAL(10, 4),               -- Coupon Rate
    coupon_frequency VARCHAR(50),             -- Coupon Frequency
    maturity_date DATE,                       -- Maturity Date
    call_date DATE,                           -- Call Date
    ytm_percent DECIMAL(10, 4),               -- YTM %
    ytc_percent DECIMAL(10, 4),               -- YTC %
    
    -- Metadata
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_by INT,
    report_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraint (optional - depends on your users table)
    CONSTRAINT fk_bond_client FOREIGN KEY (client_id) 
        REFERENCES users(client_id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bond_reports_client_id ON bond_reports(client_id);
CREATE INDEX IF NOT EXISTS idx_bond_reports_isin ON bond_reports(isin);
CREATE INDEX IF NOT EXISTS idx_bond_reports_maturity_date ON bond_reports(maturity_date);
CREATE INDEX IF NOT EXISTS idx_bond_reports_uploaded_at ON bond_reports(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_bond_reports_report_date ON bond_reports(report_date);

-- ==================== TRIGGERS ====================

-- Trigger: Update updated_at timestamp for MF reports
CREATE OR REPLACE FUNCTION update_mf_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_mf_reports_updated_at
    BEFORE UPDATE ON mf_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_mf_reports_updated_at();

-- Trigger: Update updated_at timestamp for Bond reports
CREATE OR REPLACE FUNCTION update_bond_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_bond_reports_updated_at
    BEFORE UPDATE ON bond_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_bond_reports_updated_at();

-- ==================== VERIFICATION ====================

SELECT 'MF and Bond reports tables created successfully!' AS status;

-- Verify tables
SELECT 
    table_name, 
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('mf_reports', 'bond_reports');

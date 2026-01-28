import { query } from '../aurora/index.js';
import csvProcessor from '../services/csv-processor.service.js';
import emailService from '../services/email.service.js';


/**
 * Operations Controller
 * Handles operations dashboard functionality for MF and Bond reports
 */

/**
 * Search client by client_id
 * GET /api/operations/clients/search?client_id=XXX
 * Searches in uploaded MF and Bond reports
 */
export const searchClient = async (req, res) => {
    try {
        const { client_id } = req.query;

        if (!client_id) {
            return res.status(400).json({
                success: false,
                message: 'client_id is required'
            });
        }

        // Search for client_id in both MF and Bond reports
        const sql = `
      SELECT DISTINCT 
        client_id,
        client_id as name,
        '' as email,
        '' as phone,
        'client' as role,
        'active' as status
      FROM (
        SELECT DISTINCT client_id FROM mf_reports WHERE client_id ILIKE $1
        UNION
        SELECT DISTINCT client_id FROM bond_reports WHERE client_id ILIKE $1
      ) AS clients
      ORDER BY client_id
      LIMIT 10
    `;

        const result = await query(sql, [`%${client_id}%`]);

        // Also try to get user details if they exist in users table
        if (result.rows.length > 0) {
            const userSql = `
        SELECT id, client_id, name, email, phone, role, status
        FROM users
        WHERE client_id = ANY($1)
      `;
            const clientIds = result.rows.map(r => r.client_id);
            const userResult = await query(userSql, [clientIds]);

            // Merge user data if available
            const userMap = new Map(userResult.rows.map(u => [u.client_id, u]));
            result.rows = result.rows.map(row => {
                const userData = userMap.get(row.client_id);
                return userData || {
                    ...row,
                    id: null,
                    name: row.client_id, // Use client_id as name if no user data
                    email: 'N/A',
                    phone: 'N/A'
                };
            });
        }

        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('❌ Search client error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search client',
            error: error.message
        });
    }
};

/**
 * Get MF data for a specific client
 * GET /api/operations/clients/:client_id/mf
 */
export const getClientMFData = async (req, res) => {
    try {
        const { client_id } = req.params;

        const sql = `
      SELECT 
        id, client_id, amc_name, scheme_name, scheme_code, folio_no,
        scheme_category, units, avg_cost, invested_amount, current_nav,
        nav_date, current_value, unrealized_pl, unrealized_pl_percent,
        report_date, uploaded_at
      FROM mf_reports
      WHERE client_id = $1
      ORDER BY uploaded_at DESC, scheme_name ASC
    `;

        const result = await query(sql, [client_id]);

        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('❌ Get MF data error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch MF data',
            error: error.message
        });
    }
};

/**
 * Get Bond data for a specific client
 * GET /api/operations/clients/:client_id/bonds
 */
export const getClientBondData = async (req, res) => {
    try {
        const { client_id } = req.params;

        const sql = `
      SELECT 
        id, client_id, bond_name, isin, issuer_name, bond_type,
        invested_principal_amount, issue_date, purchase_date,
        coupon_rate, coupon_frequency, maturity_date, call_date,
        ytm_percent, ytc_percent, report_date, uploaded_at
      FROM bond_reports
      WHERE client_id = $1
      ORDER BY uploaded_at DESC, bond_name ASC
    `;

        const result = await query(sql, [client_id]);

        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('❌ Get Bond data error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch Bond data',
            error: error.message
        });
    }
};

/**
 * Upload and process MF CSV report
 * POST /api/operations/upload/mf
 * Supports bulk upload with multiple clients in one CSV
 */
export const uploadMFReport = async (req, res) => {
    try {
        const file = req.file;

        // Validate file
        if (!file) {
            return res.status(400).json({
                success: false,
                message: 'CSV file is required'
            });
        }

        // Validate file
        const fileValidation = csvProcessor.validateCSVFile(file);
        if (!fileValidation.valid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid file',
                errors: fileValidation.errors
            });
        }

        // Parse CSV (client_id will be read from each row)
        const parseResult = await csvProcessor.parseMFCSV(file.buffer, null);

        if (parseResult.errors.length > 0) {
            console.warn('⚠️ CSV parsing had errors:', parseResult.errors);
        }

        // Insert records into database
        const uploadedBy = req.user?.id || null;
        let insertedCount = 0;
        const insertErrors = [];
        const processedClients = new Set();

        for (const record of parseResult.records) {
            try {
                const insertQuery = `
          INSERT INTO mf_reports (
            client_id, amc_name, scheme_name, scheme_code, folio_no,
            scheme_category, units, avg_cost, invested_amount, current_nav,
            nav_date, current_value, unrealized_pl, unrealized_pl_percent,
            report_date, uploaded_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        `;

                await query(insertQuery, [
                    record.client_id,
                    record.amc_name,
                    record.scheme_name,
                    record.scheme_code,
                    record.folio_no,
                    record.scheme_category,
                    record.units,
                    record.avg_cost,
                    record.invested_amount,
                    record.current_nav,
                    record.nav_date,
                    record.current_value,
                    record.unrealized_pl,
                    record.unrealized_pl_percent,
                    record.report_date,
                    uploadedBy
                ]);

                insertedCount++;
                processedClients.add(record.client_id);
            } catch (error) {
                console.error('Error inserting MF record:', error);
                insertErrors.push({
                    record,
                    error: error.message
                });
            }
        }

        console.log(`✅ MF Upload complete: ${insertedCount} records inserted for ${processedClients.size} clients`);

        res.json({
            success: true,
            message: 'MF report uploaded successfully',
            data: {
                inserted: insertedCount,
                clients: processedClients.size,
                clientIds: Array.from(processedClients),
                total: parseResult.records.length,
                parseErrors: parseResult.errors.length,
                insertErrors: insertErrors.length
            }
        });
    } catch (error) {
        console.error('❌ Upload MF error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload MF report',
            error: error.message
        });
    }
};

/**
 * Upload and process Bond CSV report
 * POST /api/operations/upload/bonds
 * Supports bulk upload with multiple clients in one CSV
 */
export const uploadBondReport = async (req, res) => {
    try {
        const file = req.file;

        // Validate file
        if (!file) {
            return res.status(400).json({
                success: false,
                message: 'CSV file is required'
            });
        }

        // Validate file
        const fileValidation = csvProcessor.validateCSVFile(file);
        if (!fileValidation.valid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid file',
                errors: fileValidation.errors
            });
        }

        // Parse CSV (client_id will be read from each row)
        const parseResult = await csvProcessor.parseBondCSV(file.buffer, null);

        if (parseResult.errors.length > 0) {
            console.warn('⚠️ CSV parsing had errors:', parseResult.errors);
        }

        // Insert records into database
        const uploadedBy = req.user?.id || null;
        let insertedCount = 0;
        const insertErrors = [];
        const processedClients = new Set();

        for (const record of parseResult.records) {
            try {
                const insertQuery = `
          INSERT INTO bond_reports (
            client_id, bond_name, isin, issuer_name, bond_type,
            invested_principal_amount, issue_date, purchase_date,
            coupon_rate, coupon_frequency, maturity_date, call_date,
            ytm_percent, ytc_percent, report_date, uploaded_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        `;

                await query(insertQuery, [
                    record.client_id,
                    record.bond_name,
                    record.isin,
                    record.issuer_name,
                    record.bond_type,
                    record.invested_principal_amount,
                    record.issue_date,
                    record.purchase_date,
                    record.coupon_rate,
                    record.coupon_frequency,
                    record.maturity_date,
                    record.call_date,
                    record.ytm_percent,
                    record.ytc_percent,
                    record.report_date,
                    uploadedBy
                ]);

                insertedCount++;
                processedClients.add(record.client_id);
            } catch (error) {
                console.error('Error inserting Bond record:', error);
                insertErrors.push({
                    record,
                    error: error.message
                });
            }
        }

        console.log(`✅ Bond Upload complete: ${insertedCount} records inserted for ${processedClients.size} clients`);

        res.json({
            success: true,
            message: 'Bond report uploaded successfully',
            data: {
                inserted: insertedCount,
                clients: processedClients.size,
                clientIds: Array.from(processedClients),
                total: parseResult.records.length,
                parseErrors: parseResult.errors.length,
                insertErrors: insertErrors.length
            }
        });
    } catch (error) {
        console.error('❌ Upload Bond error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload Bond report',
            error: error.message
        });
    }
};

/**
 * Send report email to client
 * POST /api/operations/send-email/:client_id
 */
export const sendReportEmail = async (req, res) => {
    try {
        const { client_id } = req.params;
        const { report_type } = req.body; // 'mf', 'bond', or 'both'

        // Get client info
        const clientQuery = await query(
            'SELECT id, name, email FROM users WHERE client_id = $1',
            [client_id]
        );

        if (clientQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        const client = clientQuery.rows[0];

        if (!client.email) {
            return res.status(400).json({
                success: false,
                message: 'Client email not found'
            });
        }

        let emailResult;

        if (report_type === 'mf') {
            // Get MF data
            const mfData = await query(
                'SELECT * FROM mf_reports WHERE client_id = $1 ORDER BY scheme_name',
                [client_id]
            );

            emailResult = await emailService.sendMFReportEmail(
                client.email,
                client.name,
                mfData.rows
            );
        } else if (report_type === 'bond') {
            // Get Bond data
            const bondData = await query(
                'SELECT * FROM bond_reports WHERE client_id = $1 ORDER BY bond_name',
                [client_id]
            );

            emailResult = await emailService.sendBondReportEmail(
                client.email,
                client.name,
                bondData.rows
            );
        } else if (report_type === 'both') {
            // Get both MF and Bond data
            const [mfData, bondData] = await Promise.all([
                query('SELECT * FROM mf_reports WHERE client_id = $1 ORDER BY scheme_name', [client_id]),
                query('SELECT * FROM bond_reports WHERE client_id = $1 ORDER BY bond_name', [client_id])
            ]);

            emailResult = await emailService.sendCombinedReportEmail(
                client.email,
                client.name,
                mfData.rows,
                bondData.rows
            );
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid report_type. Must be "mf", "bond", or "both"'
            });
        }

        res.json({
            success: true,
            message: 'Email sent successfully',
            data: emailResult
        });
    } catch (error) {
        console.error('❌ Send email error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send email',
            error: error.message
        });
    }
};

/**
 * Delete a specific report entry
 * DELETE /api/operations/reports/:type/:id
 */
export const deleteReport = async (req, res) => {
    try {
        const { type, id } = req.params;

        if (!['mf', 'bond'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid report type. Must be "mf" or "bond"'
            });
        }

        const tableName = type === 'mf' ? 'mf_reports' : 'bond_reports';
        const sql = `DELETE FROM ${tableName} WHERE id = $1 RETURNING *`;

        const result = await query(sql, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        res.json({
            success: true,
            message: 'Report deleted successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('❌ Delete report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete report',
            error: error.message
        });
    }
};

/**
 * Delete all reports for a client
 * DELETE /api/operations/clients/:client_id/reports/:type
 */
export const deleteClientReports = async (req, res) => {
    try {
        const { client_id, type } = req.params;

        if (!['mf', 'bond', 'all'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid report type. Must be "mf", "bond", or "all"'
            });
        }

        let deletedCount = 0;

        if (type === 'mf' || type === 'all') {
            const mfResult = await query(
                'DELETE FROM mf_reports WHERE client_id = $1',
                [client_id]
            );
            deletedCount += mfResult.rowCount;
        }

        if (type === 'bond' || type === 'all') {
            const bondResult = await query(
                'DELETE FROM bond_reports WHERE client_id = $1',
                [client_id]
            );
            deletedCount += bondResult.rowCount;
        }

        res.json({
            success: true,
            message: `Deleted ${deletedCount} reports`,
            data: { deletedCount }
        });
    } catch (error) {
        console.error('❌ Delete client reports error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete reports',
            error: error.message
        });
    }
};

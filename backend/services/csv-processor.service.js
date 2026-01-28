import csv from 'csv-parser';
import fs from 'fs';
import { Readable } from 'stream';

/**
 * CSV Processor Service
 * Handles parsing and validation of CSV files for MF and Bond reports
 */

class CSVProcessorService {
    /**
     * Parse MF CSV file
     * Expected columns: AMC Name, Scheme Name, Scheme Code, Folio No, Scheme Category, 
     * Units, Avg Cost (₹), Invested Amount (₹), Current NAV (₹), NAV Date, 
     * Current Value (₹), Unrealized P&L (₹), Unrealized P&L %
     */
    async parseMFCSV(fileBuffer, clientId) {
        try {
            const records = [];
            const errors = [];

            // Convert buffer to stream
            const stream = Readable.from(fileBuffer.toString());

            return new Promise((resolve, reject) => {
                stream
                    .pipe(csv())
                    .on('data', (row) => {
                        try {
                            const record = this.validateAndTransformMFRow(row, clientId);
                            if (record.errors && record.errors.length > 0) {
                                errors.push({ row: records.length + 1, errors: record.errors });
                            } else {
                                records.push(record);
                            }
                        } catch (error) {
                            errors.push({ row: records.length + 1, error: error.message });
                        }
                    })
                    .on('end', () => {
                        resolve({ records, errors, totalRows: records.length + errors.length });
                    })
                    .on('error', (error) => {
                        reject(error);
                    });
            });
        } catch (error) {
            throw new Error(`Failed to parse MF CSV: ${error.message}`);
        }
    }

    /**
     * Parse Bond CSV file
     * Expected columns: Bond Name, ISIN, Issuer Name, Bond type, Invested/ Principal Amount,
     * Issue Date, Purchase Date, Coupon Rate, Coupon Frequency, Maturity Date, Call Date, YTM %, YTC %
     */
    async parseBondCSV(fileBuffer, clientId) {
        try {
            const records = [];
            const errors = [];

            // Convert buffer to stream
            const stream = Readable.from(fileBuffer.toString());

            return new Promise((resolve, reject) => {
                stream
                    .pipe(csv())
                    .on('data', (row) => {
                        try {
                            const record = this.validateAndTransformBondRow(row, clientId);
                            if (record.errors && record.errors.length > 0) {
                                errors.push({ row: records.length + 1, errors: record.errors });
                            } else {
                                records.push(record);
                            }
                        } catch (error) {
                            errors.push({ row: records.length + 1, error: error.message });
                        }
                    })
                    .on('end', () => {
                        resolve({ records, errors, totalRows: records.length + errors.length });
                    })
                    .on('error', (error) => {
                        reject(error);
                    });
            });
        } catch (error) {
            throw new Error(`Failed to parse Bond CSV: ${error.message}`);
        }
    }

    /**
     * Validate and transform MF row data
     */
    validateAndTransformMFRow(row, clientId) {
        const errors = [];

        // Helper function to clean and parse decimal values
        const parseDecimal = (value, fieldName) => {
            if (!value || value === '') return null;
            const cleaned = value.toString().replace(/,/g, '');
            const parsed = parseFloat(cleaned);
            if (isNaN(parsed)) {
                errors.push(`Invalid ${fieldName}: ${value}`);
                return null;
            }
            return parsed;
        };

        // Helper function to parse date
        const parseDate = (value, fieldName) => {
            if (!value || value === '') return null;
            const date = new Date(value);
            if (isNaN(date.getTime())) {
                errors.push(`Invalid ${fieldName}: ${value}`);
                return null;
            }
            return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        };

        const record = {
            client_id: clientId,
            amc_name: row['AMC Name'] || row['amc_name'] || null,
            scheme_name: row['Scheme Name'] || row['scheme_name'] || null,
            scheme_code: row['Scheme Code'] || row['scheme_code'] || null,
            folio_no: row['Folio No'] || row['folio_no'] || null,
            scheme_category: row['Scheme Category'] || row['scheme_category'] || null,
            units: parseDecimal(row['Units'] || row['units'], 'Units'),
            avg_cost: parseDecimal(row['Avg Cost (₹)'] || row['avg_cost'] || row['Avg Cost'], 'Avg Cost'),
            invested_amount: parseDecimal(row['Invested Amount (₹)'] || row['invested_amount'] || row['Invested Amount'], 'Invested Amount'),
            current_nav: parseDecimal(row['Current NAV (₹)'] || row['current_nav'] || row['Current NAV'], 'Current NAV'),
            nav_date: parseDate(row['NAV Date'] || row['nav_date'], 'NAV Date'),
            current_value: parseDecimal(row['Current Value (₹)'] || row['current_value'] || row['Current Value'], 'Current Value'),
            unrealized_pl: parseDecimal(row['Unrealized P&L (₹)'] || row['unrealized_pl'] || row['Unrealized P&L'], 'Unrealized P&L'),
            unrealized_pl_percent: parseDecimal(row['Unrealized P&L %'] || row['unrealized_pl_percent'] || row['Unrealized P&L Percent'], 'Unrealized P&L %'),
            report_date: new Date().toISOString().split('T')[0]
        };

        if (errors.length > 0) {
            record.errors = errors;
        }

        return record;
    }

    /**
     * Validate and transform Bond row data
     */
    validateAndTransformBondRow(row, clientId) {
        const errors = [];

        // Helper function to clean and parse decimal values
        const parseDecimal = (value, fieldName) => {
            if (!value || value === '') return null;
            const cleaned = value.toString().replace(/,/g, '');
            const parsed = parseFloat(cleaned);
            if (isNaN(parsed)) {
                errors.push(`Invalid ${fieldName}: ${value}`);
                return null;
            }
            return parsed;
        };

        // Helper function to parse date
        const parseDate = (value, fieldName) => {
            if (!value || value === '') return null;
            const date = new Date(value);
            if (isNaN(date.getTime())) {
                errors.push(`Invalid ${fieldName}: ${value}`);
                return null;
            }
            return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        };

        const record = {
            client_id: clientId,
            bond_name: row['Bond Name'] || row['bond_name'] || null,
            isin: row['ISIN'] || row['isin'] || null,
            issuer_name: row['Issuer Name'] || row['issuer_name'] || null,
            bond_type: row['Bond type'] || row['bond_type'] || null,
            invested_principal_amount: parseDecimal(row['Invested/ Principal Amount'] || row['invested_principal_amount'] || row['Invested Principal Amount'], 'Invested/Principal Amount'),
            issue_date: parseDate(row['Issue Date'] || row['issue_date'], 'Issue Date'),
            purchase_date: parseDate(row['Purchase Date'] || row['purchase_date'], 'Purchase Date'),
            coupon_rate: parseDecimal(row['Coupon Rate'] || row['coupon_rate'], 'Coupon Rate'),
            coupon_frequency: row['Coupon Frequency'] || row['coupon_frequency'] || null,
            maturity_date: parseDate(row['Maturity Date'] || row['maturity_date'], 'Maturity Date'),
            call_date: parseDate(row['Call Date'] || row['call_date'], 'Call Date'),
            ytm_percent: parseDecimal(row['YTM %'] || row['ytm_percent'] || row['YTM'], 'YTM %'),
            ytc_percent: parseDecimal(row['YTC %'] || row['ytc_percent'] || row['YTC'], 'YTC %'),
            report_date: new Date().toISOString().split('T')[0]
        };

        if (errors.length > 0) {
            record.errors = errors;
        }

        return record;
    }

    /**
     * Validate CSV file
     */
    validateCSVFile(file) {
        const errors = [];

        // Check file exists
        if (!file) {
            errors.push('No file provided');
            return { valid: false, errors };
        }

        // Check file type
        if (!file.mimetype || !file.mimetype.includes('csv')) {
            errors.push('File must be a CSV file');
        }

        // Check file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            errors.push('File size must be less than 10MB');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

export default new CSVProcessorService();

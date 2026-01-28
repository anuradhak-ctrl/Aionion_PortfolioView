import express from 'express';
import multer from 'multer';
import { authGuard, requireRole } from '../middleware/auth.middleware.js';
import * as operationsController from '../controllers/operations.controller.js';

const router = express.Router();

// Configure multer for file uploads (memory storage)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept only CSV files
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'));
        }
    }
});

// ==================== OPERATIONS ROUTES ====================

/**
 * GET /api/operations/clients/search
 * Search for clients by client_id or name
 * Query params: client_id
 */
router.get(
    '/clients/search',
    authGuard,
    requireRole('super_admin', 'operations'),
    operationsController.searchClient
);

/**
 * GET /api/operations/clients/:client_id/mf
 * Get MF data for a specific client
 */
router.get(
    '/clients/:client_id/mf',
    authGuard,
    requireRole('super_admin', 'operations'),
    operationsController.getClientMFData
);

/**
 * GET /api/operations/clients/:client_id/bonds
 * Get Bond data for a specific client
 */
router.get(
    '/clients/:client_id/bonds',
    authGuard,
    requireRole('super_admin', 'operations'),
    operationsController.getClientBondData
);

/**
 * POST /api/operations/upload/mf
 * Upload MF CSV report
 * Body: client_id (form field), file (CSV file)
 */
router.post(
    '/upload/mf',
    authGuard,
    requireRole('super_admin', 'operations'),
    upload.single('file'),
    operationsController.uploadMFReport
);

/**
 * POST /api/operations/upload/bonds
 * Upload Bond CSV report
 * Body: client_id (form field), file (CSV file)
 */
router.post(
    '/upload/bonds',
    authGuard,
    requireRole('super_admin', 'operations'),
    upload.single('file'),
    operationsController.uploadBondReport
);

/**
 * POST /api/operations/send-email/:client_id
 * Send report email to client
 * Body: report_type ('mf', 'bond', or 'both')
 */
router.post(
    '/send-email/:client_id',
    authGuard,
    requireRole('super_admin', 'operations'),
    operationsController.sendReportEmail
);

/**
 * DELETE /api/operations/reports/:type/:id
 * Delete a specific report entry
 * Params: type ('mf' or 'bond'), id (report id)
 */
router.delete(
    '/reports/:type/:id',
    authGuard,
    requireRole('super_admin', 'operations'),
    operationsController.deleteReport
);

/**
 * DELETE /api/operations/clients/:client_id/reports/:type
 * Delete all reports for a client
 * Params: client_id, type ('mf', 'bond', or 'all')
 */
router.delete(
    '/clients/:client_id/reports/:type',
    authGuard,
    requireRole('super_admin', 'operations'),
    operationsController.deleteClientReports
);

// Error handling middleware for multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File size too large. Maximum size is 10MB'
            });
        }
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
    next(error);
});

export default router;

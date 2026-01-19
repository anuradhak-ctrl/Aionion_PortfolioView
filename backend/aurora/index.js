/**
 * Aurora Repositories Index
 * 
 * Re-exports all repositories for easy importing
 */

// Connection layer
export * as db from './connection.js';
export {
    query,
    queryRows,
    queryOne,
    transaction,
    healthCheck,
    closePool
} from './connection.js';

// User repository
export * as userRepo from './user.repository.js';

// Hierarchy repository
export * as hierarchyRepo from './hierarchy.repository.js';

// Audit repository
export * as auditRepo from './audit.repository.js';

// Default export for convenience
import db from './connection.js';
import userRepo from './user.repository.js';
import hierarchyRepo from './hierarchy.repository.js';
import auditRepo from './audit.repository.js';

export default {
    db,
    userRepo,
    hierarchyRepo,
    auditRepo
};

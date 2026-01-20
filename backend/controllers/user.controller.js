// controllers/user.controller.js
// ES MODULE VERSION — FINAL

import * as techexcelService from '../services/techexcel.service.js';
import userSyncService from '../auth/user-sync.service.js'; // Import user sync service
import { userRepo } from '../aurora/index.js';


export const getMe = (req, res) => {
  try {
    const dashboardMap = {
      client: 'CLIENT_DASHBOARD',
      rm: 'RM_DASHBOARD',
      branch_manager: 'BRANCH_MANAGER_DASHBOARD',
      zonal_head: 'ZONAL_HEAD_DASHBOARD',
      super_admin: 'SUPER_ADMIN_DASHBOARD',
      director: 'DIRECTOR_DASHBOARD'
    };

    const permissions = {
      canViewClients: ['rm', 'branch_manager', 'zonal_head', 'director', 'super_admin'].includes(req.user.role),
      canManageTeam: ['branch_manager', 'zonal_head', 'director', 'super_admin'].includes(req.user.role),
      canAccessReports: ['branch_manager', 'zonal_head', 'director', 'super_admin'].includes(req.user.role),
      canManageUsers: ['super_admin', 'director'].includes(req.user.role),
      isInternal: req.user.poolType === 'internal',
      isClient: req.user.poolType === 'client',
      isAdmin: ['super_admin', 'director'].includes(req.user.role)
    };

    // Proactive Cache Warmup: DISABLED (Conflicted with ClientDataContext Global Hydration)
    // The Frontend now handles blocking hydration, so this background warmup is redundant and risky.
    /*
    if (req.user.poolType === 'client' || req.user.role === 'client') {
      console.log(`🔥 Triggering Portfolio Warmup for ${req.user.sub}`);
      techexcelService.fetchClientPortfolio({ CLIENT_CODE: req.user.sub, bypassCache: true })
        .then(() => console.log(`✅ Warmup Complete for ${req.user.sub}`))
        .catch(err => console.log(`⚠️ Warmup Background Error for ${req.user.sub}:`, err.message));
    }
    */

    res.json({
      user: {
        id: req.user.sub,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        poolType: req.user.poolType
      },
      dashboard: dashboardMap[req.user.role] || 'DEFAULT_DASHBOARD',
      permissions
    });
  } catch (err) {
    console.error('getMe error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc Get user profile
export const getProfile = (req, res) => {
  try {
    res.json({
      id: req.user.sub,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      poolType: req.user.poolType,
      tokenIssued: new Date(req.user.iat * 1000).toISOString(),
      tokenExpires: new Date(req.user.exp * 1000).toISOString()
    });
  } catch (err) {
    console.error('getProfile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc Update user profile
export const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;

    res.json({
      message: 'Profile update endpoint',
      userId: req.user.sub,
      requestedChanges: { name }
    });
  } catch (err) {
    console.error('updateProfile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc Get all users (admin only)
export const getAllUsers = async (req, res) => {
  try {
    res.json({
      message: 'Admin user list endpoint',
      requestedBy: req.user.email,
      role: req.user.role,
      users: []
    });
  } catch (err) {
    console.error('getAllUsers error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc Get clients (RM+)
export const getClients = async (req, res) => {
  try {
    const clients = await userSyncService.getAccessibleUsers(req.user.id, req.user.role, { role: 'client' });

    res.json({
      message: 'Client list',
      requestedBy: req.user.email,
      role: req.user.role,
      clients: clients
    });
  } catch (err) {
    console.error('getClients error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc Get user by ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    res.json({
      message: 'Get user by ID endpoint',
      userId: id
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc Get client portfolio (Client only or RM viewing Client)
export const getClientPortfolio = async (req, res) => {
  try {
    let clientCode = req.user.username;

    // Allow RMs/Manager/Admins to view specific client portfolio
    if (req.query.clientCode && req.user.role !== 'client') {
      const requestedCode = req.query.clientCode;

      // Find target user ID to check hierarchy access
      const targetUser = await userRepo.findByClientId(requestedCode);
      if (!targetUser) {
        return res.status(404).json({ message: 'Client not found' });
      }

      // Check permissions
      if (req.user.role !== 'super_admin') {
        const canAccess = await userSyncService.canAccessUser(req.user.id, targetUser.id);
        if (!canAccess) {
          return res.status(403).json({ message: 'Access denied to this client' });
        }
      }

      clientCode = requestedCode;
    }

    console.log('👤 Fetching portfolio for:', clientCode, 'Requester:', req.user.username);

    if (!clientCode) {
      return res.status(400).json({ message: 'Client code not found' });
    }

    // 1. Try Read-Only Cache
    const cachedData = await techexcelService.getCachedPortfolio(clientCode);

    if (cachedData) {
      // console.log(`⚡ Fast Portfolio Read for ${clientCode}`);
      return res.json({
        success: true,
        clientCode,
        cash: cachedData.cash,
        data: cachedData.holdings, // Map holdings -> data
        timestamp: cachedData.timestamp
      });
    }

    // 2. Cache Miss (First Load)
    console.log(`⚠️ Pure Cache Miss for ${clientCode}. Waiting for client trigger.`);

    // Return empty state (Frontend should handle this gracefuly, e.g. show "Updating...")
    return res.json({
      success: true,
      clientCode,
      cash: { previousClosing: 0, availableBalance: 0 },
      data: [],
      timestamp: 0,
      status: 'syncing'
    });

  } catch (err) {
    console.error('getClientPortfolio error:', err);
    // Return empty data instead of error when API is unreachable
    // This allows frontend to show "No data found" message
    res.json({
      success: false,
      clientCode: req.user.username,
      cash: { previousClosing: 0, availableBalance: 0 },
      data: [],
      message: 'Unable to fetch portfolio data. Please check your network connection or try again later.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// @desc Refresh client portfolio (Explicit Write Action) - Supports RMs refreshing client data
export const refreshClientPortfolio = async (req, res) => {
  try {
    let clientCode = req.user.username;

    // Allow RMs/Manager/Admins to refresh specific client portfolio
    if (req.query.clientCode && req.user.role !== 'client') {
      const requestedCode = req.query.clientCode;

      // Find target user ID to check hierarchy access
      const targetUser = await userRepo.findByClientId(requestedCode);
      if (!targetUser) {
        return res.status(404).json({ message: 'Client not found' });
      }

      // Check permissions
      if (req.user.role !== 'super_admin') {
        const canAccess = await userSyncService.canAccessUser(req.user.id, targetUser.id);
        if (!canAccess) {
          return res.status(403).json({ message: 'Access denied to this client' });
        }
      }

      clientCode = requestedCode;
    }

    console.log('🔄 Explicit Portfolio Refresh for:', clientCode, 'Requester:', req.user.username);

    const result = await techexcelService.fetchClientPortfolio({
      CLIENT_CODE: clientCode,
      bypassCache: true
    });

    res.json({
      success: true,
      clientCode,
      cash: result.cash,
      data: result.holdings,
      timestamp: result.timestamp
    });
  } catch (err) {
    console.error('refreshClientPortfolio error:', err);
    res.status(500).json({ message: 'Refresh failed', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
};

// @desc Get client ledger/account statement (Client only or RM viewing Client)
export const getLedger = async (req, res) => {
  try {
    let clientCode = req.user.username;

    // Allow RMs/Manager/Admins to view specific client ledger
    if (req.query.clientCode && req.user.role !== 'client') {
      const requestedCode = req.query.clientCode;

      // Find target user ID to check hierarchy access
      const targetUser = await userRepo.findByClientId(requestedCode);
      if (!targetUser) {
        return res.status(404).json({ message: 'Client not found' });
      }

      // Check permissions
      if (req.user.role !== 'super_admin') {
        const canAccess = await userSyncService.canAccessUser(req.user.id, targetUser.id);
        if (!canAccess) {
          return res.status(403).json({ message: 'Access denied to this client' });
        }
      }

      clientCode = requestedCode;
    }

    const financialYear = req.query.financialYear; // e.g., "2025-26"
    console.log('📄 Fetching ledger for:', clientCode, 'Requester:', req.user.username, 'FY:', financialYear || 'current');

    if (!clientCode) {
      return res.status(400).json({ message: 'Client code not found' });
    }

    const ledgerData = await techexcelService.fetchLedger({
      CLIENT_CODE: clientCode,
      financialYear
    });

    res.json({
      success: true,
      clientCode,
      data: ledgerData
    });
  } catch (err) {
    console.error('getLedger error:', err);

    // Provide specific error message
    const errorMessage = err.message && err.message.includes('not found in TechExcel')
      ? err.message
      : 'Failed to fetch ledger data';

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

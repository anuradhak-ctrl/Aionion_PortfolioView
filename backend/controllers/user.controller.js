// controllers/user.controller.js
// ES MODULE VERSION — FINAL

// @desc Get current user info with dashboard and permissions
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
    res.json({
      message: 'Client list for RMs',
      requestedBy: req.user.email,
      role: req.user.role,
      clients: []
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
    console.error('getUserById error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

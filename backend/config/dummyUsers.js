// Local Development Dummy Users
// ONLY for localhost - NOT used in production

const DUMMY_USERS = [
  // Client
  {
    email: 'client@test.com',
    password: 'test123',
    role: 'client',
    name: 'Test Client',
    poolType: 'client'
  },
  
  // Relationship Manager
  {
    email: 'rm@test.com',
    password: 'test123',
    role: 'rm',
    name: 'Test RM',
    poolType: 'client'
  },
  
  // Branch Manager
  {
    email: 'bm@test.com',
    password: 'test123',
    role: 'branch_manager',
    name: 'Test Branch Manager',
    poolType: 'client'
  },
  
  // Zonal Head
  {
    email: 'zh@test.com',
    password: 'test123',
    role: 'zonal_head',
    name: 'Test Zonal Head',
    poolType: 'client'
  },
  
  // Director
  {
    email: 'director@test.com',
    password: 'test123',
    role: 'director',
    name: 'Test Director',
    poolType: 'client'
  },
  
  // Super Admin
  {
    email: 'admin@test.com',
    password: 'test123',
    role: 'super_admin',
    name: 'Test Admin',
    poolType: 'client'
  }
];

// Helper to find user
export function findDummyUser(email, password) {
  return DUMMY_USERS.find(
    (u) => u.email === email && u.password === password
  );
}

export { DUMMY_USERS };

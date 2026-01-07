import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand
} from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({ 
  region: process.env.COGNITO_REGION || "ap-south-1" 
});

/**
 * Login with username and password (no OAuth)
 * 
 * Uses ONE app client for all users
 * User type (client/internal) determined by:
 * - Groups in Cognito
 * - Custom attributes
 * - Or separate user pools (if configured)
 */
export const loginWithPassword = async (req, res) => {
  const { username, password, userType = 'client' } = req.body;

  // Validate input
  if (!username || !password) {
    return res.status(400).json({ 
      success: false,
      message: 'Username and password are required' 
    });
  }

  // Default to 'client' if userType not provided or invalid
  const validUserType = ['client', 'internal'].includes(userType) ? userType : 'client';

  // Use ONE app client (recommended approach)
  // If you need separate pools, set different IDs in .env
  const clientId = validUserType === 'client' 
    ? process.env.CLIENT_APP_CLIENT_ID 
    : (process.env.INTERNAL_APP_CLIENT_ID || process.env.CLIENT_APP_CLIENT_ID);

  if (!clientId) {
    return res.status(500).json({ 
      success: false,
      message: `Cognito client ID not configured` 
    });
  }

  console.log(`🔐 Login attempt: ${validUserType} user - ${username}`);

  const command = new InitiateAuthCommand({
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: clientId,
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password,
    },
  });

  try {
    const response = await client.send(command);
    
    if (!response.AuthenticationResult) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication failed' 
      });
    }

    const { IdToken, AccessToken, RefreshToken } = response.AuthenticationResult;

    // Decode ID token to get user info (faster than GetUser API call)
    // ID token contains all user attributes already
    const payload = JSON.parse(Buffer.from(IdToken.split('.')[1], 'base64').toString());
    
    // Extract user info from token
    const user = {
      username: payload['cognito:username'] || payload.sub,
      email: payload.email,
      name: payload.name || payload.email,
      // Determine role from Cognito groups or custom attributes
      role: determineUserRole(payload, validUserType),
      poolType: validUserType,
      // Include groups if present
      groups: payload['cognito:groups'] || []
    };

    console.log(`✅ Login successful: ${user.username} (${user.role})`);

    res.json({
      success: true,
      message: 'Login successful',
      tokens: {
        idToken: IdToken,
        accessToken: AccessToken,
        refreshToken: RefreshToken
      },
      user
    });

  } catch (error) {
    console.error('❌ Cognito login error:', error.name, error.message);
    
    let message = 'Authentication failed';
    if (error.name === 'NotAuthorizedException') {
      message = 'Incorrect username or password';
    } else if (error.name === 'UserNotFoundException') {
      message = 'User not found';
    } else if (error.name === 'UserNotConfirmedException') {
      message = 'User account not confirmed';
    }

    res.status(401).json({ 
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Determine user role from token payload
 * Priority: cognito:groups > custom:role > userType
 */
function determineUserRole(payload, userType) {
  // Check Cognito groups first
  const groups = payload['cognito:groups'] || [];
  if (groups.length > 0) {
    // Map group to role
    const groupRoleMap = {
      'Admins': 'super_admin',
      'Directors': 'director',
      'ZonalHeads': 'zonal_head',
      'BranchManagers': 'branch_manager',
      'RMs': 'rm',
      'Clients': 'client'
    };
    
    for (const group of groups) {
      if (groupRoleMap[group]) {
        return groupRoleMap[group];
      }
    }
  }
  
  // Check custom attributes
  if (payload['custom:role']) {
    return payload['custom:role'];
  }
  
  // Fallback to userType
  return userType === 'client' ? 'client' : 'user';
}

/**
 * Refresh access token
 */
export const refreshToken = async (req, res) => {
  const { refreshToken, userType } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ 
      success: false,
      message: 'Refresh token is required' 
    });
  }

  const clientId = userType === 'client' 
    ? process.env.CLIENT_APP_CLIENT_ID 
    : process.env.INTERNAL_APP_CLIENT_ID;

  const command = new InitiateAuthCommand({
    AuthFlow: "REFRESH_TOKEN_AUTH",
    ClientId: clientId,
    AuthParameters: {
      REFRESH_TOKEN: refreshToken,
    },
  });

  try {
    const response = await client.send(command);
    
    res.json({
      success: true,
      tokens: {
        idToken: response.AuthenticationResult.IdToken,
        accessToken: response.AuthenticationResult.AccessToken
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ 
      success: false,
      message: 'Failed to refresh token',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

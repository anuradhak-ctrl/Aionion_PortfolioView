import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  AssociateSoftwareTokenCommand,
  VerifySoftwareTokenCommand,
  RespondToAuthChallengeCommand
} from "@aws-sdk/client-cognito-identity-provider";
import QRCode from 'qrcode';

const client = new CognitoIdentityProviderClient({
  region: process.env.COGNITO_REGION || "ap-south-1"
});

/**
 * STEP 5.1 — Main Login Flow
 * THIS IS THE AUTHORITATIVE ENTRY POINT
 * 
 * Cognito returns one of:
 * - SUCCESS (tokens)
 * - NEW_PASSWORD_REQUIRED
 * - MFA_SETUP
 * - SOFTWARE_TOKEN_MFA
 * 
 * Backend ROUTES the flow, never guesses.
 */
export const loginWithPassword = async (req, res) => {
  const { username, password, userType = 'client' } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username and password are required'
    });
  }

  // STEP 5.2 — Backend decides which app client
  const validUserType = ['client', 'internal'].includes(userType) ? userType : 'client';
  const clientId = validUserType === 'client'
    ? process.env.CLIENT_APP_CLIENT_ID
    : (process.env.INTERNAL_APP_CLIENT_ID || process.env.CLIENT_APP_CLIENT_ID);

  if (!clientId) {
    return res.status(500).json({
      success: false,
      message: 'Cognito client ID not configured'
    });
  }

  console.log(`🔐 InitiateAuth: ${validUserType} - ${username}`);

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

    // STEP 5.4 — Handle all Cognito challenge responses

    // Case 1: SUCCESS (AuthenticationResult present)
    if (response.AuthenticationResult) {
      const { IdToken, AccessToken, RefreshToken } = response.AuthenticationResult;
      const payload = JSON.parse(Buffer.from(IdToken.split('.')[1], 'base64').toString());

      const user = {
        id: payload.sub,
        username: payload['cognito:username'] || payload.sub,
        email: payload.email,
        name: payload.name || payload.email,
        role: determineUserRole(payload, validUserType),
        poolType: validUserType,
        groups: payload['cognito:groups'] || [],
        amr: payload.amr || [] // Authentication Methods Reference (pwd, mfa, etc.)
      };

      console.log(`✅ SUCCESS: ${user.username} (${user.role}) - AMR: ${JSON.stringify(user.amr)}`);

      return res.json({
        success: true,
        status: 'SUCCESS',
        tokens: {
          idToken: IdToken,
          accessToken: AccessToken,
          refreshToken: RefreshToken
        },
        user
      });
    }

    // Case 2: NEW_PASSWORD_REQUIRED
    if (response.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
      console.log(`🔑 NEW_PASSWORD_REQUIRED for ${username}`);
      return res.json({
        success: true,
        status: 'NEW_PASSWORD_REQUIRED',
        session: response.Session,
        username: username,
        message: 'You must set a new password before logging in'
      });
    }

    // Case 3: MFA_SETUP (first-time MFA enrollment)
    if (response.ChallengeName === 'MFA_SETUP') {
      console.log(`📱 MFA_SETUP required for ${username}`);
      return res.json({
        success: true,
        status: 'MFA_SETUP',
        session: response.Session,
        username: username,
        message: 'MFA enrollment required. Please set up your authenticator app.'
      });
    }

    // Case 4: SOFTWARE_TOKEN_MFA (normal MFA challenge)
    if (response.ChallengeName === 'SOFTWARE_TOKEN_MFA') {
      console.log(`🔢 SOFTWARE_TOKEN_MFA challenge for ${username}`);
      return res.json({
        success: true,
        status: 'MFA_REQUIRED',
        session: response.Session,
        username: username,
        message: 'Please enter your MFA code'
      });
    }

    // Unexpected response
    console.error('❌ Unexpected Cognito response:', response);
    return res.status(500).json({
      success: false,
      message: 'Unexpected authentication response'
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
 * STEP 5.5 — MFA Setup: Associate Software Token
 * This generates the MFA secret and returns QR code
 */
export const setupMfa = async (req, res) => {
  const { session, username } = req.body;

  if (!session) {
    return res.status(400).json({
      success: false,
      message: 'Session token required'
    });
  }

  console.log(`📱 Generating MFA secret for ${username}`);

  try {
    const command = new AssociateSoftwareTokenCommand({
      Session: session
    });

    const response = await client.send(command);
    const secretCode = response.SecretCode;

    // Generate QR code for authenticator apps
    const issuer = 'PortfolioView';
    const otpauthUrl = `otpauth://totp/${issuer}:${username}?secret=${secretCode}&issuer=${issuer}`;
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    console.log(`✅ MFA secret generated for ${username}`);

    res.json({
      success: true,
      secretCode,
      qrCode: qrCodeDataUrl,
      session: response.Session,
      message: 'Scan QR code with your authenticator app'
    });

  } catch (error) {
    console.error('❌ MFA setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate MFA secret',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * STEP 5.5 — Verify MFA Setup
 * User enters OTP from authenticator app to complete enrollment
 */
export const verifyMfaSetup = async (req, res) => {
  const { session, code, username, userType = 'client' } = req.body;

  if (!session || !code) {
    return res.status(400).json({
      success: false,
      message: 'Session and MFA code required'
    });
  }

  console.log(`📱 Verifying MFA setup for ${username}`);

  try {
    const command = new VerifySoftwareTokenCommand({
      Session: session,
      UserCode: code
    });

    const response = await client.send(command);

    if (response.Status === 'SUCCESS') {
      console.log(`✅ MFA enrollment complete for ${username}`);

      // MFA is now active - complete authentication
      // The response contains tokens if authentication is complete
      if (response.Session) {
        // Need to complete auth challenge
        return res.json({
          success: true,
          status: 'MFA_SETUP_COMPLETE',
          message: 'MFA setup successful. Please log in again.',
          requiresRelogin: true
        });
      }

      res.json({
        success: true,
        status: 'MFA_SETUP_COMPLETE',
        message: 'MFA setup successful'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid MFA code'
      });
    }

  } catch (error) {
    console.error('❌ MFA verification error:', error);
    res.status(400).json({
      success: false,
      message: error.name === 'CodeMismatchException' ? 'Invalid MFA code' : 'MFA verification failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * STEP 5.5 — Respond to MFA Challenge (During Login)
 * User enters OTP during normal login after MFA is already set up
 */
export const verifyMfaChallenge = async (req, res) => {
  const { session, code, username, userType = 'client' } = req.body;

  if (!session || !code || !username) {
    return res.status(400).json({
      success: false,
      message: 'Session, username, and MFA code required'
    });
  }

  const clientId = userType === 'client'
    ? process.env.CLIENT_APP_CLIENT_ID
    : (process.env.INTERNAL_APP_CLIENT_ID || process.env.CLIENT_APP_CLIENT_ID);

  console.log(`🔢 Verifying MFA challenge for ${username}`);

  try {
    const command = new RespondToAuthChallengeCommand({
      ChallengeName: 'SOFTWARE_TOKEN_MFA',
      ClientId: clientId,
      Session: session,
      ChallengeResponses: {
        USERNAME: username,
        SOFTWARE_TOKEN_MFA_CODE: code
      }
    });

    const response = await client.send(command);

    if (response.AuthenticationResult) {
      const { IdToken, AccessToken, RefreshToken } = response.AuthenticationResult;
      const payload = JSON.parse(Buffer.from(IdToken.split('.')[1], 'base64').toString());

      const user = {
        id: payload.sub,
        username: payload['cognito:username'] || payload.sub,
        email: payload.email,
        name: payload.name || payload.email,
        role: determineUserRole(payload, userType),
        poolType: userType,
        groups: payload['cognito:groups'] || [],
        amr: payload.amr || []
      };

      console.log(`✅ MFA verified: ${user.username} - AMR: ${JSON.stringify(user.amr)}`);

      return res.json({
        success: true,
        status: 'SUCCESS',
        tokens: {
          idToken: IdToken,
          accessToken: AccessToken,
          refreshToken: RefreshToken
        },
        user
      });
    }

    res.status(500).json({
      success: false,
      message: 'Unexpected response from Cognito'
    });

  } catch (error) {
    console.error('❌ MFA challenge error:', error);
    res.status(400).json({
      success: false,
      message: error.name === 'CodeMismatchException' ? 'Invalid MFA code' : 'MFA verification failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Handle NEW_PASSWORD_REQUIRED Challenge
 */
export const changePassword = async (req, res) => {
  const { session, username, newPassword, userType = 'client' } = req.body;

  if (!session || !username || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Session, username, and new password required'
    });
  }

  const clientId = userType === 'client'
    ? process.env.CLIENT_APP_CLIENT_ID
    : (process.env.INTERNAL_APP_CLIENT_ID || process.env.CLIENT_APP_CLIENT_ID);

  console.log(`🔑 Processing NEW_PASSWORD_REQUIRED for ${username}`);

  try {
    const command = new RespondToAuthChallengeCommand({
      ChallengeName: 'NEW_PASSWORD_REQUIRED',
      ClientId: clientId,
      Session: session,
      ChallengeResponses: {
        USERNAME: username,
        NEW_PASSWORD: newPassword
      }
    });

    const response = await client.send(command);

    // After password change, might need MFA setup or direct login
    if (response.AuthenticationResult) {
      const { IdToken, AccessToken, RefreshToken } = response.AuthenticationResult;
      const payload = JSON.parse(Buffer.from(IdToken.split('.')[1], 'base64').toString());

      const user = {
        id: payload.sub,
        username: payload['cognito:username'] || payload.sub,
        email: payload.email,
        name: payload.name || payload.email,
        role: determineUserRole(payload, userType),
        poolType: userType,
        groups: payload['cognito:groups'] || [],
        amr: payload.amr || []
      };

      console.log(`✅ Password changed and authenticated: ${user.username}`);

      return res.json({
        success: true,
        status: 'SUCCESS',
        tokens: {
          idToken: IdToken,
          accessToken: AccessToken,
          refreshToken: RefreshToken
        },
        user
      });
    }

    // Might transition to MFA_SETUP
    if (response.ChallengeName === 'MFA_SETUP') {
      return res.json({
        success: true,
        status: 'MFA_SETUP',
        session: response.Session,
        username: username,
        message: 'Password changed. Now please set up MFA.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Unexpected response after password change'
    });

  } catch (error) {
    console.error('❌ Password change error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to change password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Determine user role from token payload
 * Priority: cognito:groups > custom:role > userType
 */
function determineUserRole(payload, userType) {
  const groups = payload['cognito:groups'] || [];
  if (groups.length > 0) {
    const groupRoleMap = {
      'ADMIN': 'super_admin',
      'INTERNAL': 'internal',
      'CLIENT': 'client',
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

  if (payload['custom:role']) {
    return payload['custom:role'];
  }

  return userType === 'client' ? 'client' : 'user';
}

/**
 * STEP 5.7 — Refresh Token
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
    : (process.env.INTERNAL_APP_CLIENT_ID || process.env.CLIENT_APP_CLIENT_ID);

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
    console.error('❌ Token refresh error:', error);
    res.status(401).json({
      success: false,
      message: 'Failed to refresh token',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

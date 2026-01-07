import express from 'express';
import * as localAuthController from '../controllers/local-auth.controller.js';

const router = express.Router();

// Local development auth routes
// ONLY active when USE_LOCAL_AUTH=true

router.post('/login', localAuthController.login);
router.post('/logout', localAuthController.logout);

export default router;

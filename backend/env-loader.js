import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment-specific .env file BEFORE any other imports
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: path.resolve(__dirname, envFile) });

console.log(`📁 Loaded environment from: ${envFile}`);
console.log(`🔧 USE_LOCAL_AUTH = ${process.env.USE_LOCAL_AUTH}`);

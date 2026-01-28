/**
 * Database Seeding Script - User Hierarchy
 * 
 * Creates a realistic hierarchical structure:
 * - 4 Zonal Managers
 * - 8 Relationship Managers (2 per ZM)
 * - 18 Branch Managers (2-3 per RM)
 * - 100 Clients (5-6 per BM)
 * 
 * SAFETY: Only runs in development environment
 */

import { query, queryOne } from '../aurora/connection.js';
import dotenv from 'dotenv';

dotenv.config();

// SAFETY CHECK: Prevent running in production
const ENVIRONMENT = process.env.NODE_ENV || 'development';
if (ENVIRONMENT === 'production') {
    console.error('❌ ERROR: Cannot run seed script in production!');
    process.exit(1);
}

console.log(`✅ Running in ${ENVIRONMENT} mode - safe to seed\n`);

// Helper to generate unique email
const generateEmail = (name, role, index) => {
    const sanitized = name.toLowerCase().replace(/\s+/g, '.');
    return `${sanitized}.${role}${index}@aionion.local`;
};

// Seed data structure
const ZONAL_MANAGERS = [
    { name: 'Rajesh Kumar', zone: 'North Zone' },
    { name: 'Priya Sharma', zone: 'South Zone' },
    { name: 'Amit Patel', zone: 'West Zone' },
    { name: 'Sneha Reddy', zone: 'East Zone' }
];

const RM_NAMES = [
    'Vikram Singh', 'Anita Desai', 'Suresh Rao', 'Meera Joshi',
    'Karan Malhotra', 'Pooja Nair', 'Rahul Verma', 'Kavita Iyer'
];

const BM_NAMES = [
    'Arun Sharma', 'Deepika Menon', 'Sanjay Gupta', 'Ritu Kapoor',
    'Manoj Kumar', 'Swati Pandey', 'Nikhil Shah', 'Anjali Mehta',
    'Vivek Jain', 'Preeti Singh', 'Arjun Nambiar', 'Simran Kaur',
    'Rohit Chopra', 'Neha Agarwal', 'Akash Reddy', 'Divya Pillai',
    'Kunal Saxena', 'Shruti Bose'
];

const CLIENT_FIRST_NAMES = [
    'Aarav', 'Advait', 'Arjun', 'Aryan', 'Dhruv', 'Ishaan', 'Kabir', 'Krishna',
    'Reyansh', 'Sai', 'Shaurya', 'Vihaan', 'Aanya', 'Aditi', 'Ananya', 'Diya',
    'Ishika', 'Kiara', 'Navya', 'Pari', 'Saanvi', 'Sara', 'Aadhya', 'Myra',
    'Arnav', 'Atharv', 'Ayaan', 'Dev', 'Jai', 'Om', 'Pranav', 'Rishi',
    'Aarohi', 'Anvi', 'Ira', 'Pihu', 'Riya', 'Shanaya', 'Tara', 'Zara'
];

const CLIENT_LAST_NAMES = [
    'Sharma', 'Verma', 'Patel', 'Kumar', 'Singh', 'Reddy', 'Nair', 'Iyer',
    'Gupta', 'Mehta', 'Shah', 'Malhotra', 'Chopra', 'Agarwal', 'Jain', 'Kapoor',
    'Desai', 'Rao', 'Menon', 'Pillai', 'Khanna', 'Bose', 'Saxena', 'Pandey'
];

// Generate random client name
const generateClientName = (index) => {
    const firstName = CLIENT_FIRST_NAMES[index % CLIENT_FIRST_NAMES.length];
    const lastName = CLIENT_LAST_NAMES[Math.floor(index / CLIENT_FIRST_NAMES.length) % CLIENT_LAST_NAMES.length];
    return `${firstName} ${lastName}`;
};

// Create user in database
const createUser = async (userData) => {
    const {
        client_id, email, name, role, parent_id,
        employee_code = null, client_code = null
    } = userData;

    const sql = `
    INSERT INTO users (
      client_id, email, name, role, status, user_type,
      parent_id, employee_code, client_code
    ) VALUES ($1, $2, $3, $4, 'active', $5, $6, $7, $8)
    ON CONFLICT (client_id) DO UPDATE SET
      email = EXCLUDED.email,
      name = EXCLUDED.name,
      role = EXCLUDED.role,
      parent_id = EXCLUDED.parent_id
    RETURNING id, client_id, name, role
  `;

    const user_type = role === 'client' ? 'client' : 'internal';

    const result = await queryOne(sql, [
        client_id,
        email,
        name,
        role,
        user_type,
        parent_id,
        employee_code,
        client_code
    ]);

    return result;
};

// Main seeding function
async function seedHierarchy() {
    console.log('🌱 Starting database seeding...\n');

    const stats = {
        zms: 0,
        rms: 0,
        bms: 0,
        clients: 0
    };

    try {
        // 1. Create Zonal Managers
        console.log('📊 Creating Zonal Managers...');
        const createdZMs = [];

        for (let i = 0; i < ZONAL_MANAGERS.length; i++) {
            const zm = ZONAL_MANAGERS[i];
            const userData = {
                client_id: `ZM${String(i + 1).padStart(3, '0')}`,
                email: generateEmail(zm.name, 'zm', i + 1),
                name: zm.name,
                role: 'zonal_head',
                parent_id: null,
                employee_code: `EMP-ZM-${String(i + 1).padStart(3, '0')}`
            };

            const created = await createUser(userData);
            createdZMs.push(created);
            stats.zms++;
            console.log(`  ✅ ${created.name} (${created.client_id})`);
        }

        // 2. Create Relationship Managers (2 per ZM)
        console.log('\n📊 Creating Relationship Managers...');
        const createdRMs = [];
        let rmIndex = 0;

        for (const zm of createdZMs) {
            for (let i = 0; i < 2; i++) {
                const rmName = RM_NAMES[rmIndex];
                const userData = {
                    client_id: `RM${String(rmIndex + 1).padStart(3, '0')}`,
                    email: generateEmail(rmName, 'rm', rmIndex + 1),
                    name: rmName,
                    role: 'rm',
                    parent_id: zm.id,
                    employee_code: `EMP-RM-${String(rmIndex + 1).padStart(3, '0')}`
                };

                const created = await createUser(userData);
                createdRMs.push(created);
                stats.rms++;
                console.log(`  ✅ ${created.name} (${created.client_id}) → under ${zm.name}`);
                rmIndex++;
            }
        }

        // 3. Create Branch Managers (2-3 per RM)
        console.log('\n📊 Creating Branch Managers...');
        const createdBMs = [];
        let bmIndex = 0;

        for (let rmIdx = 0; rmIdx < createdRMs.length; rmIdx++) {
            const rm = createdRMs[rmIdx];
            const numBMs = rmIdx % 2 === 0 ? 2 : 3; // Alternate between 2 and 3 BMs

            for (let i = 0; i < numBMs && bmIndex < BM_NAMES.length; i++) {
                const bmName = BM_NAMES[bmIndex];
                const userData = {
                    client_id: `BM${String(bmIndex + 1).padStart(3, '0')}`,
                    email: generateEmail(bmName, 'bm', bmIndex + 1),
                    name: bmName,
                    role: 'branch_manager',
                    parent_id: rm.id,
                    employee_code: `EMP-BM-${String(bmIndex + 1).padStart(3, '0')}`
                };

                const created = await createUser(userData);
                createdBMs.push(created);
                stats.bms++;
                console.log(`  ✅ ${created.name} (${created.client_id}) → under ${rm.name}`);
                bmIndex++;
            }
        }

        // 4. Create Clients (5-6 per BM)
        console.log('\n📊 Creating Clients...');
        let clientIndex = 0;

        for (let bmIdx = 0; bmIdx < createdBMs.length; bmIdx++) {
            const bm = createdBMs[bmIdx];
            const numClients = bmIdx % 2 === 0 ? 5 : 6; // Alternate between 5 and 6 clients

            for (let i = 0; i < numClients; i++) {
                const clientName = generateClientName(clientIndex);
                const clientCode = `CL${String(clientIndex + 1).padStart(4, '0')}`;

                const userData = {
                    client_id: clientCode,
                    email: generateEmail(clientName, 'client', clientIndex + 1),
                    name: clientName,
                    role: 'client',
                    parent_id: bm.id,
                    client_code: clientCode
                };

                const created = await createUser(userData);
                stats.clients++;

                if (i === 0) {
                    console.log(`  ✅ ${created.name} (${created.client_id}) → under ${bm.name}`);
                }

                clientIndex++;
            }
            console.log(`     ... and ${numClients - 1} more clients`);
        }

        // Print summary
        console.log('\n' + '═'.repeat(60));
        console.log('✨ SEEDING COMPLETED SUCCESSFULLY!');
        console.log('═'.repeat(60));
        console.log(`📈 Summary:`);
        console.log(`   • Zonal Managers:  ${stats.zms}`);
        console.log(`   • RMs:             ${stats.rms}`);
        console.log(`   • Branch Managers: ${stats.bms}`);
        console.log(`   • Clients:         ${stats.clients}`);
        console.log(`   ────────────────────────────`);
        console.log(`   TOTAL USERS:       ${stats.zms + stats.rms + stats.bms + stats.clients}`);
        console.log('═'.repeat(60));
        console.log('\n✅ You can now log in with any seeded user:');
        console.log('   Example: rajesh.kumar.zm1@aionion.local');
        console.log('   Example: vikram.singh.rm1@aionion.local');
        console.log('   Example: arun.sharma.bm1@aionion.local');
        console.log('\n📝 Note: Use password from your Cognito setup for these users.\n');

    } catch (error) {
        console.error('\n❌ ERROR during seeding:', error.message);
        throw error;
    }
}

// Run the seed
seedHierarchy()
    .then(() => {
        console.log('🎉 Seeding process finished!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Fatal error:', error);
        process.exit(1);
    });

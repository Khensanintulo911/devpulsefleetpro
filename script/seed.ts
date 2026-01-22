import { db, pool, dbPromise } from '../server/db';
import bcrypt from 'bcrypt';

const testUsers = [
  {
    email: 'admin@fleet.com',
    password: 'Password123!',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    phone: '555-0001',
  },
  {
    email: 'manager@fleet.com',
    password: 'Password123!',
    firstName: 'Manager',
    lastName: 'User',
    role: 'manager',
    phone: '555-0002',
  },
  {
    email: 'driver1@fleet.com',
    password: 'Password123!',
    firstName: 'John',
    lastName: 'Driver',
    role: 'driver',
    phone: '555-0003',
  },
  {
    email: 'driver2@fleet.com',
    password: 'Password123!',
    firstName: 'Jane',
    lastName: 'Driver',
    role: 'driver',
    phone: '555-0004',
  },
  {
    email: 'driver3@fleet.com',
    password: 'Password123!',
    firstName: 'Mike',
    lastName: 'Driver',
    role: 'driver',
    phone: '555-0005',
  },
  {
    email: 'tech1@fleet.com',
    password: 'Password123!',
    firstName: 'Tech',
    lastName: 'One',
    role: 'technician',
    phone: '555-0006',
  },
  {
    email: 'tech2@fleet.com',
    password: 'Password123!',
    firstName: 'Tech',
    lastName: 'Two',
    role: 'technician',
    phone: '555-0007',
  },
];

async function seedDatabase() {
  try {
    // Wait for DB to initialize
    await dbPromise;

    if (!db) {
      throw new Error('Database not initialized');
    }

    console.log('[Seed] Starting database seeding...');

    const { users } = await import('../shared/schema');
    const { drizzle } = await import('drizzle-orm');

    for (const testUser of testUsers) {
      try {
        // Check if user already exists
        const existingUser = await db.query.users.findFirst({
          where: (u: any) => u.email === testUser.email,
        });

        if (existingUser) {
          console.log(`[Seed] User ${testUser.email} already exists, skipping...`);
          continue;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(testUser.password, 10);

        // Create user
        const newUser = await db.insert(users).values({
          email: testUser.email,
          password: hashedPassword,
          firstName: testUser.firstName,
          lastName: testUser.lastName,
          role: testUser.role,
          phone: testUser.phone,
          isActive: true,
          emailVerified: true, // Pre-verified for testing
        }).returning({ id: users.id });

        const createdUser = newUser[0];
        console.log(`[Seed] ✓ Created user: ${testUser.email} (${testUser.role})`);

        // If driver or technician, create driver record
        if (testUser.role === 'driver' || testUser.role === 'technician') {
          const { drivers } = await import('../shared/schema');
          await db.insert(drivers).values({
            userId: createdUser.id,
            licenseNumber: `DL-${Math.random().toString(36).substring(7).toUpperCase()}`,
            licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          });
          console.log(`[Seed]   → Created driver record`);
        }
      } catch (error: any) {
        if (error.code === 'SQLITE_CONSTRAINT' || error.code === '23505') {
          console.log(`[Seed] User ${testUser.email} already exists`);
        } else {
          console.error(`[Seed] Error creating user ${testUser.email}:`, error);
        }
      }
    }

    console.log('[Seed] ✓ Database seeding completed!');
    console.log('\n[Seed] Test Credentials:');
    console.log('================================');
    testUsers.forEach((user) => {
      console.log(`Email: ${user.email}`);
      console.log(`Password: ${user.password}`);
      console.log(`Role: ${user.role}`);
      console.log('---');
    });
    process.exit(0);
  } catch (error) {
    console.error('[Seed] Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();

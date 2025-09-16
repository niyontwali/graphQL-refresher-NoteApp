import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding MySQL database...');

  try {
    // Test database connection
    console.log('Testing database connection...');
    await prisma.$connect();
    console.log('Database connected successfully');

    // Create admin user only - no other dummy data
    console.log('Creating admin user...');
    const adminPassword = await bcrypt.hash('admin123', 12);

    const admin = await prisma.user.upsert({
      where: { email: 'admin@gmail.com' },
      update: {},
      create: {
        email: 'admin@gmail.com',
        name: 'Admin User',
        password: adminPassword,
        role: 'ADMIN',
      },
    });

    console.log('Admin user created:', admin.email);
    console.log('Admin role:', admin.role);
    console.log('Database seeding completed - ready for user registration!');

  } catch (error) {
    console.error('Seeding error details:', error);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Seeding failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Seed Roles
  const roles = [
    { id: 'admin', name: 'Admin', description: 'Platform administrator with full access', isSystemRole: true, permissions: JSON.stringify(['*']) },
    { id: 'operations_manager', name: 'Operations Manager', description: 'Manages platform operations', isSystemRole: true, permissions: JSON.stringify(['users:read', 'users:write', 'properties:read', 'properties:write', 'kyc:read', 'kyc:write', 'tickets:read', 'tickets:write', 'settings:read']) },
    { id: 'staff', name: 'Staff', description: 'Support staff with limited access', isSystemRole: true, permissions: JSON.stringify(['tickets:read', 'tickets:write', 'kyc:read', 'properties:read']) },
    { id: 'seller', name: 'Seller', description: 'Property seller/listing creator', isSystemRole: false, permissions: JSON.stringify(['properties:create', 'properties:read', 'properties:update']) },
    { id: 'investor', name: 'Investor', description: 'Platform investor', isSystemRole: false, permissions: JSON.stringify(['investments:create', 'investments:read', 'properties:read', 'transactions:read']) },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { id: role.id },
      update: { name: role.name, description: role.description, isSystemRole: role.isSystemRole, permissions: role.permissions },
      create: role,
    });
  }
  console.log(`  Roles seeded: ${roles.map((r) => r.id).join(', ')}`);

  // 2. Seed Admin User
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@syntiantatlas.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { roleId: 'admin' },
    create: {
      email: adminEmail,
      passwordHash: adminPasswordHash,
      firstName: 'System',
      lastName: 'Admin',
      roleId: 'admin',
      kycStatus: 'verified',
      kycLevel: 3,
    },
  });
  console.log(`  Admin user seeded: ${admin.email} (ID: ${admin.id})`);

  // 3. Seed Default System Settings
  const settings = [
    { key: 'platform_name', value: 'Syntiant Atlas', description: 'Platform display name', category: 'general' },
    { key: 'platform_fee_percent', value: '2.5', description: 'Platform fee percentage on transactions', category: 'financial' },
    { key: 'min_investment_amount', value: '10000', description: 'Minimum investment amount in PKR', category: 'financial' },
    { key: 'max_investment_amount', value: '50000000', description: 'Maximum investment amount in PKR', category: 'financial' },
    { key: 'kyc_required_for_investment', value: 'true', description: 'Whether KYC verification is required before investing', category: 'compliance' },
    { key: 'maintenance_mode', value: 'false', description: 'Enable maintenance mode', category: 'general' },
    { key: 'support_whatsapp', value: '+923001234567', description: 'WhatsApp number for support contact', category: 'support' },
    { key: 'support_email', value: 'support@syntiantatlas.com', description: 'Support email address', category: 'support' },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value, description: setting.description, category: setting.category },
      create: setting,
    });
  }
  console.log(`  System settings seeded: ${settings.length} settings`);

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

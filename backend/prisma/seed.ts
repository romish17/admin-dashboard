import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\/]/g, '-')
    .replace(/\s+/g, '-');
}

async function main() {
  console.log('🌱 Seeding database...');

  // Create default admin user if not exists
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@nexushub.local';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  let adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!adminUser) {
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        username: 'admin',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'Sys',
        role: 'ADMIN',
      },
    });
    console.log('✅ Admin user created');
  } else {
    console.log('ℹ️  Admin user already exists');
  }

  // Default categories
  const defaultCategories = [
    { name: 'Développement', color: '#3b82f6', description: 'Scripts et outils de développement', icon: '💻' },
    { name: 'Infrastructure', color: '#ef4444', description: 'Serveurs, réseaux et cloud', icon: '🏗️' },
    { name: 'Sécurité', color: '#f59e0b', description: 'Sécurité et audit', icon: '🔒' },
    { name: 'Monitoring', color: '#22c55e', description: 'Supervision et alertes', icon: '📊' },
    { name: 'Base de données', color: '#8b5cf6', description: 'SQL, NoSQL et administration', icon: '🗄️' },
    { name: 'Automatisation', color: '#06b6d4', description: 'CI/CD et scripts automatisés', icon: '⚙️' },
    { name: 'Documentation', color: '#ec4899', description: 'Docs et procédures', icon: '📚' },
    { name: 'Windows', color: '#0ea5e9', description: 'Administration Windows', icon: '🪟' },
    { name: 'Linux', color: '#f97316', description: 'Administration Linux', icon: '🐧' },
    { name: 'Réseau', color: '#14b8a6', description: 'Configuration réseau', icon: '🌐' },
  ];

  for (const cat of defaultCategories) {
    const slug = slugify(cat.name);
    // Check if category already exists (for global categories with null section)
    const existing = await prisma.category.findFirst({
      where: {
        userId: adminUser.id,
        slug: slug,
        section: null,
      },
    });
    if (!existing) {
      await prisma.category.create({
        data: {
          name: cat.name,
          slug: slug,
          color: cat.color,
          description: cat.description,
          icon: cat.icon,
          userId: adminUser.id,
          section: null,
        },
      });
    }
  }
  console.log('✅ Default categories created');

  // Default tags
  const defaultTags = [
    { name: 'PowerShell', color: '#012456' },
    { name: 'Bash', color: '#4eaa25' },
    { name: 'Python', color: '#3776ab' },
    { name: 'Docker', color: '#2496ed' },
    { name: 'Kubernetes', color: '#326ce5' },
    { name: 'Ansible', color: '#ee0000' },
    { name: 'Terraform', color: '#7b42bc' },
    { name: 'Git', color: '#f05032' },
    { name: 'SQL', color: '#cc2927' },
    { name: 'API', color: '#009688' },
    { name: 'Backup', color: '#ff9800' },
    { name: 'Zabbix', color: '#d40000' },
    { name: 'Nginx', color: '#009639' },
    { name: 'Apache', color: '#d22128' },
    { name: 'SSL-TLS', color: '#721c24' },
    { name: 'Firewall', color: '#c62828' },
    { name: 'Active Directory', color: '#0078d4' },
    { name: 'VMware', color: '#607078' },
    { name: 'Azure', color: '#0089d6' },
    { name: 'AWS', color: '#ff9900' },
    { name: 'Production', color: '#dc2626' },
    { name: 'Staging', color: '#f59e0b' },
    { name: 'Test', color: '#22c55e' },
    { name: 'Urgent', color: '#ef4444' },
    { name: 'A revoir', color: '#8b5cf6' },
  ];

  for (const tag of defaultTags) {
    const slug = slugify(tag.name);
    // Check if tag already exists (for global tags with null section)
    const existing = await prisma.tag.findFirst({
      where: {
        userId: adminUser.id,
        slug: slug,
        section: null,
      },
    });
    if (!existing) {
      await prisma.tag.create({
        data: {
          name: tag.name,
          slug: slug,
          color: tag.color,
          userId: adminUser.id,
          section: null,
        },
      });
    }
  }
  console.log('✅ Default tags created');

  // Default project
  await prisma.project.upsert({
    where: { id: 'default-project' },
    update: {},
    create: {
      id: 'default-project',
      name: 'Projet par défaut',
      description: 'Projet principal pour organiser vos tâches',
      color: '#8b5cf6',
      status: 'ACTIVE',
      userId: adminUser.id,
    },
  });
  console.log('✅ Default project created');

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

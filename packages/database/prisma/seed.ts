import { PrismaClient, Currency, ProjectStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding...');

  // 1. Categories
  const categories = [
    { name: 'Education', slug: 'education', icon: 'BookOpen' },
    { name: 'Environment', slug: 'environment', icon: 'Leaf' },
    { name: 'Health', slug: 'health', icon: 'HeartPulse' },
    { name: 'Emergency', slug: 'emergency', icon: 'AlertCircle' },
    { name: 'Community', slug: 'community', icon: 'Users' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  // 2. Dummy Projects (Create 20)
  const categoryRecs = await prisma.category.findMany();
  
  for (let i = 1; i <= 20; i++) {
    const randomCat = categoryRecs[Math.floor(Math.random() * categoryRecs.length)];
    const target = BigInt(Math.floor(Math.random() * 5000000) + 100000); // 1k to 50k
    
    await prisma.project.create({
      data: {
        title: `Impact Project ${i}: ${randomCat.name} Initiative`,
        slug: `impact-project-${i}`,
        description: `This is a detailed description for project ${i}. It aims to solve critical issues in the ${randomCat.name} sector.`,
        shortDesc: `Solving ${randomCat.name} issues one step at a time.`,
        targetAmount: target,
        raisedAmount: BigInt(0), // Start empty
        currency: Currency.NGN,
        status: ProjectStatus.ACTIVE,
        categoryId: randomCat.id,
        location: 'Lagos, Nigeria',
        tags: ['Verified', 'Urgent'],
      }
    });
  }

  console.log('✅ Seeding Complete');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedNews() {
    console.log('Seeding news data...');

    const newsData = [
        {
            title: 'Welcome to the new Rewards Program!',
            content: 'We are excited to announce the launch of our new employee rewards system. This platform allows you to earn points for your achievements and redeem them for exciting rewards. Start exploring today and see what you can earn!',
            description: 'We are excited to launch our new employee rewards system.',
            coverImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=300&fit=crop',
            status: 'PUBLISHED' as const,
            publishedAt: new Date('2025-12-01'),
            createdBy: 'Admin'
        },
        {
            title: 'Q4 Goals Achieved',
            content: 'Congratulations to all team members! We have successfully achieved our Q4 targets. This is a testament to everyone\'s hard work and dedication. Special thanks to all departments for their outstanding performance.',
            description: 'Great job everyone on hitting the Q4 targets.',
            coverImage: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop',
            status: 'DRAFT' as const,
            publishedAt: null,
            createdBy: 'Admin'
        },
        {
            title: 'New Rewards Added!',
            content: 'We have added exciting new rewards to our catalog including premium headphones, gift cards, and exclusive experiences. Check out the Rewards section to see what\'s new and start planning your redemptions!',
            description: 'Check out the latest additions to our rewards catalog.',
            coverImage: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=400&h=300&fit=crop',
            status: 'PUBLISHED' as const,
            publishedAt: new Date('2025-12-15'),
            createdBy: 'Admin'
        }
    ];

    for (const news of newsData) {
        await prisma.news.create({ data: news });
        console.log(`Created: ${news.title}`);
    }

    console.log('✅ News seeding completed!');
}

seedNews()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

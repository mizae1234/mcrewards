import { PrismaClient, RewardStatus } from '@prisma/client';

const prisma = new PrismaClient();

const sampleRewards = [
    {
        name: 'Sony WH-1000XM5',
        description: 'Premium wireless noise-canceling headphones with 30-hour battery life',
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300',
        category: 'Electronics',
        pointsCost: 5000,
        stock: 10,
        isPhysical: true,
        status: RewardStatus.ACTIVE
    },
    {
        name: 'Starbucks Gift Card 500 THB',
        description: 'Digital gift card for Starbucks Thailand - code sent via email',
        imageUrl: 'https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=300',
        category: 'Vouchers',
        pointsCost: 500,
        stock: 100,
        isPhysical: false,
        status: RewardStatus.ACTIVE
    },
    {
        name: 'Apple AirPods Pro 2',
        description: 'Active noise cancellation, spatial audio, MagSafe charging case',
        imageUrl: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=300',
        category: 'Electronics',
        pointsCost: 3500,
        stock: 15,
        isPhysical: true,
        status: RewardStatus.ACTIVE
    },
    {
        name: 'Netflix 3-Month Subscription',
        description: 'Premium Netflix subscription for 3 months - code delivered digitally',
        imageUrl: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=300',
        category: 'Entertainment',
        pointsCost: 800,
        stock: 50,
        isPhysical: false,
        status: RewardStatus.ACTIVE
    },
    {
        name: 'McDonald\'s Merchandise Bag',
        description: 'Limited edition McDonald\'s branded tote bag with exclusive design',
        imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300',
        category: 'Merchandise',
        pointsCost: 200,
        stock: 30,
        isPhysical: true,
        status: RewardStatus.ACTIVE
    }
];

async function main() {
    console.log('🌱 Seeding rewards...');

    for (const reward of sampleRewards) {
        const created = await prisma.reward.create({
            data: {
                ...reward,
                createdBy: 'seed',
                updatedBy: 'seed'
            }
        });
        console.log(`✅ Created: ${created.name}`);
    }

    console.log('\n🎉 Seeding completed!');
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

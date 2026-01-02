import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding data...');

    // Seed Categories
    const categories = [
        { name: 'Teamwork', description: 'Collaboration and team spirit', color: '#3B82F6', icon: '🤝' },
        { name: 'Innovation', description: 'Creative ideas and solutions', color: '#8B5CF6', icon: '💡' },
        { name: 'Customer Service', description: 'Outstanding customer care', color: '#10B981', icon: '⭐' },
        { name: 'Integrity', description: 'Honesty and ethical behavior', color: '#F59E0B', icon: '🛡️' },
        { name: 'Leadership', description: 'Guiding and inspiring others', color: '#EF4444', icon: '🚀' },
        { name: 'Hard Work', description: 'Dedication and perseverance', color: '#06B6D4', icon: '💪' },
    ];

    for (const cat of categories) {
        await prisma.rewardCategory.upsert({
            where: { name: cat.name },
            update: {},
            create: {
                ...cat,
                createdBy: 'system',
                updatedBy: 'system'
            }
        });
    }
    console.log('✓ Categories seeded');

    // Seed Employees
    const employees = [
        { employeeCode: 'E0001', email: 'john@mcdonalds.com', fullname: 'John Smith', position: 'Manager', businessUnit: 'HQ', department: 'Operations', branch: 'Bangkok Central', role: UserRole.Admin, quota: 10000 },
        { employeeCode: 'E0002', email: 'jane@mcdonalds.com', fullname: 'Jane Doe', position: 'Supervisor', businessUnit: 'Site', department: 'Marketing', branch: 'Bangkok Central', role: UserRole.MiddleManagement, quota: 5000 },
        { employeeCode: 'E0003', email: 'bob@mcdonalds.com', fullname: 'Bob Wilson', position: 'Staff', businessUnit: 'Site', department: 'Operations', branch: 'Bangkok Central', role: UserRole.Staff, quota: 2000 },
        { employeeCode: 'E0004', email: 'alice@mcdonalds.com', fullname: 'Alice Brown', position: 'Staff', businessUnit: 'Site', department: 'Marketing', branch: 'Chiang Mai', role: UserRole.Staff, quota: 2000 },
        { employeeCode: 'E0005', email: 'charlie@mcdonalds.com', fullname: 'Charlie Davis', position: 'Executive', businessUnit: 'HQ', department: 'Executive', branch: 'Bangkok Central', role: UserRole.Executive, quota: 20000 },
    ];

    for (const emp of employees) {
        await prisma.employee.upsert({
            where: { employeeCode: emp.employeeCode },
            update: {},
            create: {
                ...emp,
                pointsBalance: Math.floor(Math.random() * 1000),
                avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(emp.fullname)}`
            }
        });
    }
    console.log('✓ Employees seeded');

    console.log('Seeding completed!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

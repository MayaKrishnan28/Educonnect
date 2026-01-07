
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.user.findMany({
            select: { email: true, role: true, name: true }
        });
        const content = users.map(u => `Email: ${u.email} | Role: ${u.role}`).join('\n');
        fs.writeFileSync('users.txt', content);
        console.log('Done');
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();

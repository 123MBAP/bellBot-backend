import bcrypt from 'bcryptjs';
import { prisma } from '../db/prisma.js';
import { UsersRepository } from '../modules/users/users.repository.js';

async function main() {
    const email = 'admin@mbi.com';
    const password = 'MbiAdmin2026';

    const passwordHash = await bcrypt.hash(password, 12);

    const usersRepo = new UsersRepository();
    const user = await usersRepo.upsertAdmin(email, passwordHash, { name: 'Admin', phone: '' });

    // eslint-disable-next-line no-console
    console.log(`Seeded admin: ${user.email} (${user.role})`);
}

main()
    .catch((err) => {
        // eslint-disable-next-line no-console
        console.error(err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

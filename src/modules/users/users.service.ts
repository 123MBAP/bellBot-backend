import { UsersRepository } from './users.repository.js';
import { z } from 'zod';

const updateProfileSchema = z.object({
    name: z.string().trim().max(120).optional(),
    phone: z.string().trim().max(32).optional(),
});

export class UsersService {
    constructor(private readonly repo: UsersRepository) { }

    async getById(userId: string) {
        return this.repo.getById(userId);
    }

    async updateProfile(userId: string, input: unknown) {
        const parsed = updateProfileSchema.parse(input);
        if (parsed.name == null && parsed.phone == null) {
            throw new Error('No changes provided');
        }
        return this.repo.updateProfile(userId, parsed);
    }

    async listCustomers() {
        return this.repo.listCustomers();
    }
}

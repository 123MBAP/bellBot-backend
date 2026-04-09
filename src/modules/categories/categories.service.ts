import { z } from 'zod';
import { CategoriesRepository } from './categories.repository.js';

export const createCategorySchema = z.object({
    name: z.string().trim().min(1).max(50),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export class CategoriesService {
    constructor(private readonly repo: CategoriesRepository) { }

    async listAll() {
        return this.repo.listAll();
    }

    async create(input: unknown) {
        const parsed = createCategorySchema.parse(input);

        const existing = await this.repo.findByName(parsed.name);
        if (existing) {
            return existing;
        }

        return this.repo.create(parsed);
    }
}

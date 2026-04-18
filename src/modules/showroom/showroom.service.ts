import { z } from 'zod';
import { ShowroomRepository } from './showroom.repository.js';

const productLinkSchema = z
    .string()
    .min(1)
    .refine((v) => v.startsWith('/product/'), { message: 'productLink must start with /product/' });

const baseSchema = z.object({
    title: z.string().min(1),
    productLink: productLinkSchema,
    videoUrl: z.string().url(),
    isActive: z.boolean().optional(),
});

export const createShowroomVideoSchema = baseSchema;
export const updateShowroomVideoSchema = baseSchema.partial();

export class ShowroomService {
    constructor(private readonly repo: ShowroomRepository) { }

    async listPublic() {
        return this.repo.listPublic();
    }

    async listAdmin() {
        return this.repo.listAdmin();
    }

    async create(input: unknown) {
        const parsed = createShowroomVideoSchema.parse(input);
        return this.repo.create(parsed);
    }

    async update(id: string, input: unknown) {
        const parsed = updateShowroomVideoSchema.parse(input);
        return this.repo.update(id, parsed);
    }

    async delete(id: string) {
        return this.repo.delete(id);
    }
}

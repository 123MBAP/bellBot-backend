import { z } from 'zod';
import { AdvertsRepository } from './adverts.repository.js';

const productLinkSchema = z
    .string()
    .min(1)
    .refine((v) => v.startsWith('/product/'), { message: 'productLink must start with /product/' });

const baseAdvertSchema = z.object({
    title: z.string().min(1),
    productLink: productLinkSchema,
    mediaType: z.enum(['IMAGE', 'VIDEO']).default('IMAGE'),
    imageUrl: z.string().url().optional(),
    imagePublicId: z.string().min(1).optional(),
    videoUrl: z.string().url().optional(),
    isActive: z.boolean().optional(),
});

export const createAdvertSchema = baseAdvertSchema.superRefine((val, ctx) => {
    if (val.mediaType === 'IMAGE') {
        if (!val.imageUrl) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['imageUrl'], message: 'imageUrl is required for IMAGE adverts' });
    }
    if (val.mediaType === 'VIDEO') {
        if (!val.videoUrl) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['videoUrl'], message: 'videoUrl is required for VIDEO adverts' });
    }
});

export const updateAdvertSchema = baseAdvertSchema.partial().superRefine((val, ctx) => {
    if (val.mediaType === 'IMAGE') {
        if (val.videoUrl) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['videoUrl'], message: 'videoUrl is not allowed for IMAGE adverts' });
    }
    if (val.mediaType === 'VIDEO') {
        if (val.imageUrl) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['imageUrl'], message: 'imageUrl is not allowed for VIDEO adverts' });
    }
});

export class AdvertsService {
    constructor(private readonly repo: AdvertsRepository) { }

    async listPublic() {
        return this.repo.listPublic();
    }

    async listAdmin() {
        return this.repo.listAdmin();
    }

    async create(input: unknown) {
        const parsed = createAdvertSchema.parse(input);
        return this.repo.create(parsed);
    }

    async update(id: string, input: unknown) {
        const parsed = updateAdvertSchema.parse(input);
        return this.repo.update(id, parsed);
    }

    async delete(id: string) {
        return this.repo.delete(id);
    }

    async getById(id: string) {
        return this.repo.getById(id);
    }
}

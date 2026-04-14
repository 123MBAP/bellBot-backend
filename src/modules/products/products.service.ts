import { z } from 'zod';
import { ProductsRepository } from './products.repository.js';

const baseProductSchema = z.object({
    name: z.string().min(1),
    description: z.string().min(1),
    price: z.number().int().nonnegative(),
    currency: z.string().min(1).default('USD'),
    category: z.string().min(1).optional(),
    categoryId: z.string().min(1).optional(),
    inStock: z.boolean().default(true),
    isNew: z.boolean().default(false),
    productScroll: z.boolean().default(false),
    discount: z.number().int().min(1).max(90).optional(),
    sizes: z.array(z.string().min(1)).default(['Standard']),
    features: z.array(z.string().min(1)).default([]),
    imageUrls: z.array(z.string().url()).min(1),
    imagePublicIds: z.array(z.string().min(1)).min(1),
});

export const createProductSchema = baseProductSchema.superRefine((val, ctx) => {
    if (!val.category && !val.categoryId) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['categoryId'], message: 'Category is required' });
    }

    if (val.discount !== undefined && (val.discount < 1 || val.discount > 90)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['discount'], message: 'Discount must be between 1 and 90' });
    }
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = baseProductSchema.partial().superRefine((val, ctx) => {
    // For updates, allow missing category/categoryId, but validate if provided.
    if (val.categoryId !== undefined && !val.categoryId) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['categoryId'], message: 'Invalid categoryId' });
    }

    if (val.category !== undefined && !val.category) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['category'], message: 'Invalid category' });
    }

    if (val.discount !== undefined && (val.discount < 1 || val.discount > 90)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['discount'], message: 'Discount must be between 1 and 90' });
    }
});
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export class ProductsService {
    constructor(private readonly repo: ProductsRepository) { }

    async listAll() {
        return this.repo.listAll();
    }

    async getById(id: string) {
        return this.repo.getById(id);
    }

    async create(input: unknown) {
        const parsed = createProductSchema.parse(input);

        if (parsed.categoryId) {
            const category = await this.repo.getCategoryById(parsed.categoryId);
            if (!category) {
                throw new Error('Invalid categoryId');
            }

            return this.repo.create({
                ...parsed as any,
                category: category.name,
            });
        }

        return this.repo.create({
            ...parsed as any,
            category: parsed.category ?? 'Uncategorized',
        });
    }

    async update(id: string, input: unknown) {
        const parsed = updateProductSchema.parse(input);

        let categoryName: string | undefined;
        if (parsed.categoryId) {
            const category = await this.repo.getCategoryById(parsed.categoryId);
            if (!category) {
                throw new Error('Invalid categoryId');
            }
            categoryName = category.name;
        }

        return this.repo.update(id, {
            ...parsed as any,
            ...(categoryName ? { category: categoryName } : {}),
        });
    }

    async delete(id: string) {
        return this.repo.delete(id);
    }
}

import { prisma } from '../../db/prisma.js';

export type CreateProductInput = {
    name: string;
    description: string;
    price: number;
    currency: string;
    category: string;
    categoryId?: string;
    inStock: boolean;
    isNew: boolean;
    productScroll: boolean;
    discount?: number;
    sizes: string[];
    features: string[];
    imageUrl?: string; // Legacy field for compatibility during migration if needed, but we use imageUrls now
    imageUrls: string[];
    imagePublicIds: string[];
};

export class ProductsRepository {
    async listAll() {
        return prisma.product.findMany({
            orderBy: { createdAt: 'desc' },
            include: { categoryRel: true },
        });
    }

    async getById(id: string) {
        return prisma.product.findUnique({
            where: { id },
            include: { categoryRel: true },
        });
    }

    async getCategoryById(id: string) {
        return prisma.category.findUnique({ where: { id } });
    }

    async create(input: CreateProductInput) {
        const { imageUrl: _imageUrl, ...data } = input;
        return prisma.product.create({
            data: {
                ...data,
                categoryId: input.categoryId ?? null,
            },
        });
    }

    async update(id: string, input: Partial<CreateProductInput>) {
        const { imageUrl: _imageUrl, ...data } = input;
        return prisma.product.update({
            where: { id },
            data: {
                ...data,
                categoryId: input.categoryId === undefined ? undefined : (input.categoryId ?? null),
            },
        });
    }

    async delete(id: string) {
        return prisma.product.delete({
            where: { id },
        });
    }
}

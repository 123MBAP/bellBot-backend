import { prisma } from '../../db/prisma.js';

export type CreateCategoryInput = {
    name: string;
};

export class CategoriesRepository {
    async listAll() {
        return prisma.category.findMany({ orderBy: { name: 'asc' } });
    }

    async create(input: CreateCategoryInput) {
        return prisma.category.create({ data: input });
    }

    async findById(id: string) {
        return prisma.category.findUnique({ where: { id } });
    }

    async findByName(name: string) {
        return prisma.category.findUnique({ where: { name } });
    }
}

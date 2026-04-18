import { prisma } from '../../db/prisma.js';

const db = prisma as any;

const getAdvertModel = () => {
    const model = db?.advert;
    if (!model || typeof model.findMany !== 'function') {
        throw new Error('Prisma Client is missing model `advert`. Run `npm run prisma:generate` in backend (and `npm run prisma:migrate` if needed), then restart the backend server.');
    }
    return model;
};

export type AdvertMediaType = 'IMAGE' | 'VIDEO';

export type CreateAdvertInput = {
    title: string;
    productLink: string;
    mediaType: AdvertMediaType;
    imageUrl?: string | null;
    imagePublicId?: string | null;
    videoUrl?: string | null;
    isActive?: boolean;
};

export class AdvertsRepository {
    async listPublic() {
        const advert = getAdvertModel();
        return advert.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async listAdmin() {
        const advert = getAdvertModel();
        return advert.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    async getById(id: string) {
        const advert = getAdvertModel();
        return advert.findUnique({ where: { id } });
    }

    async create(input: CreateAdvertInput) {
        const advert = getAdvertModel();
        return advert.create({
            data: {
                title: input.title,
                productLink: input.productLink,
                mediaType: input.mediaType,
                imageUrl: input.imageUrl ?? null,
                imagePublicId: input.imagePublicId ?? null,
                videoUrl: input.videoUrl ?? null,
                isActive: input.isActive ?? true,
            },
        });
    }

    async update(id: string, input: Partial<CreateAdvertInput>) {
        const advert = getAdvertModel();
        return advert.update({
            where: { id },
            data: {
                title: input.title,
                productLink: input.productLink,
                mediaType: input.mediaType,
                imageUrl: input.imageUrl === undefined ? undefined : (input.imageUrl ?? null),
                imagePublicId: input.imagePublicId === undefined ? undefined : (input.imagePublicId ?? null),
                videoUrl: input.videoUrl === undefined ? undefined : (input.videoUrl ?? null),
                isActive: input.isActive,
            },
        });
    }

    async delete(id: string) {
        const advert = getAdvertModel();
        return advert.delete({
            where: { id },
        });
    }
}

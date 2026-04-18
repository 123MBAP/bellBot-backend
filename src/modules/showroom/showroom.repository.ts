import { prisma } from '../../db/prisma.js';

const db = prisma as any;

const getShowroomVideoModel = () => {
    const model = db?.showroomVideo;
    if (!model || typeof model.findMany !== 'function') {
        throw new Error('Prisma Client is missing model `showroomVideo`. Run `npm run prisma:generate` in backend (and `npm run prisma:migrate` if needed), then restart the backend server.');
    }
    return model;
};

export type CreateShowroomVideoInput = {
    title: string;
    productLink: string;
    videoUrl: string;
    isActive?: boolean;
};

export class ShowroomRepository {
    async listPublic() {
        const showroomVideo = getShowroomVideoModel();
        return showroomVideo.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async listAdmin() {
        const showroomVideo = getShowroomVideoModel();
        return showroomVideo.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    async create(input: CreateShowroomVideoInput) {
        const showroomVideo = getShowroomVideoModel();
        return showroomVideo.create({
            data: {
                title: input.title,
                productLink: input.productLink,
                videoUrl: input.videoUrl,
                isActive: input.isActive ?? true,
            },
        });
    }

    async update(id: string, input: Partial<CreateShowroomVideoInput>) {
        const showroomVideo = getShowroomVideoModel();
        return showroomVideo.update({
            where: { id },
            data: {
                title: input.title,
                productLink: input.productLink,
                videoUrl: input.videoUrl,
                isActive: input.isActive,
            },
        });
    }

    async delete(id: string) {
        const showroomVideo = getShowroomVideoModel();
        return showroomVideo.delete({
            where: { id },
        });
    }
}

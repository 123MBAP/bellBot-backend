import { prisma } from '../../db/prisma.js';

const db = prisma as any;

const getUiConfigModel = () => {
    const model = db?.uiConfig;
    if (!model || typeof model.findUnique !== 'function') {
        throw new Error(
            'Prisma Client is missing model `uiConfig`. Run `npm run prisma:generate` in backend (and `npm run prisma:migrate` if needed), then restart the backend server.'
        );
    }
    return model;
};

export type UiConfigRecord = {
    id: number;
    showroomHidden: boolean;
};

export class UiConfigRepository {
    async getOrCreateSingleton() {
        const uiConfig = getUiConfigModel();
        return uiConfig.upsert({
            where: { id: 1 },
            update: {},
            create: { id: 1, showroomHidden: true },
        }) as Promise<UiConfigRecord>;
    }

    async updateSingleton(input: { showroomHidden: boolean }) {
        const uiConfig = getUiConfigModel();
        return uiConfig.upsert({
            where: { id: 1 },
            update: { showroomHidden: input.showroomHidden },
            create: { id: 1, showroomHidden: input.showroomHidden },
        }) as Promise<UiConfigRecord>;
    }
}

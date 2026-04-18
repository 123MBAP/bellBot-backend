import { z } from 'zod';
import { UiConfigRepository } from './uiConfig.repository.js';

export const updateUiConfigSchema = z.object({
    showroomHidden: z.boolean(),
});

export class UiConfigService {
    constructor(private readonly repo: UiConfigRepository) { }

    async getPublicConfig() {
        const row = await this.repo.getOrCreateSingleton();
        return {
            showroomHidden: Boolean(row.showroomHidden),
        };
    }

    async updateConfig(input: unknown) {
        const parsed = updateUiConfigSchema.parse(input);
        const row = await this.repo.updateSingleton(parsed);
        return {
            showroomHidden: Boolean(row.showroomHidden),
        };
    }
}

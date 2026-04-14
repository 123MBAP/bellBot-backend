import { z } from 'zod';
import { SupportRepository } from './support.repository.js';

const createMessageSchema = z.object({
    message: z.string().trim().min(1).max(2000),
});

export type CreateMessageInput = z.infer<typeof createMessageSchema>;

export class SupportService {
    constructor(private readonly repo: SupportRepository) { }

    async createMessageForUser(userId: string, input: unknown) {
        const parsed = createMessageSchema.parse(input);
        return this.repo.createMessage({ userId, message: parsed.message, senderRole: 'CUSTOMER' });
    }

    async createMessageFromAdmin(adminId: string, userId: string, input: unknown) {
        const parsed = createMessageSchema.parse(input);
        return this.repo.createMessage({
            userId,
            message: parsed.message,
            senderRole: 'ADMIN',
            adminId,
        });
    }

    async listMyMessages(userId: string) {
        return this.repo.listMessagesForUser(userId);
    }

    async listAllForAdmin() {
        return this.repo.listAllMessagesForAdmin();
    }

    async listConversationSummariesForAdmin() {
        return this.repo.listConversationSummariesForAdmin();
    }

    async markConversationReadForAdmin(userId: string) {
        return this.repo.markConversationReadForAdmin(userId);
    }

    async markRead(messageId: string) {
        return this.repo.markRead(messageId);
    }
}

import { prisma } from '../../db/prisma.js';

export type SupportSenderRole = 'CUSTOMER' | 'ADMIN';

export type SupportConversationSummary = {
    userId: string;
    user: {
        id: string;
        email: string;
        name: string;
        phone: string;
        role: string;
    };
    lastMessage: string;
    lastAt: Date;
    unreadCount: number;
};

export class SupportRepository {
    async createMessage(input: { userId: string; message: string; senderRole: SupportSenderRole; adminId?: string | null }) {
        return prisma.supportMessage.create({
            data: {
                userId: input.userId,
                message: input.message,
                senderRole: input.senderRole as any,
                adminId: input.adminId ?? null,
            },
        });
    }

    async listMessagesForUser(userId: string) {
        return prisma.supportMessage.findMany({
            where: { userId },
            orderBy: { createdAt: 'asc' },
        });
    }

    async listConversationSummariesForAdmin(): Promise<SupportConversationSummary[]> {
        const recent = await prisma.supportMessage.findMany({
            orderBy: { createdAt: 'desc' },
            take: 500,
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        phone: true,
                        role: true,
                    },
                },
            },
        });

        const unreadCounts = await prisma.supportMessage.groupBy({
            by: ['userId'],
            where: {
                senderRole: 'CUSTOMER' as any,
                readAt: null,
            },
            _count: { _all: true },
        });

        const unreadMap = new Map<string, number>();
        for (const row of unreadCounts) {
            unreadMap.set(row.userId, row._count._all);
        }

        const seen = new Set<string>();
        const summaries: SupportConversationSummary[] = [];
        for (const msg of recent) {
            if (seen.has(msg.userId)) continue;
            seen.add(msg.userId);

            summaries.push({
                userId: msg.userId,
                user: msg.user as any,
                lastMessage: msg.message,
                lastAt: msg.createdAt,
                unreadCount: unreadMap.get(msg.userId) ?? 0,
            });
        }

        return summaries;
    }

    async markConversationReadForAdmin(userId: string) {
        return prisma.supportMessage.updateMany({
            where: {
                userId,
                senderRole: 'CUSTOMER' as any,
                readAt: null,
            },
            data: {
                readAt: new Date(),
            },
        });
    }

    async listAllMessagesForAdmin() {
        return prisma.supportMessage.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        phone: true,
                        role: true,
                    },
                },
            },
        });
    }

    async markRead(messageId: string) {
        return prisma.supportMessage.update({
            where: { id: messageId },
            data: {
                readAt: new Date(),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        phone: true,
                        role: true,
                    },
                },
            },
        });
    }
}

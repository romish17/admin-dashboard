import Parser from 'rss-parser';
import { prisma } from '../../config/database.js';
import { redis, REDIS_KEYS } from '../../config/redis.js';
import { NotFoundError } from '../../middleware/errorHandler.js';
import { PaginationParams, paginatedResponse, getPrismaSkipTake } from '../../utils/pagination.js';
import { logger } from '../../utils/logger.js';
import { z } from 'zod';

const parser = new Parser({
  timeout: 10000,
  headers: { 'User-Agent': 'AdminDashboard RSS Reader/1.0' },
});

export const createFeedSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  url: z.string().url(),
  refreshRate: z.number().int().min(300).max(86400).default(3600),
  isActive: z.boolean().default(true),
  showOnHome: z.boolean().default(true),
  categoryId: z.string().uuid().optional().nullable(),
});

export const updateFeedSchema = createFeedSchema.partial();

export const feedQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  isActive: z.string().optional().transform((v) => v === 'true'),
  showOnHome: z.string().optional().transform((v) => v === 'true'),
  categoryId: z.string().uuid().optional(),
});

export const itemQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('50'),
  feedId: z.string().uuid().optional(),
  isRead: z.string().optional().transform((v) => v === 'true'),
  isStarred: z.string().optional().transform((v) => v === 'true'),
});

export type CreateFeedInput = z.infer<typeof createFeedSchema>;
export type UpdateFeedInput = z.infer<typeof updateFeedSchema>;

class RssService {
  async findAllFeeds(userId: string, query: z.infer<typeof feedQuerySchema>) {
    const where: Record<string, unknown> = { userId };
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.showOnHome !== undefined) where.showOnHome = query.showOnHome;
    if (query.categoryId) where.categoryId = query.categoryId;

    const feeds = await prisma.rssFeed.findMany({
      where,
      orderBy: { title: 'asc' },
      include: {
        category: { select: { id: true, name: true, color: true } },
        _count: { select: { items: true } },
      },
    });

    // Get unread counts
    const feedsWithUnread = await Promise.all(
      feeds.map(async (feed) => {
        const unreadCount = await prisma.rssItem.count({
          where: { feedId: feed.id, isRead: false },
        });
        return { ...feed, unreadCount };
      })
    );

    return feedsWithUnread;
  }

  async findFeedById(id: string, userId: string) {
    const feed = await prisma.rssFeed.findFirst({
      where: { id, userId },
      include: { category: true },
    });
    if (!feed) throw new NotFoundError('RSS Feed', id);
    return feed;
  }

  async createFeed(userId: string, data: CreateFeedInput) {
    // Fetch feed to get site URL and validate
    try {
      const parsed = await parser.parseURL(data.url);
      const siteUrl = parsed.link || undefined;

      return prisma.rssFeed.create({
        data: {
          ...data,
          siteUrl,
          userId,
        },
      });
    } catch {
      // Create even if we can't fetch - user might fix URL later
      return prisma.rssFeed.create({
        data: { ...data, userId },
      });
    }
  }

  async updateFeed(id: string, userId: string, data: UpdateFeedInput) {
    await this.findFeedById(id, userId);
    return prisma.rssFeed.update({ where: { id }, data });
  }

  async deleteFeed(id: string, userId: string) {
    await this.findFeedById(id, userId);
    await prisma.rssFeed.delete({ where: { id } });
    return { success: true };
  }

  async refreshFeed(id: string, userId: string) {
    const feed = await this.findFeedById(id, userId);

    try {
      const parsed = await parser.parseURL(feed.url);

      // Update feed metadata
      await prisma.rssFeed.update({
        where: { id },
        data: {
          siteUrl: parsed.link || feed.siteUrl,
          lastFetchedAt: new Date(),
        },
      });

      // Upsert items
      const items = parsed.items || [];
      let newItems = 0;

      for (const item of items.slice(0, 100)) {
        const itemUrl = item.link || item.guid || '';
        if (!itemUrl) continue;

        const existingItem = await prisma.rssItem.findFirst({
          where: { feedId: id, url: itemUrl },
        });

        if (!existingItem) {
          await prisma.rssItem.create({
            data: {
              title: item.title || 'Untitled',
              description: item.contentSnippet || item.content?.substring(0, 500),
              content: item.content,
              url: itemUrl,
              author: item.creator || item.author,
              imageUrl: item.enclosure?.url,
              publishedAt: item.pubDate ? new Date(item.pubDate) : null,
              feedId: id,
            },
          });
          newItems++;
        }
      }

      // Invalidate cache
      await redis.del(REDIS_KEYS.rssCache(id));

      return { success: true, newItems, total: items.length };
    } catch (error) {
      logger.error(`Failed to refresh feed ${id}:`, error);
      throw new Error(`Failed to fetch RSS feed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async refreshAllFeeds(userId: string) {
    const feeds = await prisma.rssFeed.findMany({
      where: { userId, isActive: true },
    });

    const results = await Promise.allSettled(
      feeds.map((feed) => this.refreshFeed(feed.id, userId))
    );

    const summary = {
      total: feeds.length,
      success: results.filter((r) => r.status === 'fulfilled').length,
      failed: results.filter((r) => r.status === 'rejected').length,
    };

    return summary;
  }

  async findAllItems(userId: string, query: z.infer<typeof itemQuerySchema>, pagination: PaginationParams) {
    // First get user's feed IDs
    const userFeeds = await prisma.rssFeed.findMany({
      where: { userId },
      select: { id: true },
    });
    const feedIds = userFeeds.map((f) => f.id);

    const where: Record<string, unknown> = { feedId: { in: feedIds } };
    if (query.feedId) where.feedId = query.feedId;
    if (query.isRead !== undefined) where.isRead = query.isRead;
    if (query.isStarred !== undefined) where.isStarred = query.isStarred;

    const [items, total] = await Promise.all([
      prisma.rssItem.findMany({
        where,
        ...getPrismaSkipTake(pagination),
        orderBy: { publishedAt: 'desc' },
        include: {
          feed: { select: { id: true, title: true, icon: true } },
        },
      }),
      prisma.rssItem.count({ where }),
    ]);

    return paginatedResponse(items, total, pagination);
  }

  async markItemAsRead(id: string, userId: string) {
    const item = await this.findItemWithAuth(id, userId);
    return prisma.rssItem.update({
      where: { id: item.id },
      data: { isRead: true },
    });
  }

  async toggleItemStarred(id: string, userId: string) {
    const item = await this.findItemWithAuth(id, userId);
    return prisma.rssItem.update({
      where: { id: item.id },
      data: { isStarred: !item.isStarred },
    });
  }

  async markAllAsRead(userId: string, feedId?: string) {
    const userFeeds = await prisma.rssFeed.findMany({
      where: { userId },
      select: { id: true },
    });
    const feedIds = feedId ? [feedId] : userFeeds.map((f) => f.id);

    await prisma.rssItem.updateMany({
      where: { feedId: { in: feedIds }, isRead: false },
      data: { isRead: true },
    });

    return { success: true };
  }

  async getDashboardItems(userId: string, limit = 10) {
    const userFeeds = await prisma.rssFeed.findMany({
      where: { userId, isActive: true, showOnHome: true },
      select: { id: true },
    });

    const items = await prisma.rssItem.findMany({
      where: { feedId: { in: userFeeds.map((f) => f.id) } },
      orderBy: { publishedAt: 'desc' },
      take: limit,
      include: {
        feed: { select: { id: true, title: true, icon: true } },
      },
    });

    return items;
  }

  private async findItemWithAuth(itemId: string, userId: string) {
    const item = await prisma.rssItem.findUnique({
      where: { id: itemId },
      include: { feed: { select: { userId: true } } },
    });

    if (!item || item.feed.userId !== userId) {
      throw new NotFoundError('RSS Item', itemId);
    }

    return item;
  }

  async search(userId: string, query: string, limit = 10) {
    const userFeeds = await prisma.rssFeed.findMany({
      where: { userId },
      select: { id: true },
    });

    const items = await prisma.rssItem.findMany({
      where: {
        feedId: { in: userFeeds.map((f) => f.id) },
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      include: {
        feed: { select: { title: true } },
      },
    });

    return items.map((item) => ({
      id: item.id,
      type: 'rss' as const,
      title: item.title,
      description: item.description,
      tags: [],
      categories: [item.feed.title],
      createdAt: item.createdAt,
      updatedAt: item.createdAt,
    }));
  }
}

export const rssService = new RssService();

'use server';

import { db } from '@/lib/db';
import { Article, Comment, Rating, ArchivedArticle, User } from '@/lib/types';

// Article Actions
export async function getArticles(limit: number = 50, offset: number = 0): Promise<Article[]> {
    try {
        return await db.articles.list({ limit, offset });
    } catch (error) {
        console.error('getArticles error:', error);
        return [];
    }
}

export async function getArticleById(id: string): Promise<Article | null> {
    try {
        return await db.articles.findById(id);
    } catch (error) {
        console.error('getArticleById error:', error);
        return null;
    }
}

export async function searchArticles(query: string, limit: number = 50): Promise<Article[]> {
    try {
        return await db.articles.search(query, limit);
    } catch (error) {
        console.error('searchArticles error:', error);
        return [];
    }
}

export async function getRecommendations(userId: string, limit: number = 10): Promise<Article[]> {
    try {
        return await db.articles.getRecommendations(userId, limit);
    } catch (error) {
        console.error('getRecommendations error:', error);
        return [];
    }
}

// User Actions
export async function getUserThreads(userId: string): Promise<Comment[]> {
    try {
        return await db.comments.findThreads(userId);
    } catch (error) {
        console.error('getUserThreads error:', error);
        return [];
    }
}

export async function getUserById(userId: string): Promise<User | null> {
    try {
        return await db.users.findById(userId);
    } catch (error) {
        console.error('getUserById error:', error);
        return null;
    }
}

export async function updateUserProfile(userId: string, data: Partial<User>): Promise<User | null> {
    try {
        return await db.users.update(userId, data);
    } catch (error) {
        console.error('updateUserProfile error:', error);
        throw error;
    }
}


// Archive Actions
export async function getArchivedArticles(userId: string): Promise<Article[]> {
    try {
        const archived = await db.archived.findByUserId(userId);
        const articles: Article[] = [];
        for (const item of archived) {
            const article = await db.articles.findById(item.articleId);
            if (article) {
                articles.push(article);
            }
        }
        return articles;
    } catch (error) {
        console.error('getArchivedArticles error:', error);
        return [];
    }
}

export async function isArticleArchived(userId: string, articleId: string): Promise<boolean> {
    try {
        const archived = await db.archived.findByUserAndArticle(userId, articleId);
        return !!archived;
    } catch (error) {
        console.error('isArticleArchived error:', error);
        return false;
    }
}

export async function toggleArchiveArticle(userId: string, articleId: string): Promise<boolean> {
    try {
        const exists = await isArticleArchived(userId, articleId);
        if (exists) {
            await db.archived.delete(userId, articleId);
            return false; // Not archived anymore
        } else {
            await db.archived.create({ userId, articleId });
            return true; // Archived
        }
    } catch (error) {
        console.error('toggleArchiveArticle error:', error);
        throw error;
    }
}

// Comment Actions
export async function getCommentsByArticleId(articleId: string): Promise<Comment[]> {
    try {
        return await db.comments.findByArticleId(articleId);
    } catch (error) {
        console.error('getCommentsByArticleId error:', error);
        return [];
    }
}

export async function createComment(data: { userId: string; articleId: string; content: string; parentId?: string; isAnonymous?: boolean }) {
    try {
        return await db.comments.create({
            userId: data.userId,
            articleId: data.articleId,
            content: data.content,
            parentId: data.parentId,
            isAnonymous: data.isAnonymous || false,
            likes: 0,
            dislikes: 0,
            aiLabels: [],
        });
    } catch (error) {
        console.error('createComment error:', error);
        throw error;
    }
}

export async function getCommentById(id: string): Promise<Comment | null> {
    try {
        return await db.comments.findById(id);
    } catch (error) {
        console.error('getCommentById error:', error);
        return null;
    }
}

// AI Actions
import { analyzeComment } from '@/lib/ai';
import { AIAnalysis } from '@/lib/types';

export async function analyzeCommentAction(comment: string, context: string): Promise<AIAnalysis> {
    try {
        return await analyzeComment(comment, context);
    } catch (error) {
        console.error('analyzeCommentAction error:', error);
        // Fallback
        return {
            labels: [],
            confidence: 0,
            reasoning: 'Analysis failed'
        };
    }
}

import { generateSummaryForPaper } from '@/lib/summary';

export async function generatePaperSummary(paperId: string) {
    try {
        return await generateSummaryForPaper(paperId);
    } catch (error) {
        console.error('generatePaperSummary action error:', error);
        return { success: false, message: 'Internal server error' };
    }
}

// Rating Actions

// Rating Actions
export async function getRating(userId: string, articleId: string): Promise<number> {
    try {
        const rating = await db.ratings.findByUserAndArticle(userId, articleId);
        return rating ? rating.rating : 0;
    } catch (error) {
        console.error('getRating error:', error);
        return 0;
    }
}

export async function rateArticle(userId: string, articleId: string, rating: number) {
    try {
        return await db.ratings.create({ userId, articleId, rating });
    } catch (error) {
        console.error('rateArticle error:', error);
        throw error;
    }
}

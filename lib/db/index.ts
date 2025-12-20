// Database abstraction layer for easy transition to Supabase

import {
  User,
  Article,
  Comment,
  Rating,
  ArchivedArticle,
} from '../types';
import usersData from '../../data/users.json';
import articlesData from '../../data/articles.json';
import commentsData from '../../data/comments.json';
import ratingsData from '../../data/ratings.json';
import archivedData from '../../data/archived.json';

// Local in-memory storage (for development)
let users: User[] = usersData as User[];
let articles: Article[] = articlesData as Article[];
let comments: Comment[] = commentsData as Comment[];
let ratings: Rating[] = ratingsData as Rating[];
let archived: ArchivedArticle[] = archivedData as ArchivedArticle[];

// User operations
export const userDB = {
  async findByEmail(email: string): Promise<User | null> {
    return users.find(u => u.email === email) || null;
  },

  async findById(id: string): Promise<User | null> {
    return users.find(u => u.id === id) || null;
  },

  async create(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const newUser: User = {
      ...user,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    return newUser;
  },

  async update(id: string, updates: Partial<User>): Promise<User | null> {
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return null;
    users[index] = { ...users[index], ...updates };
    return users[index];
  },

  async list(): Promise<User[]> {
    return users;
  },
};

// Article operations
export const articleDB = {
  async findById(id: string): Promise<Article | null> {
    return articles.find(a => a.id === id) || null;
  },

  async list(options?: { limit?: number; offset?: number }): Promise<Article[]> {
    const { limit, offset = 0 } = options || {};
    const slice = articles.slice(offset, limit ? offset + limit : undefined);
    return slice;
  },

  async search(query: string): Promise<Article[]> {
    const lowerQuery = query.toLowerCase();
    return articles.filter(
      a =>
        a.title.toLowerCase().includes(lowerQuery) ||
        a.abstract.toLowerCase().includes(lowerQuery) ||
        a.authors.some(author => author.name.toLowerCase().includes(lowerQuery))
    );
  },

  async getByRating(minRating: number = 0): Promise<Article[]> {
    return articles
      .filter(a => a.averageRating >= minRating)
      .sort((a, b) => b.averageRating - a.averageRating);
  },

  async getRecommendations(userId: string, limit: number = 10): Promise<Article[]> {
    const user = await userDB.findById(userId);
    if (!user) return [];

    // Simple recommendation: high-rated articles matching user interests
    const interests = user.researchInterests.map(i => i.toLowerCase());

    const scored = articles.map(article => {
      let score = article.averageRating;

      // Boost score if matches interests
      const matchesInterest = interests.some(interest =>
        article.title.toLowerCase().includes(interest) ||
        article.abstract.toLowerCase().includes(interest)
      );

      if (matchesInterest) score += 2;

      return { article, score };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.article);
  },
};

// Comment operations
export const commentDB = {
  async findById(id: string): Promise<Comment | null> {
    return comments.find(c => c.id === id) || null;
  },

  async findByArticleId(articleId: string): Promise<Comment[]> {
    return comments.filter(c => c.articleId === articleId);
  },

  async findByUserId(userId: string): Promise<Comment[]> {
    return comments.filter(c => c.userId === userId);
  },

  async findThreads(userId: string): Promise<Comment[]> {
    // Find all root comments (no parentId) by the user
    return comments.filter(c => c.userId === userId && !c.parentId);
  },

  async findReplies(parentId: string): Promise<Comment[]> {
    return comments.filter(c => c.parentId === parentId);
  },

  async create(comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Comment> {
    const newComment: Comment = {
      ...comment,
      id: `comment-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    comments.push(newComment);
    return newComment;
  },

  async update(id: string, updates: Partial<Comment>): Promise<Comment | null> {
    const index = comments.findIndex(c => c.id === id);
    if (index === -1) return null;
    comments[index] = {
      ...comments[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return comments[index];
  },

  async delete(id: string): Promise<boolean> {
    const index = comments.findIndex(c => c.id === id);
    if (index === -1) return false;
    comments.splice(index, 1);
    return true;
  },
};

// Rating operations
export const ratingDB = {
  async findByArticleId(articleId: string): Promise<Rating[]> {
    return ratings.filter(r => r.articleId === articleId);
  },

  async findByUserAndArticle(userId: string, articleId: string): Promise<Rating | null> {
    return ratings.find(r => r.userId === userId && r.articleId === articleId) || null;
  },

  async create(rating: Omit<Rating, 'id' | 'createdAt'>): Promise<Rating> {
    // Check if rating already exists
    const existing = await this.findByUserAndArticle(rating.userId, rating.articleId);
    if (existing) {
      return this.update(existing.id, { rating: rating.rating });
    }

    const newRating: Rating = {
      ...rating,
      id: `rating-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    ratings.push(newRating);

    // Update article average rating
    await this.updateArticleRating(rating.articleId);

    return newRating;
  },

  async update(id: string, updates: Partial<Rating>): Promise<Rating> {
    const index = ratings.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Rating not found');
    ratings[index] = { ...ratings[index], ...updates };

    // Update article average rating
    await this.updateArticleRating(ratings[index].articleId);

    return ratings[index];
  },

  async updateArticleRating(articleId: string): Promise<void> {
    const articleRatings = await this.findByArticleId(articleId);
    if (articleRatings.length === 0) return;

    const sum = articleRatings.reduce((acc, r) => acc + r.rating, 0);
    const average = sum / articleRatings.length;

    const article = articles.find(a => a.id === articleId);
    if (article) {
      article.averageRating = Math.round(average * 10) / 10;
      article.totalRatings = articleRatings.length;
    }
  },
};

// Archived articles operations
export const archivedDB = {
  async findByUserId(userId: string): Promise<ArchivedArticle[]> {
    return archived.filter(a => a.userId === userId);
  },

  async findByUserAndArticle(userId: string, articleId: string): Promise<ArchivedArticle | null> {
    return archived.find(a => a.userId === userId && a.articleId === articleId) || null;
  },

  async create(archive: Omit<ArchivedArticle, 'id' | 'archivedAt'>): Promise<ArchivedArticle> {
    // Check if already archived
    const existing = await this.findByUserAndArticle(archive.userId, archive.articleId);
    if (existing) return existing;

    const newArchive: ArchivedArticle = {
      ...archive,
      id: `archive-${Date.now()}`,
      archivedAt: new Date().toISOString(),
    };
    archived.push(newArchive);
    return newArchive;
  },

  async delete(userId: string, articleId: string): Promise<boolean> {
    const index = archived.findIndex(a => a.userId === userId && a.articleId === articleId);
    if (index === -1) return false;
    archived.splice(index, 1);
    return true;
  },

  async getArchivedArticles(userId: string): Promise<Article[]> {
    const userArchived = await this.findByUserId(userId);
    const articleIds = userArchived.map(a => a.articleId);
    return articles.filter(a => articleIds.includes(a.id));
  },
};

// Export a unified db object for easier imports
export const db = {
  users: userDB,
  articles: articleDB,
  comments: commentDB,
  ratings: ratingDB,
  archived: archivedDB,
};

// Database abstraction layer - mirrors FastAPI's data access patterns
// Uses Supabase and Qdrant exactly as JourNet FastAPI does

import {
  User,
  Article,
  Comment,
  Rating,
  ArchivedArticle,
  Author,
} from '../types';
import { supabase } from '../server-db';
import bcrypt from 'bcryptjs';
import { getRandomOldDate } from '../utils';

// Qdrant client - lazy loaded to avoid SSR issues
let qdrantClient: any = null;
let COLLECTION_NAME = 'arxiv_papers';

async function getQdrantClient() {
  if (typeof window !== 'undefined' && !qdrantClient) {
    const { QdrantClient } = await import('@qdrant/js-client-rest');
    qdrantClient = new QdrantClient({
      url: 'https://ab493be3-1f1f-4d1b-9f6d-150d5daca89d.sa-east-1-0.aws.cloud.qdrant.io',
      apiKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOlt7ImNvbGxlY3Rpb24iOiJhcnhpdl9wYXBlcnMiLCJhY2Nlc3MiOiJydyJ9XX0.Lf7CmmjhkoxtGG7LT5WXo2QZipsdRR5Emjf8GOcEoE8',
    });
  }
  return qdrantClient;
}

// ============================================================================
// Password verification - mirrors FastAPI's loggin.py verify_password()
// ============================================================================

export async function verifyUserPassword(email: string, password: string): Promise<User | null> {
  // Mirrors: supabase.table("Users").select("id,name,email,password_hash").eq("email", data.email).execute()
  const { data, error } = await supabase
    .from('Users')
    .select('id, name, email, password_hash')
    .eq('email', email)
    .single();

  if (error || !data) return null;

  // Verify password using bcrypt - same as FastAPI's verify_password()
  const isValid = bcrypt.compareSync(password, data.password_hash);
  if (!isValid) return null;

  return {
    id: String(data.id),
    email: data.email,
    username: data.name,
    password: '',
    orcid: undefined,
    homeInstitution: undefined,
    nationality: undefined,
    age: undefined,
    gender: undefined,
    researchInterests: [],
    createdAt: new Date().toISOString(),
  };
}

// ============================================================================
// User operations - mirrors FastAPI's loggin.py
// Table: Users (id, name, email, password_hash)
// ============================================================================

export const userDB = {
  // Mirrors: supabase.table("Users").select("id,name,email,password_hash").eq("email", data.email).execute()
  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('Users')
      .select('id, name, email')
      .eq('email', email)
      .single();

    if (error || !data) return null;

    return {
      id: String(data.id),
      email: data.email,
      username: data.name,
      password: '', // Not exposed
      // Fields not in JourNet - use defaults
      orcid: undefined,
      homeInstitution: undefined,
      nationality: undefined,
      age: undefined,
      gender: undefined,
      researchInterests: [],
      createdAt: new Date().toISOString(),
    };
  },

  // Mirrors: supabase.table("Users").select("id,name,email").eq("id", user_id).execute()
  async findById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('Users')
      .select('id, name, email')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return {
      id: String(data.id),
      email: data.email,
      username: data.name,
      password: '',
      orcid: undefined,
      homeInstitution: undefined,
      nationality: undefined,
      age: undefined,
      gender: undefined,
      researchInterests: [],
      createdAt: new Date().toISOString(),
    };
  },

  // Mirrors: supabase.table("Users").insert(user_data).execute()
  // Uses bcrypt.hashpw() same as FastAPI's hash_password()
  async create(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    // Hash password using bcrypt - same as FastAPI's hash_password()
    const password_hash = bcrypt.hashSync(user.password, 10);

    const { data, error } = await supabase
      .from('Users')
      .insert({
        name: user.username,
        email: user.email,
        password_hash: password_hash,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error('Failed to create user');
    }

    return {
      id: String(data.id),
      email: data.email,
      username: data.name,
      password: '',
      orcid: undefined,
      homeInstitution: undefined,
      nationality: undefined,
      age: undefined,
      gender: undefined,
      researchInterests: [],
      createdAt: new Date().toISOString(),
    };
  },

  async update(id: string, updates: Partial<User>): Promise<User | null> {
    const updateData: Record<string, unknown> = {};
    if (updates.username) updateData.name = updates.username;
    if (updates.email) updateData.email = updates.email;

    const { data, error } = await supabase
      .from('Users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) return null;

    return {
      id: String(data.id),
      email: data.email,
      username: data.name,
      password: '',
      orcid: undefined,
      homeInstitution: undefined,
      nationality: undefined,
      age: undefined,
      gender: undefined,
      researchInterests: [],
      createdAt: new Date().toISOString(),
    };
  },

  async list(): Promise<User[]> {
    const { data, error } = await supabase
      .from('Users')
      .select('id, name, email');

    if (error || !data) return [];

    return data.map((user) => ({
      id: String(user.id),
      email: user.email,
      username: user.name,
      password: '',
      orcid: undefined,
      homeInstitution: undefined,
      nationality: undefined,
      age: undefined,
      gender: undefined,
      researchInterests: [],
      createdAt: new Date().toISOString(),
    }));
  },
};

// ============================================================================
// Article operations - mirrors FastAPI's reading_list.py and recommend.py
// Tables: Papers, Authors
// Qdrant collection: arxiv_papers
// ============================================================================

// Helper to get author names from author IDs
// Mirrors: supabase.table("Authors").select("id, name")
async function getAuthorNames(authorIds: number[]): Promise<Author[]> {
  if (!authorIds || authorIds.length === 0) return [];

  const { data, error } = await supabase
    .from('Authors')
    .select('id, name')
    .in('id', authorIds);

  if (error || !data) return [];

  return data.map((a) => ({
    name: a.name,
    orcid: undefined, // Not in JourNet
    email: undefined, // Not in JourNet
  }));
}

// Map Supabase Papers table row to Article type
async function mapPaperToArticle(paper: Record<string, unknown>): Promise<Article> {
  // Get author names from author IDs
  const authorIds = (paper.authors as number[]) || [];
  const authors = await getAuthorNames(authorIds);

  return {
    id: String(paper.id),
    title: (paper.title as string) || '',
    authors: authors,
    abstract: (paper.abstract as string) || '',
    publishDate: (paper.updated_date as string) || getRandomOldDate(),
    pdfUrl: undefined, // Not in JourNet
    doi: (paper.doi as string) || undefined,
    citation: `${authors.map((a) => a.name).join(', ')} ${(paper.journal_ref as string) || ''}`,
    content: [], // Not in JourNet - use default
    averageRating: 0, // Calculated from Ratings table
    totalRatings: 0, // Calculated from Ratings table
    aiSummary: (paper.comments_summary as string) || undefined,
    categories: Array.isArray(paper.categories) ? (paper.categories as string[]) : (typeof paper.categories === 'string' ? (paper.categories as string).split(' ') : []),
    createdAt: (paper.updated_date as string) || new Date().toISOString(),
  };
}

// Map Qdrant paper payload to Article type
// Mirrors FastAPI's recommend.py mapping
function mapQdrantPayloadToArticle(id: string | number, payload: Record<string, unknown>): Article {
  // Parse authors string to Author array (same as FastAPI)
  const authorsStr = (payload.authors as string) || '';
  const authors: Author[] = [];
  if (authorsStr) {
    const authorsSplit = authorsStr.split(', ');
    for (const authorName of authorsSplit) {
      authors.push({ name: authorName.trim(), orcid: undefined, email: undefined });
    }
  }

  return {
    id: String(id),
    title: (payload.title as string) || '',
    authors: authors,
    abstract: (payload.abstract as string) || '',
    publishDate: (payload.updated_date as string) || getRandomOldDate(),
    pdfUrl: undefined,
    doi: (payload.doi as string) || undefined,
    citation: `${authors.map((a) => a.name).join(', ')} ${(payload.journal_ref as string) || ''}`,
    content: [],
    averageRating: 0,
    totalRatings: 0,
    aiSummary: undefined,
    categories: Array.isArray(payload.categories) ? (payload.categories as string[]) : (typeof payload.categories === 'string' ? (payload.categories as string).split(' ') : []),
    createdAt: new Date().toISOString(),
  };
}

export const articleDB = {
  // Mirrors: supabase.table("Papers").select("*").eq("id", paper_id).execute()
  async findById(id: string): Promise<Article | null> {
    const { data, error } = await supabase
      .from('Papers')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    const article = await mapPaperToArticle(data);

    // Get ratings - mirrors FastAPI's ratings.py pattern
    const { data: ratingsData } = await supabase
      .from('Ratings')
      .select('rating')
      .eq('paperid', id);

    if (ratingsData && ratingsData.length > 0) {
      const ratings = ratingsData.map((r) => r.rating);
      const average = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      article.averageRating = Math.round(average * 100) / 100;
      article.totalRatings = ratings.length;
    }

    return article;
  },

  // Mirrors: supabase.table("Papers").select("*").in_("id", paper_ids).execute()
  async list(options?: { limit?: number; offset?: number }): Promise<Article[]> {
    const { limit = 50, offset = 0 } = options || {};

    const { data, error } = await supabase
      .from('Papers')
      .select('*')
      .range(offset, offset + limit - 1);

    if (error || !data) return [];

    const articles: Article[] = [];
    for (const paper of data) {
      articles.push(await mapPaperToArticle(paper));
    }
    return articles;
  },

  // Simple text search in Papers table
  async search(query: string, limit: number = 50): Promise<Article[]> {
    const { data, error } = await supabase
      .from('Papers')
      .select('*')
      .or(`title.ilike.%${query}%,abstract.ilike.%${query}%,categories.ilike.%${query}%`)
      .limit(limit);

    if (error || !data) return [];

    const articles: Article[] = [];
    for (const paper of data) {
      articles.push(await mapPaperToArticle(paper));
    }
    return articles;
  },

  // Get papers by minimum rating
  async getByRating(minRating: number = 0): Promise<Article[]> {
    // Mirrors FastAPI's get_top_rated_papers pattern from ratings.py
    const { data: ratingsData } = await supabase
      .from('Ratings')
      .select('paperid, rating');

    if (!ratingsData) return [];

    // Calculate average ratings per paper
    const paperRatings: Record<number, number[]> = {};
    for (const rating of ratingsData) {
      const paperId = rating.paperid;
      if (!paperRatings[paperId]) {
        paperRatings[paperId] = [];
      }
      paperRatings[paperId].push(rating.rating);
    }

    // Filter by minimum rating
    const qualifyingPaperIds: number[] = [];
    const paperAverages: Record<number, { avg: number; count: number }> = {};

    for (const [paperId, ratings] of Object.entries(paperRatings)) {
      const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      if (avg >= minRating) {
        qualifyingPaperIds.push(parseInt(paperId));
        paperAverages[parseInt(paperId)] = { avg, count: ratings.length };
      }
    }

    if (qualifyingPaperIds.length === 0) return [];

    const { data: papersData } = await supabase
      .from('Papers')
      .select('*')
      .in('id', qualifyingPaperIds);

    if (!papersData) return [];

    const articles: Article[] = [];
    for (const paper of papersData) {
      const article = await mapPaperToArticle(paper);
      const stats = paperAverages[paper.id];
      if (stats) {
        article.averageRating = Math.round(stats.avg * 100) / 100;
        article.totalRatings = stats.count;
      }
      articles.push(article);
    }

    return articles.sort((a, b) => b.averageRating - a.averageRating);
  },

  // Get recommendations using Qdrant
  // Mirrors FastAPI's recommend.py RecommendationEngine with full weighting logic
  async getRecommendations(userId: string, limit: number = 10): Promise<Article[]> {
    try {
      const articlesMap = new Map<string, Article>();

      // 1. Fetch all user interactions
      const [commentsResult, readingListResult, ratingsResult] = await Promise.all([
        supabase.from('Discussion').select('articleId').eq('userId', userId),
        supabase.from('ReadingList').select('paperid').eq('userid', userId),
        supabase.from('Ratings').select('paperid, rating').eq('userid', userId),
      ]);

      const positiveIds: number[] = [];
      const negativeIds: number[] = [];

      const addWeighted = (id: number, weight: number) => {
        if (!id) return;
        const targetArray = weight > 0 ? positiveIds : negativeIds;
        const absWeight = Math.abs(weight);
        for (let i = 0; i < absWeight; i++) {
          targetArray.push(id);
        }
      };

      if (commentsResult.data) {
        for (const comment of commentsResult.data) {
          addWeighted(Number(comment.articleId), 1);
        }
      }

      if (readingListResult.data) {
        for (const list of readingListResult.data) {
          const paperIds = list.paperid || [];
          for (const id of paperIds) {
            addWeighted(Number(id), 2);
          }
        }
      }

      if (ratingsResult.data) {
        for (const r of ratingsResult.data) {
          const id = Number(r.paperid);
          const rating = r.rating;
          if (rating === 5) addWeighted(id, 3);
          else if (rating === 4) addWeighted(id, 2);
          else if (rating === 3) addWeighted(id, 1);
          else if (rating === 1) addWeighted(id, -1);
        }
      }

      // 2. Try Qdrant if we have positive signals
      const client = await getQdrantClient();
      if (client && positiveIds.length > 0) {
        try {
          const recommendations = await client.recommend(COLLECTION_NAME, {
            positive: positiveIds,
            negative: negativeIds,
            limit: limit,
            strategy: 'best_score',
            with_payload: true,
          });

          for (const result of recommendations) {
            const article = mapQdrantPayloadToArticle(
              result.id,
              result.payload as Record<string, unknown>
            );
            if (!articlesMap.has(article.id)) {
              articlesMap.set(article.id, article);
            }
          }
        } catch (e) {
          console.error('Qdrant initial recommend failed', e);
        }
      }

      // 3. Fallback: Top Rated papers if < limit
      if (articlesMap.size < limit) {
        try {
          const topRated = await this.getByRating(3.5);
          for (const article of topRated) {
            if (articlesMap.size >= limit) break;
            if (!articlesMap.has(article.id)) {
              articlesMap.set(article.id, article);
            }
          }
        } catch (e) {
          console.error('Top rated fallback failed', e);
        }
      }

      // 4. Fallback: Keyword Search based on found papers
      if (articlesMap.size < limit && articlesMap.size > 0) {
        try {
          const keywords = new Set<string>();
          for (const article of articlesMap.values()) {
            article.categories.forEach(c => keywords.add(c));
            article.title.split(' ')
              .filter(w => w.length > 4)
              .forEach(w => keywords.add(w.replace(/[^a-zA-Z]/g, '')));
          }

          for (const term of Array.from(keywords)) {
            if (articlesMap.size >= limit) break;
            const searchResults = await this.search(term, limit);
            for (const result of searchResults) {
              if (articlesMap.size >= limit) break;
              if (!articlesMap.has(result.id)) {
                articlesMap.set(result.id, result);
              }
            }
          }
        } catch (err) {
          console.error('Keyword fallback failed', err);
        }
      }

      // 5. Last Fallback: Generic Search
      if (articlesMap.size < limit) {
        const genericTerms = ["learning", "science", "network", "system", "data", "quantum", "neural"];
        for (const term of genericTerms) {
          if (articlesMap.size >= limit) break;
          const results = await this.search(term, limit);
          for (const r of results) {
            if (articlesMap.size >= limit) break;
            if (!articlesMap.has(r.id)) {
              articlesMap.set(r.id, r);
            }
          }
        }
      }

      // 6. Absolute Fallback: Just get any papers from the DB
      if (articlesMap.size < limit) {
        try {
          const lastResort = await this.list({ limit: limit * 2 });
          for (const r of lastResort) {
            if (articlesMap.size >= limit) break;
            if (!articlesMap.has(r.id)) {
              articlesMap.set(r.id, r);
            }
          }
        } catch (e) {
          console.error('Last resort fallback failed', e);
        }
      }

      return Array.from(articlesMap.values()).slice(0, limit);
    } catch (error) {
      console.error('getRecommendations error:', error);
      return this.getByRating(4.0);
    }
  },
};

// ============================================================================
// Comment operations - mirrors FastAPI's comment.py
// Table: Discussion (id, parent, userId, isAnonymous, onReview, comment, upVotes, downVotes, articleId, created_at, last_updated)
// ============================================================================

/**
 * Calculate comment labels based on likes count
 * Mapping: more likes = better quality
 * - >= 10 likes → meaningful
 * - >= 5 likes → critical
 * - >= 3 likes → helpful
 * - >= 2 likes → non-sense
 * - >= 1 like → useless
 */
function getLabelFromLikes(likes: number): import('../types').CommentLabel[] {
  if (likes >= 10) {
    return ['meaningful'];
  } else if (likes >= 5) {
    return ['critical'];
  } else if (likes >= 3) {
    return ['helpful'];
  } else if (likes >= 2) {
    return ['non-sense'];
  } else if (likes >= 1) {
    return ['useless'];
  }
  return []; // No label for 0 likes
}

function mapDiscussionToComment(row: Record<string, unknown>): Comment {
  const likes = (row.upVotes as number) || 0;

  return {
    id: String(row.id),
    articleId: String(row.articleId),
    userId: String(row.userId),
    parentId: row.parent ? String(row.parent) : undefined,
    content: (row.comment as string) || '',
    isAnonymous: (row.isAnonymous as boolean) || false,
    aiLabels: getLabelFromLikes(likes), // Assign labels based on likes
    createdAt: (row.created_at as string) || new Date().toISOString(),
    updatedAt: (row.last_updated as string) || (row.created_at as string) || new Date().toISOString(),
    likes: likes,
    dislikes: (row.downVotes as number) || 0,
  };
}

export const commentDB = {
  // Mirrors: supabase.table("Discussion").select("*").eq("id", comment_id).execute()
  async findById(id: string): Promise<Comment | null> {
    const { data, error } = await supabase
      .from('Discussion')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return mapDiscussionToComment(data);
  },

  // Mirrors: supabase.table("Discussion").select("*").eq("articleId", article_id).order("created_at", desc=True).execute()
  async findByArticleId(articleId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('Discussion')
      .select('*')
      .eq('articleId', articleId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map(mapDiscussionToComment);
  },

  async findByUserId(userId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('Discussion')
      .select('*')
      .eq('userId', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map(mapDiscussionToComment);
  },

  // Find root comments (no parent) by user
  async findThreads(userId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('Discussion')
      .select('*')
      .eq('userId', userId)
      .is('parent', null)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map(mapDiscussionToComment);
  },

  async findReplies(parentId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('Discussion')
      .select('*')
      .eq('parent', parentId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map(mapDiscussionToComment);
  },

  // Mirrors: supabase.table("Discussion").insert(comment_data).execute()
  async create(comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Comment> {
    const insertData: Record<string, unknown> = {
      userId: comment.userId,
      isAnonymous: comment.isAnonymous,
      onReview: false,
      comment: comment.content,
      upVotes: comment.likes || 0,
      downVotes: comment.dislikes || 0,
      articleId: parseInt(comment.articleId),
      last_updated: new Date().toISOString(),
    };

    // Only add parent if it's a reply (mirrors FastAPI logic)
    if (comment.parentId) {
      insertData.parent = parseInt(comment.parentId);
    }

    const { data, error } = await supabase
      .from('Discussion')
      .insert(insertData)
      .select()
      .single();

    if (error || !data) {
      throw new Error('Failed to create comment');
    }

    return mapDiscussionToComment(data);
  },

  // Mirrors: supabase.table("Discussion").update(update_data).eq("id", comment_id).execute()
  async update(id: string, updates: Partial<Comment>): Promise<Comment | null> {
    const updateData: Record<string, unknown> = {
      last_updated: new Date().toISOString(),
    };

    if (updates.content !== undefined) updateData.comment = updates.content;
    if (updates.likes !== undefined) updateData.upVotes = updates.likes;
    if (updates.dislikes !== undefined) updateData.downVotes = updates.dislikes;
    if (updates.isAnonymous !== undefined) updateData.isAnonymous = updates.isAnonymous;

    const { data, error } = await supabase
      .from('Discussion')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) return null;

    return mapDiscussionToComment(data);
  },

  // Mirrors: supabase.table("Discussion").delete().eq("id", comment_id).execute()
  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('Discussion')
      .delete()
      .eq('id', id);

    return !error;
  },
};

// ============================================================================
// Rating operations - mirrors FastAPI's ratings.py
// Table: Ratings (id, paperid, userid, rating, created_at)
// ============================================================================

export const ratingDB = {
  // Mirrors: supabase.table("Ratings").select("*").eq("paperid", paper_id).execute()
  async findByArticleId(articleId: string): Promise<Rating[]> {
    const { data, error } = await supabase
      .from('Ratings')
      .select('*')
      .eq('paperid', articleId);

    if (error || !data) return [];

    return data.map((r) => ({
      id: String(r.id),
      articleId: String(r.paperid),
      userId: String(r.userid),
      rating: r.rating,
      createdAt: r.created_at || new Date().toISOString(),
    }));
  },

  // Mirrors: supabase.table("Ratings").select("*").eq("userid", ...).eq("paperid", ...).execute()
  async findByUserAndArticle(userId: string, articleId: string): Promise<Rating | null> {
    const { data, error } = await supabase
      .from('Ratings')
      .select('*')
      .eq('userid', userId)
      .eq('paperid', articleId)
      .single();

    if (error || !data) return null;

    return {
      id: String(data.id),
      articleId: String(data.paperid),
      userId: String(data.userid),
      rating: data.rating,
      createdAt: data.created_at || new Date().toISOString(),
    };
  },

  // Mirrors: supabase.table("Ratings").insert(rating_data).execute()
  async create(rating: Omit<Rating, 'id' | 'createdAt'>): Promise<Rating> {
    // Check if already exists (mirrors FastAPI logic)
    const existing = await this.findByUserAndArticle(rating.userId, rating.articleId);
    if (existing) {
      return this.update(existing.id, { rating: rating.rating });
    }

    const { data, error } = await supabase
      .from('Ratings')
      .insert({
        userid: rating.userId,
        paperid: parseInt(rating.articleId),
        rating: rating.rating,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error('Failed to create rating');
    }

    return {
      id: String(data.id),
      articleId: String(data.paperid),
      userId: String(data.userid),
      rating: data.rating,
      createdAt: data.created_at || new Date().toISOString(),
    };
  },

  // Mirrors: supabase.table("Ratings").update({"rating": ...}).eq("id", rating_id).execute()
  async update(id: string, updates: Partial<Rating>): Promise<Rating> {
    const updateData: Record<string, unknown> = {};
    if (updates.rating !== undefined) updateData.rating = updates.rating;

    const { data, error } = await supabase
      .from('Ratings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error('Failed to update rating');
    }

    return {
      id: String(data.id),
      articleId: String(data.paperid),
      userId: String(data.userid),
      rating: data.rating,
      createdAt: data.created_at || new Date().toISOString(),
    };
  },

  // No-op since we calculate ratings on the fly
  async updateArticleRating(_articleId: string): Promise<void> {
    // Ratings are calculated dynamically when fetching articles
  },
};

// ============================================================================
// Archived articles operations - uses ReadingList table
// Table: ReadingList (id, userid, name, paperid, created_at)
// Uses a special list named "Archived"
// ============================================================================

export const archivedDB = {
  // Get archived papers for user
  async findByUserId(userId: string): Promise<ArchivedArticle[]> {
    const { data, error } = await supabase
      .from('ReadingList')
      .select('*')
      .eq('userid', userId)
      .eq('name', 'Archived');

    if (error || !data || data.length === 0) return [];

    const list = data[0];
    const paperIds = (list.paperid as number[]) || [];

    return paperIds.map((paperId) => ({
      id: `archive-${userId}-${paperId}`,
      userId: userId,
      articleId: String(paperId),
      archivedAt: list.created_at || new Date().toISOString(),
    }));
  },

  async findByUserAndArticle(userId: string, articleId: string): Promise<ArchivedArticle | null> {
    const archived = await this.findByUserId(userId);
    return archived.find((a) => a.articleId === articleId) || null;
  },

  // Add to "Archived" reading list
  async create(archive: Omit<ArchivedArticle, 'id' | 'archivedAt'>): Promise<ArchivedArticle> {
    // Check if Archived list exists
    const { data: lists } = await supabase
      .from('ReadingList')
      .select('*')
      .eq('userid', archive.userId)
      .eq('name', 'Archived');

    const articleIdNum = parseInt(archive.articleId);

    if (!lists || lists.length === 0) {
      // Create new Archived list
      const { data: newList } = await supabase
        .from('ReadingList')
        .insert({
          userid: archive.userId,
          name: 'Archived',
          paperid: [articleIdNum],
        })
        .select()
        .single();

      return {
        id: `archive-${archive.userId}-${archive.articleId}`,
        userId: archive.userId,
        articleId: archive.articleId,
        archivedAt: newList?.created_at || new Date().toISOString(),
      };
    }

    // Add to existing list
    const list = lists[0];
    const currentPapers = (list.paperid as number[]) || [];

    if (!currentPapers.includes(articleIdNum)) {
      const updatedPapers = [...currentPapers, articleIdNum];

      await supabase
        .from('ReadingList')
        .update({ paperid: updatedPapers })
        .eq('id', list.id);
    }

    return {
      id: `archive-${archive.userId}-${archive.articleId}`,
      userId: archive.userId,
      articleId: archive.articleId,
      archivedAt: list.created_at || new Date().toISOString(),
    };
  },

  // Remove from "Archived" reading list
  async delete(userId: string, articleId: string): Promise<boolean> {
    const { data: lists } = await supabase
      .from('ReadingList')
      .select('*')
      .eq('userid', userId)
      .eq('name', 'Archived');

    if (!lists || lists.length === 0) return false;

    const list = lists[0];
    const currentPapers = (list.paperid as number[]) || [];
    const articleIdNum = parseInt(articleId);
    const updatedPapers = currentPapers.filter((id) => id !== articleIdNum);

    const { error } = await supabase
      .from('ReadingList')
      .update({ paperid: updatedPapers })
      .eq('id', list.id);

    return !error;
  },

  // Get full article details for archived papers
  async getArchivedArticles(userId: string): Promise<Article[]> {
    const archived = await this.findByUserId(userId);
    const articleIds = archived.map((a) => parseInt(a.articleId));

    if (articleIds.length === 0) return [];

    // Mirrors: supabase.table("Papers").select("*").in_("id", paper_ids).execute()
    const { data: papersData } = await supabase
      .from('Papers')
      .select('*')
      .in('id', articleIds);

    if (!papersData) return [];

    const articles: Article[] = [];
    for (const paper of papersData) {
      articles.push(await mapPaperToArticle(paper));
    }
    return articles;
  },
};

// ============================================================================
// Unified db object for imports
// ============================================================================

export const db = {
  users: userDB,
  articles: articleDB,
  comments: commentDB,
  ratings: ratingDB,
  archived: archivedDB,
};

// Type definitions for the application

export interface User {
  id: string;
  email: string;
  username: string;
  password: string; // In production, this would be hashed
  orcid?: string;
  homeInstitution?: string;
  nationality?: string;
  age?: number;
  gender?: string;
  researchInterests: string[];
  createdAt: string;
}

export interface Author {
  name: string;
  orcid?: string;
  email?: string;
}

export interface Article {
  id: string;
  title: string;
  authors: Author[];
  abstract: string;
  publishDate: string;
  pdfUrl?: string;
  doi?: string;
  citation: string;
  content: ArticleSection[];
  averageRating: number;
  totalRatings: number;
  aiSummary?: string;
  createdAt: string;
}

export interface ArticleSection {
  title: string;
  content: string;
  subsections?: ArticleSection[];
}

export interface Comment {
  id: string;
  articleId: string;
  userId: string;
  parentId?: string; // For thread-based comments
  content: string;
  images?: string[];
  sectionReferences?: string[];
  isAnonymous: boolean;
  aiLabels: CommentLabel[];
  createdAt: string;
  updatedAt: string;
  likes: number;
  dislikes: number;
}

export type CommentLabel =
  | 'meaningful'
  | 'critical'
  | 'helpful'
  | 'non-sense'
  | 'useless'
  | 'irrational';

export interface Rating {
  id: string;
  articleId: string;
  userId: string;
  rating: number; // 1-5
  createdAt: string;
}

export interface ArchivedArticle {
  id: string;
  userId: string;
  articleId: string;
  archivedAt: string;
}

export interface UserThread {
  commentId: string;
  articleId: string;
  articleTitle: string;
  lastActivity: string;
  replyCount: number;
}

// For ChatGPT API integration
export interface AIAnalysis {
  labels: CommentLabel[];
  confidence: number;
  reasoning?: string;
}

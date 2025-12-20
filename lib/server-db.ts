// Server-side database module - only used in API routes
// Uses Supabase and Qdrant with secret keys (safe on server)

import { createClient } from '@supabase/supabase-js';
import { QdrantClient } from '@qdrant/js-client-rest';
import bcrypt from 'bcryptjs';

// Supabase client with secret key (Service Role)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Qdrant client with API key
const qdrantUrl = process.env.QDRANT_URL;
const qdrantApiKey = process.env.QDRANT_API_KEY;

if (!qdrantUrl || !qdrantApiKey) {
  throw new Error('Missing Qdrant environment variables');
}

export const qdrantClient = new QdrantClient({
  url: qdrantUrl,
  apiKey: qdrantApiKey,
});

export const QDRANT_COLLECTION = 'arxiv_papers';

// Hugging Face API
export const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY;
if (!HUGGING_FACE_API_KEY) {
  console.warn('Missing HUGGING_FACE_API_KEY environment variable. Summary generation will fail.');
}

// Helper to get author names from author IDs
export async function getAuthorNames(authorIds: number[]): Promise<{ name: string }[]> {
  if (!authorIds || authorIds.length === 0) return [];

  const { data, error } = await supabase
    .from('Authors')
    .select('id, name')
    .in('id', authorIds);

  if (error || !data) return [];

  return data.map((a) => ({ name: a.name }));
}

// Map Supabase Papers row to Article format
export async function mapPaperToArticle(paper: any) {
  const authorIds = paper.authors || [];
  const authors = await getAuthorNames(authorIds);

  return {
    id: String(paper.id),
    title: paper.title || '',
    authors: authors,
    abstract: paper.abstract || '',
    publishDate: paper.updated_date || new Date().toISOString(),
    doi: paper.doi || undefined,
    citation: `${authors.map((a) => a.name).join(', ')} ${paper.journal_ref || ''}`,
    content: [],
    averageRating: 0,
    totalRatings: 0,
    aiSummary: paper.comments_summary || undefined,
    createdAt: paper.updated_date || new Date().toISOString(),
  };
}

// Map Qdrant payload to Article format
export function mapQdrantPayloadToArticle(id: string | number, payload: any) {
  const authorsStr = payload.authors || '';
  const authors: { name: string }[] = [];
  if (authorsStr) {
    const authorsSplit = authorsStr.split(', ');
    for (const authorName of authorsSplit) {
      authors.push({ name: authorName.trim() });
    }
  }

  return {
    id: String(id),
    title: payload.title || '',
    authors: authors,
    abstract: payload.abstract || '',
    publishDate: new Date().toISOString(),
    doi: payload.doi || undefined,
    citation: `${authors.map((a) => a.name).join(', ')} ${payload.journal_ref || ''}`,
    content: [],
    averageRating: 0,
    totalRatings: 0,
    createdAt: new Date().toISOString(),
  };
}

// Password utilities
export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import { db } from '@/lib/db';
import { analyzeComment } from '@/lib/ai';
import { Article, Comment as CommentType } from '@/lib/types';

function CommentForm() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const articleId = searchParams?.get('articleId') || '';
  const parentId = searchParams?.get('parentId') || '';

  const [article, setArticle] = useState<Article | null>(null);
  const [parentComment, setParentComment] = useState<CommentType | null>(null);
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const loadArticleData = useCallback(async () => {
    if (!articleId) return;

    const articleData = await db.articles.findById(articleId);
    if (articleData) {
      setArticle(articleData);
    }

    if (parentId) {
      const parentData = await db.comments.findById(parentId);
      if (parentData) {
        setParentComment(parentData);
      }
    }
  }, [articleId, parentId]);

  useEffect(() => {
    if (articleId) {
      loadArticleData();
    }
  }, [articleId, loadArticleData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !article) return;

    if (content.trim().length < 10) {
      setError('Comment must be at least 10 characters long');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Analyze comment with AI
      const analysis = await analyzeComment(content, article.abstract);

      // Create comment
      const newComment = await db.comments.create({
        articleId: article.id,
        userId: user.id,
        parentId: parentId || undefined,
        content,
        isAnonymous,
        aiLabels: analysis.labels,
        likes: 0,
        dislikes: 0,
      });

      // Redirect to article page
      router.push(`/article/${article.id}`);
    } catch (err) {
      console.error('Error submitting comment:', err);
      setError('Failed to submit comment. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (authLoading || !user || !article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-4">
            {parentId ? 'Reply to Comment' : 'Start New Discussion Thread'}
          </h1>

          {/* Article Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-gray-800 mb-2">
              Discussing: {article.title}
            </h2>
            <p className="text-sm text-gray-600">
              {article.authors.map(a => a.name).join(', ')} • {new Date(article.publishDate).getFullYear()}
            </p>
          </div>

          {/* Parent Comment (if replying) */}
          {parentComment && (
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">Replying to:</p>
              <p className="text-gray-800">{parentComment.content}</p>
            </div>
          )}

          {/* Comment Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Your Comment
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Share your thoughts, insights, or questions about this paper..."
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Minimum 10 characters. Your comment will be analyzed for quality and relevance.
              </p>
            </div>

            <div className="mb-6">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Post anonymously
                </span>
              </label>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-4">
                {error}
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-yellow-800">
                  <strong>AI Quality Check:</strong> Your comment will be automatically analyzed for:
                  <ul className="list-disc list-inside mt-1 ml-2">
                    <li>Relevance to the paper content</li>
                    <li>Constructive and meaningful contribution</li>
                    <li>Quality of discussion</li>
                  </ul>
                  Labels like &quot;meaningful&quot;, &quot;critical&quot;, &quot;helpful&quot; will be assigned based on the analysis.
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:bg-gray-400"
              >
                {isSubmitting ? 'Publishing...' : 'Publish Comment'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md font-medium"
              >
                Cancel
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-3">Tips for Quality Comments:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>Reference specific sections or findings from the paper</li>
              <li>Share your experience implementing or testing the methods</li>
              <li>Ask thoughtful questions about methodology or results</li>
              <li>Provide constructive criticism with reasoning</li>
              <li>Compare with related work or alternative approaches</li>
              <li>Avoid off-topic or overly brief comments</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CommentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-xl">Loading...</div></div>}>
      <CommentForm />
    </Suspense>
  );
}
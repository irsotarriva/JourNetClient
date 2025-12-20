'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import NetworkBackground from '@/components/NetworkBackground';
import { getArticleById, getCommentById, createComment, analyzeCommentAction } from '@/app/actions';
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

  useEffect(() => {
    if (articleId) {
      loadArticleData();
    }
  }, [articleId]);

  const loadArticleData = async () => {
    if (!articleId) return;

    const articleData = await getArticleById(articleId);
    if (articleData) {
      setArticle(articleData);
    }

    if (parentId) {
      const parentData = await getCommentById(parentId);
      if (parentData) {
        setParentComment(parentData);
      }
    }
  };

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
      const analysis = await analyzeCommentAction(content, article.abstract);

      // Create comment
      await createComment({
        articleId: article.id,
        userId: user.id,
        parentId: parentId || undefined,
        content,
        isAnonymous,
      });

      // Redirect to article page (Action returns comment but we just redirect)
      router.push(`/article/${article.id}`);
    } catch (err) {
      console.error('Error submitting comment:', err);
      setError('Failed to submit comment. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (authLoading || !user || !article) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <NetworkBackground />
        <div className="relative z-10 text-xl font-medium text-gray-600 animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <NetworkBackground />
      <div className="relative z-10">
        <Navbar />

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-xl border border-white/40 p-8 animate-slide-up">
            <h1 className="text-3xl font-black mb-6 text-gray-900 border-b border-gray-200/60 pb-4">
              {parentId ? 'Reply to Comment' : 'Start New Discussion Thread'}
            </h1>

            {/* Article Info */}
            <div className="bg-white/40 border border-white/60 rounded-xl p-5 mb-8 shadow-sm">
              <h2 className="font-bold text-gray-800 mb-2 text-lg">
                Discussing: <span className="text-blue-700">{article.title}</span>
              </h2>
              <p className="text-sm text-gray-600 font-medium">
                {article.authors.map(a => a.name).join(', ')} • {new Date(article.publishDate).getFullYear()}
              </p>
            </div>

            {/* Parent Comment (if replying) */}
            {parentComment && (
              <div className="bg-blue-50/50 border-l-4 border-blue-500 p-5 mb-8 rounded-r-xl">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Replying to:</p>
                <div className="text-gray-800 italic bg-white/60 p-3 rounded-lg border border-blue-100">
                  "{parentComment.content}"
                </div>
              </div>
            )}

            {/* Comment Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="content" className="block text-sm font-bold text-gray-700 mb-2">
                  Your Comment
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={10}
                  className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all bg-white/70 backdrop-blur-sm outline-none font-medium text-gray-800 placeholder-gray-400 shadow-inner resize-y"
                  placeholder="Share your thoughts, insights, or questions about this paper..."
                  required
                />
                <p className="text-xs text-gray-500 mt-2 text-right font-medium">
                  {content.length} characters (Minimum 10)
                </p>
              </div>

              <div>
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition-all cursor-pointer"
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-700 group-hover:text-blue-700 transition-colors">
                    Post anonymously
                  </span>
                </label>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl text-sm font-bold animate-shake flex items-center">
                  <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {error}
                </div>
              )}

              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-100 rounded-xl p-5 mb-8">
                <div className="flex items-start">
                  <div className="bg-yellow-100 p-2 rounded-full mr-4 flex-shrink-0 text-yellow-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="text-sm text-yellow-900/80">
                    <strong className="block text-yellow-800 text-lg mb-1">AI Quality Check</strong>
                    <p className="mb-2">Your comment will be automatically analyzed for:</p>
                    <ul className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                      <li className="flex items-center bg-white/50 px-3 py-1.5 rounded-lg border border-yellow-100/50">
                        <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Relevance
                      </li>
                      <li className="flex items-center bg-white/50 px-3 py-1.5 rounded-lg border border-yellow-100/50">
                        <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Constructiveness
                      </li>
                      <li className="flex items-center bg-white/50 px-3 py-1.5 rounded-lg border border-yellow-100/50">
                        <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Discussion Quality
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 pt-4 border-t border-gray-200/50">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:transform-none"
                >
                  {isSubmitting ? 'Publishing...' : 'Publish Comment'}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-8 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-bold shadow-sm hover:shadow-md transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>

            <div className="mt-10 pt-8 border-t border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Tips for Quality Comments
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <h4 className="font-bold text-gray-700 mb-1">Be Specific</h4>
                  <p className="text-sm text-gray-500">Reference specific sections or findings from the paper to ground your discussion.</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <h4 className="font-bold text-gray-700 mb-1">Share Experience</h4>
                  <p className="text-sm text-gray-500">Provide insights from your own work or implementation attempts.</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <h4 className="font-bold text-gray-700 mb-1">Constructive Questions</h4>
                  <p className="text-sm text-gray-500">Ask thoughtful questions about methodology, results, or implications.</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <h4 className="font-bold text-gray-700 mb-1">Compare & Contextualize</h4>
                  <p className="text-sm text-gray-500">Discuss how this work relates to other alternatives or the broader field.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CommentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <NetworkBackground />
        <div className="relative z-10 text-xl font-medium text-gray-600 animate-pulse">Loading...</div>
      </div>
    }>
      <CommentForm />
    </Suspense>
  );
}

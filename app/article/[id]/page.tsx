'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import NetworkBackground from '@/components/NetworkBackground';
import StarRating from '@/components/StarRating';
import { fetchAPI } from '@/lib/api';

interface Paper {
  id: number;
  title: string;
  abstract: string;
  authors: number[];
  categories: string;
  journal_ref?: string;
  doi?: string;
  updated_date?: string;
  comments_summary?: string;
}

interface Comment {
  id: number;
  parent: number | null;
  userId: string;
  isAnonymous: boolean;
  onReview: boolean;
  comment: string;
  upVotes: number;
  downVotes: number;
  articleId: number;
  created_at: string;
  last_updated: string;
}

interface RatingInfo {
  average_rating: number;
  total_ratings: number;
  user_rating?: number;
}

export default function ArticlePage() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();
  const params = useParams();
  const articleId = params?.id as string;

  const [paper, setPaper] = useState<Paper | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [ratingInfo, setRatingInfo] = useState<RatingInfo | null>(null);
  const [userRating, setUserRating] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [existingRatingId, setExistingRatingId] = useState<number | null>(null);
  const [generatingAISummary, setGeneratingAISummary] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && articleId) {
      loadArticleData();
    }
  }, [user, articleId]);

  const loadArticleData = async () => {
    if (!user || !articleId) return;
    setLoading(true);

    try {
      // Fetch paper details
      const paperData = await fetchAPI(`/papers/${articleId}`);
      setPaper(paperData);

      // Check if AI summary exists, if not generate one
      if (!paperData.comments_summary && paperData.abstract) {
        generateAISummary(paperData);
      }

      // Fetch comments for this article
      try {
        const commentsData = await fetchAPI(`/comments/article/${articleId}`);
        setComments(commentsData.comments || []);
      } catch (e) {
        console.log('No comments found or error loading comments');
        setComments([]);
      }

      // Fetch rating info
      try {
        const avgRating = await fetchAPI(`/ratings/paper/${articleId}/average`);
        setRatingInfo(avgRating);
      } catch (e) {
        console.log('No ratings found');
        setRatingInfo({ average_rating: 0, total_ratings: 0 });
      }

      // Fetch user's rating for this paper
      try {
        const myRating = await fetchAPI(`/ratings/paper/${articleId}/my-rating`);
        setUserRating(myRating.rating || 0);
        setExistingRatingId(myRating.id || null);
      } catch (e) {
        setUserRating(0);
        setExistingRatingId(null);
      }
    } catch (error) {
      console.error('Error loading article:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAISummary = async (paperData: Paper) => {
    if (!articleId) return;
    setGeneratingAISummary(true);
    try {
      const result = await fetchAPI(`/summary/${articleId}/generate-summary`, {
        method: 'POST',
      });
      if (result && result.summary) {
        // Update the paper with the new summary
        setPaper(prev => prev ? { ...prev, comments_summary: result.summary } : prev);
      }
    } catch (error) {
      console.error('Error generating AI summary:', error);
    } finally {
      setGeneratingAISummary(false);
    }
  };

  const handleRate = async (rating: number) => {
    if (!user || !articleId || submittingRating) return;

    setSubmittingRating(true);
    try {
      if (existingRatingId) {
        // Update existing rating with PUT
        await fetchAPI(`/ratings/${existingRatingId}`, {
          method: 'PUT',
          body: JSON.stringify({ rating }),
        });
      } else {
        // Create new rating with POST
        const newRating = await fetchAPI('/ratings/', {
          method: 'POST',
          body: JSON.stringify({ paperid: parseInt(articleId), rating }),
        });
        setExistingRatingId(newRating.id);
      }
      setUserRating(rating);
      // Refresh rating info
      const avgRating = await fetchAPI(`/ratings/paper/${articleId}/average`);
      setRatingInfo(avgRating);
    } catch (error) {
      console.error('Error submitting rating:', error);
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !articleId) return;

    setSubmittingComment(true);
    try {
      await fetchAPI('/comments/', {
        method: 'POST',
        body: JSON.stringify({
          comment: newComment,
          articleId: parseInt(articleId),
          isAnonymous,
          onReview: false,
        }),
      });
      setNewComment('');
      setIsAnonymous(false);
      // Reload comments
      const commentsData = await fetchAPI(`/comments/article/${articleId}`);
      setComments(commentsData.comments || []);
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleVote = async (commentId: number, type: 'upvote' | 'downvote') => {
    try {
      await fetchAPI(`/comments/${commentId}/${type}`, { method: 'POST' });
      // Reload comments to get updated vote counts
      const commentsData = await fetchAPI(`/comments/article/${articleId}`);
      setComments(commentsData.comments || []);
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <NetworkBackground />
        <div className="relative z-10 text-xl text-gray-700">Loading...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <NetworkBackground />
        <div className="relative z-10 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <NetworkBackground />
        <div className="relative z-10 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xl text-gray-600">Article not found</p>
          <Link href="/home" className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-semibold">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const rootComments = comments.filter(c => !c.parent);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Network background */}
      <NetworkBackground />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="bg-white/40 backdrop-blur-md border-b border-white/30 shadow-lg">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Link href="/home">
                <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 cursor-pointer hover:scale-105 transition-transform">
                  JourNet
                </h1>
              </Link>
              <div className="flex items-center space-x-6">
                <Link
                  href="/explore"
                  className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Explore</span>
                </Link>
                <Link
                  href="/user"
                  className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>User</span>
                </Link>
                <span className="text-gray-700 font-medium">
                  Welcome, <span className="text-blue-600">{user.username}</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-red-600 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-6 py-8 max-w-5xl">
          {/* Back Button */}
          <Link href="/home" className="inline-flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors mb-6 group">
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Back to Search</span>
          </Link>

          {/* Article Header */}
          <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-xl p-8 mb-6 border border-white/40">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">{paper.title}</h1>

            {/* Categories */}
            {paper.categories && (
              <div className="flex flex-wrap gap-2 mb-4">
                {paper.categories.split(',').slice(0, 5).map((category, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 text-sm font-semibold rounded-full"
                  >
                    {category.trim()}
                  </span>
                ))}
              </div>
            )}

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-600">
              {paper.journal_ref && (
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span>{paper.journal_ref}</span>
                </div>
              )}
              {paper.doi && (
                <a
                  href={`https://doi.org/${paper.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                >
                  <span>DOI: {paper.doi}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
              {paper.updated_date && (
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{new Date(paper.updated_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {/* Rating Section */}
            <div className="mb-6 p-5 bg-white/50 rounded-xl border border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Average Rating */}
                <div className="flex items-center space-x-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Average Rating</p>
                    <div className="flex items-center space-x-2">
                      <StarRating rating={ratingInfo?.average_rating || 0} readonly size="md" />
                      <span className="text-lg font-bold text-gray-700">
                        {(ratingInfo?.average_rating || 0).toFixed(1)}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({ratingInfo?.total_ratings || 0} ratings)
                      </span>
                    </div>
                  </div>
                </div>

                {/* User's Rating - Interactive */}
                <div className="flex items-center space-x-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      {userRating > 0 ? 'Your Rating' : 'Rate this paper'}
                    </p>
                    <div className="flex items-center space-x-2">
                      <StarRating
                        rating={userRating}
                        onRate={handleRate}
                        size="md"
                      />
                      {submittingRating && (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      )}
                      {userRating > 0 && !submittingRating && (
                        <span className="text-sm text-green-600 font-medium">✓ Saved</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Abstract */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-3">Abstract</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{paper.abstract}</p>
            </div>

            {/* AI Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-blue-800 mb-2">AI Summary</h4>
                  {generatingAISummary ? (
                    <div className="flex items-center space-x-2 text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span>Generating AI summary...</span>
                    </div>
                  ) : paper.comments_summary ? (
                    <p className="text-gray-700">{paper.comments_summary}</p>
                  ) : (
                    <p className="text-gray-500 italic">No AI summary available for this paper.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/40">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Discussion ({comments.length})</h2>
            </div>

            {/* New Comment Form */}
            <form onSubmit={handleSubmitComment} className="mb-8">
              <div className="bg-white/70 rounded-xl p-4 border border-gray-200">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts on this paper..."
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-500 resize-none bg-white/80"
                  rows={4}
                />
                <div className="flex items-center justify-between mt-3">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">Post anonymously</span>
                  </label>
                  <button
                    type="submit"
                    disabled={!newComment.trim() || submittingComment}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingComment ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>
              </div>
            </form>

            {/* Comments List */}
            {rootComments.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-gray-500">No comments yet. Be the first to start a discussion!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {rootComments.map((comment) => (
                  <CommentCard
                    key={comment.id}
                    comment={comment}
                    allComments={comments}
                    onVote={handleVote}
                    articleId={articleId}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>


    </div>
  );
}

function CommentCard({
  comment,
  allComments,
  onVote,
  articleId,
}: {
  comment: Comment;
  allComments: Comment[];
  onVote: (id: number, type: 'upvote' | 'downvote') => void;
  articleId: string;
}) {
  const [showReplies, setShowReplies] = useState(false);
  const replies = allComments.filter((c) => c.parent === comment.id);

  return (
    <div className="bg-white/70 rounded-xl p-5 border border-gray-200 hover:shadow-md transition-all duration-200">
      {/* Comment Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
            {comment.isAnonymous ? '?' : 'U'}
          </div>
          <span className="font-semibold text-gray-800">
            {comment.isAnonymous ? 'Anonymous' : `User ${comment.userId.substring(0, 8)}`}
          </span>
          <span className="text-sm text-gray-500">
            {new Date(comment.created_at).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Comment Content */}
      <p className="text-gray-700 mb-4 whitespace-pre-wrap">{comment.comment}</p>

      {/* Actions */}
      <div className="flex items-center space-x-6 text-sm">
        <button
          onClick={() => onVote(comment.id, 'upvote')}
          className="flex items-center space-x-1 text-gray-600 hover:text-green-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
          <span className="font-medium">{comment.upVotes || 0}</span>
        </button>

        <button
          onClick={() => onVote(comment.id, 'downvote')}
          className="flex items-center space-x-1 text-gray-600 hover:text-red-600 transition-colors"
        >
          <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
          <span className="font-medium">{comment.downVotes || 0}</span>
        </button>

        {replies.length > 0 && (
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            {showReplies ? 'Hide' : 'Show'} {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
          </button>
        )}
      </div>

      {/* Replies */}
      {showReplies && replies.length > 0 && (
        <div className="ml-8 mt-4 space-y-3 border-l-2 border-blue-200 pl-4">
          {replies.map((reply) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              allComments={allComments}
              onVote={onVote}
              articleId={articleId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

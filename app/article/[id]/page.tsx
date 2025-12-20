'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import NetworkBackground from '@/components/NetworkBackground';
import StarRating from '@/components/StarRating';
import {
  getArticleById,
  getCommentsByArticleId,
  getRating,
  rateArticle,
  isArticleArchived,
  toggleArchiveArticle,
  generatePaperSummary
} from '@/app/actions';
import { Article, Comment, User, CommentLabel } from '@/lib/types';
import { getUserById } from '@/app/actions';

export default function ArticlePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const articleId = params?.id as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [userRating, setUserRating] = useState<number>(0);
  const [isArchived, setIsArchived] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [filterLabels, setFilterLabels] = useState<Set<CommentLabel>>(new Set());
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

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

    const articleData = await getArticleById(articleId);
    if (articleData) {
      setArticle(articleData);
    }

    const commentsData = await getCommentsByArticleId(articleId);
    setComments(commentsData);

    const rating = await getRating(user.id, articleId);
    setUserRating(rating);

    const archived = await isArticleArchived(user.id, articleId);
    setIsArchived(archived);
  };

  const handleRate = async (rating: number) => {
    if (!user || !articleId) return;
    await rateArticle(user.id, articleId, rating);
    setUserRating(rating);
    setShowRatingModal(false);
    await loadArticleData();
  };

  const toggleArchive = async () => {
    if (!user || !articleId) return;
    const newState = await toggleArchiveArticle(user.id, articleId);
    setIsArchived(newState);
  };

  const handleGenerateSummary = async () => {
    if (!user || !articleId) return;
    setIsGeneratingSummary(true);
    try {
      const result = await generatePaperSummary(articleId);
      if (result.success && result.summary) {
        // Refresh article data to show new summary
        await loadArticleData();
      } else {
        alert('Failed to generate summary: ' + result.message);
      }
    } catch (error) {
      console.error('Summary generation error:', error);
      alert('An error occurred while generating the summary.');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const toggleSection = (title: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(title)) {
      newExpanded.delete(title);
    } else {
      newExpanded.add(title);
    }
    setExpandedSections(newExpanded);
  };

  const toggleFilter = (label: CommentLabel) => {
    const newFilters = new Set(filterLabels);
    if (newFilters.has(label)) {
      newFilters.delete(label);
    } else {
      newFilters.add(label);
    }
    setFilterLabels(newFilters);
  };

  const filteredComments = filterLabels.size === 0
    ? comments
    : comments.filter(c => c.aiLabels.some(label => filterLabels.has(label)));

  if (authLoading || !user || !article) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <NetworkBackground />
        <div className="relative z-10 text-xl font-medium text-gray-600">Loading...</div>
      </div>
    );
  }

  const rootComments = filteredComments.filter(c => !c.parentId);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <NetworkBackground />
      <div className="relative z-10">
        <Navbar />

        <div className="container mx-auto px-6 py-8 max-w-5xl">
          {/* Article Header */}
          <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-xl border border-white/40 p-8 mb-8">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-6 leading-tight">{article.title}</h1>

            <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-gray-600">
              <div>
                <strong>Authors:</strong>{' '}
                {article.authors.map((author, idx) => (
                  <span key={idx}>
                    {author.name}
                    {author.orcid && (
                      <a
                        href={`https://orcid.org/${author.orcid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-1 text-blue-600 hover:underline"
                      >
                        (ORCID)
                      </a>
                    )}
                    {idx < article.authors.length - 1 && ', '}
                  </span>
                ))}
              </div>
              <div>
                <strong>Published:</strong> {new Date(article.publishDate).toLocaleDateString()}
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <StarRating rating={article.averageRating} readonly size="md" />
                <span className="text-sm text-gray-600">
                  ({article.totalRatings} ratings)
                </span>
                <button
                  onClick={() => setShowRatingModal(true)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  {userRating > 0 ? 'Update Rating' : 'Rate This Paper'}
                </button>
              </div>

              <div className="flex space-x-2">
                {article.pdfUrl && (
                  <a
                    href={article.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium shadow-sm"
                  >
                    View PDF
                  </a>
                )}
                <button
                  onClick={toggleArchive}
                  className={`px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-colors ${isArchived
                    ? 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                >
                  {isArchived ? 'Unarchive' : 'Archive'}
                </button>
              </div>
            </div>

            <div className="mb-6">
              <strong className="text-gray-700 block mb-2">Abstract:</strong>
              <p className="text-gray-600 leading-relaxed bg-white/40 p-4 rounded-xl border border-white/50">{article.abstract}</p>
            </div>

            {article.aiSummary ? (
              <div className="bg-blue-50/80 backdrop-blur-sm border border-blue-200 rounded-xl p-5 mb-4 shadow-sm">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-600 mt-1 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <div>
                    <strong className="text-blue-800 text-lg block mb-1">AI Summary of Discussion</strong>
                    <p className="text-blue-900/80 leading-relaxed">{article.aiSummary}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <button
                  onClick={handleGenerateSummary}
                  disabled={isGeneratingSummary}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 shadow-md ${isGeneratingSummary
                    ? 'bg-purple-100 text-purple-700 cursor-wait'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white hover:shadow-lg hover:scale-105'
                    }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>
                    {isGeneratingSummary
                      ? 'Generating AI Summary...'
                      : 'Generate AI Summary'}
                  </span>
                </button>
              </div>
            )}

            <div className="text-sm text-gray-500 italic mt-4 pt-4 border-t border-gray-200/50">
              Citation: {article.citation}
            </div>
          </div>

          {/* Article Content (Collapsible Sections) */}
          <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-xl border border-white/40 p-8 mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="w-2 h-8 bg-blue-600 rounded-full mr-3"></span>
              Paper Content
            </h2>
            {article.content.map((section, idx) => (
              <div key={idx} className="mb-4 border-b border-gray-200/60 pb-4 last:border-0">
                <button
                  onClick={() => toggleSection(section.title)}
                  className="flex items-center justify-between w-full text-left group"
                >
                  <h3 className="text-xl font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                    {section.title}
                  </h3>
                  <svg
                    className={`w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-transform ${expandedSections.has(section.title) ? 'transform rotate-180' : ''
                      }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <p className="text-gray-600 mt-2 line-clamp-2 pl-4 border-l-2 border-gray-200">
                  {section.content.substring(0, 150)}...
                </p>
                {expandedSections.has(section.title) && (
                  <div className="mt-4 text-gray-700 leading-relaxed bg-white/50 p-6 rounded-xl border border-white/40 shadow-inner">
                    <p className="whitespace-pre-wrap">{section.content}</p>
                    {section.subsections && (
                      <div className="ml-4 mt-6 space-y-6">
                        {section.subsections.map((sub, subIdx) => (
                          <div key={subIdx}>
                            <h4 className="font-bold text-gray-900 text-lg mb-2">{sub.title}</h4>
                            <p className="text-gray-600 whitespace-pre-wrap pl-4 border-l-2 border-blue-200">{sub.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Comments Section */}
          <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-xl border border-white/40 p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-800">Discussion ({comments.length})</h2>
              <Link
                href={`/comment/new?articleId=${articleId}`}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                Start New Thread
              </Link>
            </div>

            {/* Comment Filters */}
            <div className="mb-6 flex flex-wrap gap-2 items-center bg-white/40 p-4 rounded-xl border border-white/50">
              <span className="text-sm font-bold text-gray-700 mr-2 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filter Analysis:
              </span>
              {(['meaningful', 'critical', 'helpful', 'non-sense', 'useless', 'irrational'] as CommentLabel[]).map((label) => (
                <button
                  key={label}
                  onClick={() => toggleFilter(label)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 uppercase tracking-wide ${filterLabels.has(label)
                    ? 'bg-blue-600 text-white shadow-md transform scale-105'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {rootComments.length === 0 ? (
              <div className="text-center py-12 bg-white/40 rounded-xl border border-white/50 border-dashed">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-gray-500 text-lg font-medium">
                  No comments yet. Be the first to start a discussion!
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {rootComments.map((comment) => (
                  <CommentThread key={comment.id} comment={comment} allComments={filteredComments} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Rating Modal */}
        {showRatingModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl transform transition-all scale-100">
              <h3 className="text-2xl font-bold mb-6 text-center text-gray-800">Rate This Paper</h3>
              <div className="flex justify-center mb-8">
                <StarRating rating={userRating} onRate={handleRate} size="lg" />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowRatingModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CommentThread({ comment, allComments }: { comment: Comment; allComments: Comment[] }) {
  const [user, setUser] = useState<User | null>(null);
  const [showReplies, setShowReplies] = useState(false);

  useEffect(() => {
    if (!comment.isAnonymous) {
      getUserById(comment.userId).then(setUser);
    }
  }, [comment]);

  const replies = allComments.filter(c => c.parentId === comment.id);

  return (
    <div className="bg-white/50 border border-white/60 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-inner mr-3">
            {comment.isAnonymous ? 'A' : (user?.username?.[0]?.toUpperCase() || '?')}
          </div>
          <div>
            <div className="font-bold text-gray-900">
              {comment.isAnonymous ? 'Anonymous' : user?.username || 'Loading...'}
            </div>
            <div className="text-xs text-gray-500 font-medium">
              {new Date(comment.createdAt).toLocaleString()}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 justify-end max-w-[50%]">
          {comment.aiLabels.map((label, idx) => (
            <span
              key={idx}
              className={`px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${['meaningful', 'critical', 'helpful'].includes(label)
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-600 border border-red-100'
                }`}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="text-gray-800 mb-4 whitespace-pre-wrap leading-relaxed pl-13">
        {comment.content}
      </div>

      {comment.sectionReferences && comment.sectionReferences.length > 0 && (
        <div className="text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg inline-block border border-gray-100">
          <strong className="text-gray-800">References:</strong> {comment.sectionReferences.join(', ')}
        </div>
      )}

      <div className="flex items-center space-x-6 text-sm pt-4 border-t border-gray-100">
        <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition-colors group">
          <div className="p-1.5 rounded-full bg-gray-100 group-hover:bg-blue-50 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
          </div>
          <span className="font-semibold">{comment.likes} Likes</span>
        </button>

        <Link
          href={`/comment/new?articleId=${comment.articleId}&parentId=${comment.id}`}
          className="text-gray-500 hover:text-blue-600 font-bold transition-colors flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
          Reply
        </Link>

        {replies.length > 0 && (
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="text-blue-600 hover:text-blue-800 font-bold transition-colors ml-auto flex items-center"
          >
            {showReplies ? 'Hide' : 'Show'} {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
            <svg className={`w-4 h-4 ml-1 transform transition-transform ${showReplies ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      {showReplies && replies.length > 0 && (
        <div className="ml-4 mt-6 space-y-4 pl-4 border-l-2 border-blue-100">
          {replies.map((reply) => (
            <CommentThread key={reply.id} comment={reply} allComments={allComments} />
          ))}
        </div>
      )}
    </div>
  );
}

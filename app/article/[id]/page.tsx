'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import StarRating from '@/components/StarRating';
import { db } from '@/lib/db';
import { Article, Comment, User, CommentLabel } from '@/lib/types';

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

    const articleData = await db.articles.findById(articleId);
    if (articleData) {
      setArticle(articleData);
    }

    const commentsData = await db.comments.findByArticleId(articleId);
    setComments(commentsData);

    const rating = await db.ratings.findByUserAndArticle(user.id, articleId);
    if (rating) {
      setUserRating(rating.rating);
    }

    const archived = await db.archived.findByUserAndArticle(user.id, articleId);
    setIsArchived(!!archived);
  };

  const handleRate = async (rating: number) => {
    if (!user || !articleId) return;
    await db.ratings.create({ userId: user.id, articleId, rating });
    setUserRating(rating);
    setShowRatingModal(false);
    await loadArticleData();
  };

  const toggleArchive = async () => {
    if (!user || !articleId) return;
    if (isArchived) {
      await db.archived.delete(user.id, articleId);
      setIsArchived(false);
    } else {
      await db.archived.create({ userId: user.id, articleId });
      setIsArchived(true);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  const rootComments = filteredComments.filter(c => !c.parentId);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Article Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold mb-4">{article.title}</h1>

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
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium"
                >
                  View PDF
                </a>
              )}
              <button
                onClick={toggleArchive}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  isArchived
                    ? 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isArchived ? 'Unarchive' : 'Archive'}
              </button>
            </div>
          </div>

          <div className="mb-4">
            <strong className="text-gray-700">Abstract:</strong>
            <p className="text-gray-600 mt-2">{article.abstract}</p>
          </div>

          {article.aiSummary && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <div>
                  <strong className="text-blue-800">AI Summary of Community Discussion:</strong>
                  <p className="text-blue-900 mt-1">{article.aiSummary}</p>
                </div>
              </div>
            </div>
          )}

          <div className="text-sm text-gray-600">
            <strong>Citation:</strong> {article.citation}
          </div>
        </div>

        {/* Article Content (Collapsible Sections) */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Paper Content</h2>
          {article.content.map((section, idx) => (
            <div key={idx} className="mb-4 border-b border-gray-200 pb-4 last:border-0">
              <button
                onClick={() => toggleSection(section.title)}
                className="flex items-center justify-between w-full text-left"
              >
                <h3 className="text-lg font-semibold text-gray-800">
                  {section.title}
                </h3>
                <svg
                  className={`w-5 h-5 transition-transform ${
                    expandedSections.has(section.title) ? 'transform rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <p className="text-gray-600 mt-2 line-clamp-2">
                {section.content.substring(0, 150)}...
              </p>
              {expandedSections.has(section.title) && (
                <div className="mt-3 text-gray-700">
                  <p>{section.content}</p>
                  {section.subsections && (
                    <div className="ml-4 mt-3 space-y-2">
                      {section.subsections.map((sub, subIdx) => (
                        <div key={subIdx}>
                          <h4 className="font-semibold text-gray-800">{sub.title}</h4>
                          <p className="text-gray-600 mt-1">{sub.content}</p>
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
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Discussion ({comments.length})</h2>
            <Link
              href={`/comment/new?articleId=${articleId}`}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
            >
              Start New Thread
            </Link>
          </div>

          {/* Comment Filters */}
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700 mr-2">Filter by:</span>
            {(['meaningful', 'critical', 'helpful', 'non-sense', 'useless', 'irrational'] as CommentLabel[]).map((label) => (
              <button
                key={label}
                onClick={() => toggleFilter(label)}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  filterLabels.has(label)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {rootComments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No comments yet. Be the first to start a discussion!
            </p>
          ) : (
            <div className="space-y-4">
              {rootComments.map((comment) => (
                <CommentThread key={comment.id} comment={comment} allComments={filteredComments} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Rate This Paper</h3>
            <div className="flex justify-center mb-4">
              <StarRating rating={userRating} onRate={handleRate} size="lg" />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowRatingModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CommentThread({ comment, allComments }: { comment: Comment; allComments: Comment[] }) {
  const [user, setUser] = useState<User | null>(null);
  const [showReplies, setShowReplies] = useState(false);

  useEffect(() => {
    if (!comment.isAnonymous) {
      db.users.findById(comment.userId).then(setUser);
    }
  }, [comment]);

  const replies = allComments.filter(c => c.parentId === comment.id);

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="font-semibold text-gray-800">
            {comment.isAnonymous ? 'Anonymous' : user?.username || 'Loading...'}
          </span>
          <span className="text-sm text-gray-500 ml-2">
            {new Date(comment.createdAt).toLocaleString()}
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {comment.aiLabels.map((label, idx) => (
            <span
              key={idx}
              className={`px-2 py-0.5 rounded-full text-xs ${
                ['meaningful', 'critical', 'helpful'].includes(label)
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <p className="text-gray-700 mb-3 whitespace-pre-wrap">{comment.content}</p>

      {comment.sectionReferences && comment.sectionReferences.length > 0 && (
        <div className="text-sm text-gray-600 mb-2">
          <strong>References:</strong> {comment.sectionReferences.join(', ')}
        </div>
      )}

      <div className="flex items-center space-x-4 text-sm">
        <button className="flex items-center space-x-1 text-gray-600 hover:text-blue-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
          <span>{comment.likes}</span>
        </button>

        <Link
          href={`/comment/new?articleId=${comment.articleId}&parentId=${comment.id}`}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          Reply
        </Link>

        {replies.length > 0 && (
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            {showReplies ? 'Hide' : 'Show'} {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
          </button>
        )}
      </div>

      {showReplies && replies.length > 0 && (
        <div className="ml-8 mt-4 space-y-3 border-l-2 border-gray-200 pl-4">
          {replies.map((reply) => (
            <CommentThread key={reply.id} comment={reply} allComments={allComments} />
          ))}
        </div>
      )}
    </div>
  );
}

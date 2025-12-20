'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import { db } from '@/lib/db';
import { Comment, Article } from '@/lib/types';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [myComments, setMyComments] = useState<Comment[]>([]);
  const [archivedArticles, setArchivedArticles] = useState<Article[]>([]);
  const [activeTab, setActiveTab] = useState<'threads' | 'archived'>('threads');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    // Load user's comment threads
    const threads = await db.comments.findThreads(user.id);
    setMyComments(threads);

    // Load archived articles
    const archived = await db.archived.getArchivedArticles(user.id);
    setArchivedArticles(archived);
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Dashboard</h1>

        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('threads')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'threads'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                My Discussion Threads ({myComments.length})
              </button>
              <button
                onClick={() => setActiveTab('archived')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'archived'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Archived Papers ({archivedArticles.length})
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'threads' ? (
              <ThreadsTab comments={myComments} />
            ) : (
              <ArchivedTab articles={archivedArticles} />
            )}
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/search"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Search for Papers
          </Link>
        </div>
      </div>
    </div>
  );
}

function ThreadsTab({ comments }: { comments: Comment[] }) {
  const [articleMap, setArticleMap] = useState<Record<string, Article>>({});

  useEffect(() => {
    loadArticles();
  }, [comments]);

  const loadArticles = async () => {
    const map: Record<string, Article> = {};
    for (const comment of comments) {
      if (!map[comment.articleId]) {
        const article = await db.articles.findById(comment.articleId);
        if (article) {
          map[comment.articleId] = article;
        }
      }
    }
    setArticleMap(map);
  };

  if (comments.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>You haven't started any discussion threads yet.</p>
        <p className="mt-2">Search for papers and start commenting!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => {
        const article = articleMap[comment.articleId];
        return (
          <div
            key={comment.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <Link
              href={`/article/${comment.articleId}`}
              className="text-lg font-semibold text-blue-600 hover:text-blue-800"
            >
              {article?.title || 'Loading...'}
            </Link>
            <p className="text-gray-600 mt-2 line-clamp-2">{comment.content}</p>
            <div className="flex items-center mt-3 text-sm text-gray-500">
              <span>Posted {new Date(comment.createdAt).toLocaleDateString()}</span>
              <span className="mx-2">•</span>
              <span className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
                <span>{comment.likes}</span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ArchivedTab({ articles }: { articles: Article[] }) {
  if (articles.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>You haven't archived any papers yet.</p>
        <p className="mt-2">Archive papers to quickly access them later!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {articles.map((article) => (
        <div
          key={article.id}
          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <Link
            href={`/article/${article.id}`}
            className="text-lg font-semibold text-blue-600 hover:text-blue-800"
          >
            {article.title}
          </Link>
          <p className="text-gray-600 mt-1 text-sm">
            {article.authors.map(a => a.name).join(', ')} • {new Date(article.publishDate).getFullYear()}
          </p>
          <p className="text-gray-600 mt-2 line-clamp-2">{article.abstract}</p>
          <div className="flex items-center mt-3 text-sm text-gray-500">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-yellow-400 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span className="ml-1">{article.averageRating.toFixed(1)}</span>
            </div>
            <span className="mx-2">•</span>
            <span>{article.totalRatings} ratings</span>
          </div>
        </div>
      ))}
    </div>
  );
}

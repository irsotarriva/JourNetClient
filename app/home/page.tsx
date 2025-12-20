'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import NetworkBackground from '@/components/NetworkBackground';
import { getArchivedArticles, getArticleById, getUserThreads } from '@/app/actions';
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
    const threads = await getUserThreads(user.id);
    setMyComments(threads);

    // Load archived articles
    const archived = await getArchivedArticles(user.id);
    setArchivedArticles(archived);
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <NetworkBackground />
        <div className="relative z-10 text-xl font-medium text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <NetworkBackground />
      <div className="relative z-10">
        <Navbar />

        <div className="container mx-auto px-6 py-8">
          <div className="mb-8 text-center sm:text-left">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 mb-2">
              Welcome back, {user.username}!
            </h1>
            <p className="text-gray-600 text-lg">Your research discussion hub.</p>
          </div>

          <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-xl border border-white/40 overflow-hidden mb-8">
            <div className="border-b border-gray-200/50 flex">
              <button
                onClick={() => setActiveTab('threads')}
                className={`flex-1 px-6 py-4 font-bold text-lg transition-all duration-300 ${activeTab === 'threads'
                    ? 'bg-white/50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/30'
                  }`}
              >
                My Discussion Threads ({myComments.length})
              </button>
              <button
                onClick={() => setActiveTab('archived')}
                className={`flex-1 px-6 py-4 font-bold text-lg transition-all duration-300 ${activeTab === 'archived'
                    ? 'bg-white/50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/30'
                  }`}
              >
                Archived Papers ({archivedArticles.length})
              </button>
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
              className="inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-300 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:scale-105"
            >
              <span>Search for Papers</span>
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>
          </div>
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
        const article = await getArticleById(comment.articleId);
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
        <p className="text-lg">You haven't started any discussion threads yet.</p>
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
            className="bg-white/50 rounded-xl p-6 border border-white/60 hover:shadow-md transition-all duration-300"
          >
            <Link
              href={`/article/${comment.articleId}`}
              className="text-lg font-bold text-blue-600 hover:text-blue-800 transition-colors block mb-2"
            >
              {article?.title || 'Loading paper title...'}
            </Link>
            <p className="text-gray-700 mb-3 line-clamp-2 bg-white/40 p-3 rounded-lg border border-white/50 italic">
              "{comment.content}"
            </p>
            <div className="flex items-center text-sm text-gray-500">
              <span className="font-medium">Posted: {new Date(comment.createdAt).toLocaleDateString()}</span>
              <span className="mx-2">•</span>
              <span className="flex items-center space-x-1 bg-blue-50 px-2 py-1 rounded-full text-blue-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
                <span className="font-bold">{comment.likes}</span>
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
        <p className="text-lg">You haven't archived any papers yet.</p>
        <p className="mt-2">Archive papers to quickly access them later!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {articles.map((article) => (
        <div
          key={article.id}
          className="bg-white/50 rounded-xl p-6 border border-white/60 hover:shadow-md transition-all duration-300"
        >
          <Link
            href={`/article/${article.id}`}
            className="text-lg font-bold text-blue-600 hover:text-blue-800 transition-colors block mb-1"
          >
            {article.title}
          </Link>
          <p className="text-gray-500 text-sm mb-3 font-medium">
            {article.authors.map(a => a.name).join(', ')} • {new Date(article.publishDate).getFullYear()}
          </p>
          <p className="text-gray-600 mb-4 line-clamp-2">{article.abstract}</p>

          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm font-medium text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full">
              <svg className="w-4 h-4 mr-1 fill-current" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              {article.averageRating.toFixed(1)}
            </div>
            <span className="text-sm text-gray-400">({article.totalRatings} ratings)</span>
          </div>
        </div>
      ))}
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import StarRating from '@/components/StarRating';
import { db } from '@/lib/db';
import { Article } from '@/lib/types';

export default function SearchPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Article[]>([]);
  const [recommendations, setRecommendations] = useState<Article[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);

  // Filters
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState<'rating' | 'date'>('rating');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const loadRecommendations = useCallback(async () => {
    if (!user) return;
    const recs = await db.articles.getRecommendations(user.id, 6);
    setRecommendations(recs);
  }, [user]);

  useEffect(() => {
    if (user) {
      loadRecommendations();
    }
  }, [user, loadRecommendations]);

  useEffect(() => {
    const handleScroll = () => {
      // Show recommendations when user scrolls down more than 50px
      if (window.scrollY > 50 && !showRecommendations) {
        setShowRecommendations(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showRecommendations]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      let results = await db.articles.search(searchQuery);

      // Apply filters
      if (minRating > 0) {
        results = results.filter(a => a.averageRating >= minRating);
      }

      // Sort results
      if (sortBy === 'rating') {
        results.sort((a, b) => b.averageRating - a.averageRating);
      } else if (sortBy === 'date') {
        results.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
      }

      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50/30">
      <Navbar />

      {/* Search Hero Section - Fades when showing recommendations */}
      <div className={`min-h-screen flex items-center justify-center smooth-transition ${
        showRecommendations ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}>
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-5xl font-bold mb-4 text-primary-600">
              Search Papers
            </h1>
            <p className="text-gray-600 text-lg">
              Discover groundbreaking research and scientific papers
            </p>
          </div>

          {/* Search Form */}
          <div className="glass-effect rounded-2xl shadow-xl border border-white/20 p-8">
            <form onSubmit={handleSearch}>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title, author, keywords..."
                  className="flex-1 px-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-400 focus:border-primary-500 smooth-transition bg-white/70 backdrop-blur-sm hover:border-gray-300"
                />
                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-10 py-4 text-base gradient-primary text-white rounded-xl font-semibold shadow-lg hover:shadow-xl smooth-transition disabled:opacity-50 hover:scale-105 active:scale-95"
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </div>
            </form>
          </div>

          {/* Scroll/Click hint - only when not showing recommendations */}
          {!hasSearched && (
            <button
              onClick={() => setShowRecommendations(true)}
              className="text-center mt-8 animate-pulse mx-auto block hover:scale-110 smooth-transition focus:outline-none"
            >
              <p className="text-gray-500 text-sm mb-2 hover:text-primary-600 smooth-transition">
                Click here or scroll down to see recommendations
              </p>
              <svg className="w-6 h-6 mx-auto text-gray-400 hover:text-primary-500 smooth-transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Recommendations Section - Appears when triggered, positioned absolutely to overlay */}
      <div className={`fixed top-16 left-0 right-0 bg-gradient-to-br from-gray-50 to-primary-50/30 smooth-transition ${
        showRecommendations
          ? 'opacity-100 min-h-screen z-10'
          : 'opacity-0 pointer-events-none'
      }`}>
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Compact Search Bar */}
          <div className="glass-effect rounded-2xl shadow-xl border border-white/20 p-3 mb-8">
            <form onSubmit={handleSearch}>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title, author, keywords..."
                  className="flex-1 px-4 py-2 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-400 focus:border-primary-500 smooth-transition bg-white/70 backdrop-blur-sm hover:border-gray-300"
                />
                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-5 py-2 text-sm gradient-primary text-white rounded-xl font-semibold shadow-lg hover:shadow-xl smooth-transition disabled:opacity-50 hover:scale-105 active:scale-95"
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </div>
            </form>
          </div>

          {/* Search Results */}
          {hasSearched && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">
                Search Results ({searchResults.length})
              </h2>
              {searchResults.length === 0 ? (
                <div className="glass-effect rounded-2xl shadow-md p-8 text-center text-gray-500 border border-white/20">
                  <p>No papers found matching your search criteria.</p>
                  <p className="mt-2">Try different keywords or adjust filters.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {searchResults.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Recommendations */}
          {!hasSearched && recommendations.length > 0 && (
            <div className="pb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Recommended for You</h2>
                <p className="text-sm text-gray-600">
                  Based on your research interests and highly-rated papers
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recommendations.map((article) => (
                  <RecommendationCard key={article.id} article={article} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ArticleCard({ article }: { article: Article }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 card-hover border border-gray-100">
      <Link
        href={`/article/${article.id}`}
        className="text-xl font-bold text-gray-800 hover:text-primary-600 smooth-transition block"
      >
        {article.title}
      </Link>

      <div className="text-sm text-gray-500 mt-2 flex items-center space-x-2">
        <span className="font-semibold">
          {article.authors.map(a => a.name).join(', ')}
        </span>
        <span className="text-gray-300">•</span>
        <span>{new Date(article.publishDate).toLocaleDateString()}</span>
      </div>

      <p className="text-gray-600 mt-4 line-clamp-3 leading-relaxed">{article.abstract}</p>

      <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          <StarRating rating={article.averageRating} readonly size="sm" />
          <span className="text-sm text-primary-700 font-semibold">
            {article.averageRating.toFixed(1)}
          </span>
        </div>

        <div className="flex space-x-3">
          {article.pdfUrl && (
            <a
              href={article.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold smooth-transition shadow-sm hover:shadow-md"
              onClick={(e) => e.stopPropagation()}
            >
              PDF
            </a>
          )}
          <Link
            href={`/article/${article.id}`}
            className="text-sm px-4 py-2 gradient-primary text-white rounded-lg font-semibold smooth-transition shadow-sm hover:shadow-md flex items-center space-x-1 group"
          >
            <span>View Details</span>
            <span className="group-hover:translate-x-1 smooth-transition">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function RecommendationCard({ article }: { article: Article }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl card-hover border border-gray-100">
      <div className="bg-gradient-to-br from-primary-50 via-white to-accent-50 p-5 border-b border-primary-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <StarRating rating={article.averageRating} readonly size="sm" />
            <span className="text-primary-700 text-sm font-semibold ml-2">
              ({article.averageRating.toFixed(1)})
            </span>
          </div>
          <div className="px-3 py-1.5 bg-primary-500 text-white text-xs font-semibold rounded-full shadow-sm">
            {article.totalRatings} reviews
          </div>
        </div>
      </div>

      <div className="p-5">
        <Link
          href={`/article/${article.id}`}
          className="text-lg font-bold text-gray-800 hover:text-primary-600 line-clamp-2 smooth-transition block"
        >
          {article.title}
        </Link>

        <div className="text-sm text-gray-500 mt-2 font-medium">
          {article.authors.map(a => a.name).join(', ')}
        </div>

        <p className="text-gray-600 mt-3 text-sm line-clamp-3 leading-relaxed">
          {article.abstract}
        </p>

        {article.aiSummary && (
          <div className="mt-4 p-3 bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl border border-primary-200">
            <p className="text-xs text-primary-900 line-clamp-2">
              <strong className="text-primary-700">Community:</strong> {article.aiSummary}
            </p>
          </div>
        )}

        <div className="flex justify-between items-center mt-5 pt-4 border-t border-gray-100">
          <span className="text-xs text-gray-400 font-medium">
            {new Date(article.publishDate).getFullYear()}
          </span>
          <Link
            href={`/article/${article.id}`}
            className="text-sm text-primary-600 hover:text-primary-700 font-semibold smooth-transition flex items-center space-x-1 group"
          >
            <span>Read More</span>
            <span className="group-hover:translate-x-1 smooth-transition">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

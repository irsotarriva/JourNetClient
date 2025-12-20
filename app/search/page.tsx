'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import StarRating from '@/components/StarRating';
import NetworkBackground from '@/components/NetworkBackground';
import { searchArticles, getRecommendations } from '@/app/actions';
import { Article } from '@/lib/types';
import { Network } from 'lucide-react';
import GraphRecommendationPopup from '@/components/GraphRecommendationPopup';

export default function SearchPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const resultsRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Article[]>([]);
  const [recommendations, setRecommendations] = useState<Article[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);

  // Filters
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState<'rating' | 'date'>('rating');
  const [searchLimit, setSearchLimit] = useState(5);
  const [isGraphOpen, setIsGraphOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadRecommendations();
    }
  }, [user]);

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

  const loadRecommendations = async () => {
    if (!user) return;
    const recs = await getRecommendations(user.id, 10);
    setRecommendations(recs);
  };

  const executeSearch = async (query: string, limit: number) => {
    if (!query.trim()) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      let results = await searchArticles(query, limit);

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

      // Show recommendations section and scroll to results
      setShowRecommendations(true);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeSearch(searchQuery, searchLimit);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <NetworkBackground />
        <div className="relative z-10 text-xl font-medium text-gray-600 animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      <NetworkBackground />
      <div className="relative z-10">
        <Navbar />

        {/* Search Hero Section - Fades when showing recommendations */}
        <div className={`min-h-[90vh] flex items-center justify-center transition-all duration-700 ease-in-out ${showRecommendations ? 'opacity-0 pointer-events-none translate-y-[-50px]' : 'opacity-100 translate-y-0'
          }`}>
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-12 animate-fade-in">
              <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight animate-text-wave">
                Start a Journey to Science
              </h1>
              <p className="text-gray-600 text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                Discover groundbreaking research and scientific papers from our curated database.
              </p>
            </div>

            {/* Search Form */}
            <div className="glass-effect rounded-3xl shadow-2xl border border-white/40 p-10 transform hover:scale-[1.01] transition-transform duration-300">
              <form onSubmit={handleSearch}>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by title, author, keywords..."
                      className="w-full pl-12 pr-6 py-5 text-lg border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all bg-white/80 backdrop-blur-sm outline-none font-medium text-gray-800 placeholder-gray-400 shadow-inner"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="px-12 py-5 text-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl hover:translate-y-[-2px] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:transform-none"
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </form>
            </div>

            {/* Scroll/Click hint */}
            {!hasSearched && (
              <button
                onClick={() => setShowRecommendations(true)}
                className="text-center mt-12 animate-bounce mx-auto block hover:opacity-80 transition-opacity focus:outline-none"
              >
                <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-3">
                  Scroll for recommendations
                </p>
                <div className="w-10 h-10 rounded-full bg-white/50 border border-white/60 shadow-md flex items-center justify-center mx-auto text-blue-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7-7-7" />
                  </svg>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Recommendations Section - Appears when triggered */}
        <div className={`transition-all duration-700 ease-in-out bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 ${showRecommendations
          ? 'fixed inset-0 z-50 overflow-y-auto opacity-100 translate-y-0'
          : 'fixed inset-0 opacity-0 translate-y-[100%] pointer-events-none'
          }`}>

          {/* Header with Search Bar Repositioned */}
          <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm py-4 mb-8">
            <div className="container mx-auto px-4 max-w-6xl">
              <form onSubmit={handleSearch} className="flex gap-4">
                <Link href="/home" className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </Link>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-6 pr-4 py-3 bg-gray-100/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-md"
                >
                  Search
                </button>
              </form>
            </div>
          </div>

          <div className="container mx-auto px-4 max-w-6xl">
            {/* Search Results */}
            {hasSearched && (
              <div ref={resultsRef} className="mb-16">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                  <h2 className="text-3xl font-black text-gray-800">
                    Search Results <span className="text-blue-600">({searchResults.length})</span>
                  </h2>

                  <div className="flex items-center space-x-2">
                    <label htmlFor="limit" className="text-sm font-bold text-gray-600 uppercase tracking-wide">Show:</label>
                    <div className="relative">
                      <select
                        id="limit"
                        value={searchLimit}
                        onChange={(e) => {
                          const newLimit = Number(e.target.value);
                          setSearchLimit(newLimit);
                          // Auto trigger search with new limit if query exists
                          if (searchQuery) {
                            executeSearch(searchQuery, newLimit);
                          }
                        }}
                        className="appearance-none bg-white border border-gray-200 text-gray-700 py-2 pl-4 pr-8 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <option value={1}>1</option>
                        <option value={3}>3</option>
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={30}>30</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {searchResults.length === 0 ? (
                  <div className="bg-white/60 backdrop-blur-md rounded-3xl shadow-xl border border-white/40 p-12 text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">No results found</h3>
                    <p className="text-gray-500">Try adjusting your search terms or filters.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
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
                <div className="text-center mb-10 relative">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <h2 className="text-3xl font-black text-gray-800">Recommended for You</h2>
                    <button
                      onClick={() => setIsGraphOpen(true)}
                      className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors shadow-sm cursor-pointer"
                      title="Open Graph View"
                    >
                      <Network className="w-6 h-6" />
                    </button>
                  </div>
                  <p className="text-gray-600 font-medium">
                    Curated based on your interests and community activity
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {recommendations.map((article) => (
                    <RecommendationCard key={article.id} article={article} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {isGraphOpen && (
          <GraphRecommendationPopup
            initialArticles={recommendations}
            onClose={() => setIsGraphOpen(false)}
          />
        )}
      </div>
    </div>
  );
}

function ArticleCard({ article }: { article: Article }) {
  return (
    <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg p-8 border border-white/50 hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 group">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <Link
            href={`/article/${article.id}`}
            className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors block mb-3 leading-tight"
          >
            {article.title}
          </Link>

          <div className="text-sm text-gray-500 mb-4 flex flex-wrap items-center gap-2">
            <span className="font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-md">
              {article.authors.map(a => a.name).join(', ')}
            </span>
            <span className="text-gray-300">•</span>
            <span>{new Date(article.publishDate).getFullYear()}</span>
          </div>

          <p className="text-gray-600 mb-6 line-clamp-2 leading-relaxed">{article.abstract}</p>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 bg-yellow-50 px-3 py-1.5 rounded-full border border-yellow-100">
              <StarRating rating={article.averageRating} readonly size="sm" />
              <span className="text-sm text-yellow-700 font-bold">
                {article.averageRating.toFixed(1)}
              </span>
            </div>

            {article.pdfUrl && (
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100 uppercase tracking-wide">
                PDF Available
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-row md:flex-col justify-between items-end gap-3 min-w-[140px]">
          <Link
            href={`/article/${article.id}`}
            className="px-6 py-3 w-full text-center bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 hover:shadow-lg transition-all"
          >
            View
          </Link>
          {article.pdfUrl && (
            <a
              href={article.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 w-full text-center bg-white text-gray-700 font-bold rounded-xl border border-gray-200 hover:bg-gray-50 transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              PDF
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function RecommendationCard({ article }: { article: Article }) {
  return (
    <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-white/40 flex flex-col h-full group">
      <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-1 bg-yellow-50 px-2 py-1 rounded-lg">
            <StarRating rating={article.averageRating} readonly size="sm" />
            <span className="text-yellow-700 text-xs font-bold ml-1">
              {article.averageRating.toFixed(1)}
            </span>
          </div>
          <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
            {new Date(article.publishDate).getFullYear()}
          </span>
        </div>

        <Link
          href={`/article/${article.id}`}
          className="text-lg font-bold text-gray-800 hover:text-blue-600 line-clamp-2 transition-colors mb-3"
        >
          {article.title}
        </Link>

        <p className="text-gray-500 text-xs mb-4 font-medium line-clamp-1">
          {article.authors.map(a => a.name).join(', ')}
        </p>

        <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed mb-4 flex-1">
          {article.abstract}
        </p>

        {article.aiSummary && (
          <div className="mt-auto mb-4 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
            <p className="text-xs text-blue-900 line-clamp-2 italic">
              <strong className="text-blue-700 not-italic">AI Summary:</strong> {article.aiSummary}
            </p>
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-gray-100">
          <Link
            href={`/article/${article.id}`}
            className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center group-hover:underline"
          >
            Read Discussion
            <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

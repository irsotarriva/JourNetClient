'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import NetworkBackground from '@/components/NetworkBackground';
import { fetchAPI } from '@/lib/api';

type TabType = 'discussions' | 'reading' | 'personal';

interface ThreadComment {
    id: number;
    userId: string;
    comment: string;
    created_at: string;
    upVotes: number;
    downVotes: number;
    isUserComment: boolean;
    children: ThreadComment[];
}

interface DiscussionThread {
    article_id: number;
    paper_title: string;
    paper_abstract: string;
    root_comment_id: number;
    thread: ThreadComment;
}

interface ReadingListItem {
    id: number;
    title: string;
    description: string;
    created_at: string;
    papers: {
        article_id: number;
        title: string;
    }[];
}

export default function UserPage() {
    const { user, isLoading, logout } = useAuth();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/');
    };
    const [activeTab, setActiveTab] = useState<TabType>('discussions');
    const [threads, setThreads] = useState<DiscussionThread[]>([]);
    const [loadingThreads, setLoadingThreads] = useState(false);
    const [readingLists, setReadingLists] = useState<ReadingListItem[]>([]);
    const [loadingLists, setLoadingLists] = useState(false);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/');
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (user && activeTab === 'discussions') {
            loadDiscussionThreads();
        } else if (user && activeTab === 'reading') {
            loadReadingLists();
        }
    }, [user, activeTab]);

    const loadDiscussionThreads = async () => {
        setLoadingThreads(true);
        try {
            const response = await fetchAPI('/comments/user/threads');
            setThreads(response.threads || []);
        } catch (error) {
            console.error('Failed to load discussion threads:', error);
            setThreads([]);
        } finally {
            setLoadingThreads(false);
        }
    };

    const loadReadingLists = async () => {
        setLoadingLists(true);
        try {
            const response = await fetchAPI('/reading-lists/');
            setReadingLists(response || []);
        } catch (error) {
            console.error('Failed to load reading lists:', error);
            setReadingLists([]);
        } finally {
            setLoadingLists(false);
        }
    };

    if (isLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
                <NetworkBackground />
                <div className="relative z-10 text-xl text-gray-700">Loading...</div>
            </div>
        );
    }

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
                                    className="px-4 py-2 text-sm font-semibold text-blue-600 transition-colors flex items-center space-x-2"
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
                <div className="container mx-auto px-6 py-12">
                    <div className="max-w-6xl mx-auto">
                        {/* Page Title */}
                        <h2 className="text-4xl font-bold text-gray-800 mb-8">My Profile</h2>

                        {/* Tab Navigation */}
                        <div className="bg-white/40 backdrop-blur-md rounded-2xl p-2 shadow-lg border border-white/30 mb-8 flex space-x-2">
                            <button
                                onClick={() => setActiveTab('discussions')}
                                className={`flex-1 py-3 px-6 rounded-xl font-semibold text-lg transition-all duration-300 ${activeTab === 'discussions'
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                                    : 'text-gray-700 hover:text-gray-900 hover:bg-white/50'
                                    }`}
                            >
                                Discussions
                            </button>
                            <button
                                onClick={() => setActiveTab('reading')}
                                className={`flex-1 py-3 px-6 rounded-xl font-semibold text-lg transition-all duration-300 ${activeTab === 'reading'
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                                    : 'text-gray-700 hover:text-gray-900 hover:bg-white/50'
                                    }`}
                            >
                                Reading Lists
                            </button>
                            <button
                                onClick={() => setActiveTab('personal')}
                                className={`flex-1 py-3 px-6 rounded-xl font-semibold text-lg transition-all duration-300 ${activeTab === 'personal'
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                                    : 'text-gray-700 hover:text-gray-900 hover:bg-white/50'
                                    }`}
                            >
                                Personal Information
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="bg-white/40 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-white/30 min-h-[400px]">
                            {activeTab === 'discussions' && (
                                <DiscussionsTab threads={threads} loading={loadingThreads} onRefresh={loadDiscussionThreads} />
                            )}
                            {activeTab === 'reading' && (
                                <ReadingListsTab lists={readingLists} loading={loadingLists} onRefresh={loadReadingLists} />
                            )}
                            {activeTab === 'personal' && (
                                <PersonalInfoTab user={user} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DiscussionsTab({ threads, loading, onRefresh }: { threads: DiscussionThread[]; loading: boolean; onRefresh: () => void }) {
    const [deleting, setDeleting] = useState<number | null>(null);

    const handleDelete = async (commentId: number) => {
        setDeleting(commentId);
        try {
            await fetchAPI(`/comments/${commentId}`, { method: 'DELETE' });
            onRefresh(); // Refresh the discussions list
        } catch (error) {
            console.error('Error deleting comment:', error);
        } finally {
            setDeleting(null);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Loading your discussions...</p>
            </div>
        );
    }

    if (threads.length === 0) {
        return (
            <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Discussions Yet</h3>
                <p className="text-gray-600">You haven&rsquo;t participated in any discussions yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Your Discussions ({threads.length})</h3>

            {threads.map((thread, idx) => (
                <div
                    key={`${thread.article_id}_${thread.root_comment_id}_${idx}`}
                    className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/40 shadow-md hover:shadow-lg transition-all duration-300"
                >
                    {/* Paper Title */}
                    <Link href={`/article/${thread.article_id}`}>
                        <h4 className="text-xl font-bold text-blue-600 hover:text-blue-800 mb-4 cursor-pointer">
                            {thread.paper_title}
                        </h4>
                    </Link>

                    {/* Thread Display */}
                    <div className="space-y-3">
                        <CommentNode
                            comment={thread.thread}
                            depth={0}
                            onDelete={handleDelete}
                            deleting={deleting}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}

function CommentNode({
    comment,
    depth,
    onDelete,
    deleting
}: {
    comment: ThreadComment;
    depth: number;
    onDelete: (id: number) => void;
    deleting: number | null;
}) {
    const marginLeft = depth * 24; // 24px per level
    const isDeleting = deleting === comment.id;

    return (
        <div style={{ marginLeft: `${marginLeft}px` }}>
            <div
                className={`rounded-lg p-4 ${comment.isUserComment
                    ? 'bg-blue-50 border-2 border-blue-300 shadow-md'
                    : 'bg-gray-50/80 border border-gray-200'
                    } ${isDeleting ? 'opacity-50' : ''}`}
            >
                {/* Comment Header */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                        {comment.isUserComment && (
                            <span className="px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded">
                                YOUR COMMENT
                            </span>
                        )}
                        <span className="text-sm text-gray-500">
                            {new Date(comment.created_at).toLocaleString()}
                        </span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm">
                        <span className="flex items-center space-x-1">
                            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                            </svg>
                            <span className="text-gray-700">{comment.upVotes || 0}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                            <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.105-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
                            </svg>
                            <span className="text-gray-700">{comment.downVotes || 0}</span>
                        </span>
                        {/* Delete button for user's comments */}
                        {comment.isUserComment && (
                            <button
                                onClick={() => onDelete(comment.id)}
                                disabled={isDeleting}
                                className="flex items-center space-x-1 text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                                title="Delete comment"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Comment Text */}
                <p className={`text-gray-800 ${comment.isUserComment ? 'font-medium' : ''}`}>
                    {comment.comment}
                </p>
            </div>

            {/* Render Children */}
            {comment.children && comment.children.length > 0 && (
                <div className="mt-3 space-y-3">
                    {comment.children.map((child) => (
                        <CommentNode
                            key={child.id}
                            comment={child}
                            depth={depth + 1}
                            onDelete={onDelete}
                            deleting={deleting}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function ReadingListsTab({ lists, loading, onRefresh }: { lists: any[]; loading: boolean; onRefresh: () => void }) {
    const [expandedLists, setExpandedLists] = useState<Set<number>>(new Set());
    const [listPapers, setListPapers] = useState<Record<number, any[]>>({});
    const [loadingPapers, setLoadingPapers] = useState<Set<number>>(new Set());

    const handleDeleteList = async (listId: number, e: React.MouseEvent) => {
        e.stopPropagation();

        try {
            await fetchAPI(`/reading-lists/${listId}`, { method: 'DELETE' });
            onRefresh();
        } catch (error) {
            console.error('Failed to delete list:', error);
        }
    };

    const handleRemovePaper = async (listId: number, paperId: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            await fetchAPI(`/reading-lists/${listId}/papers/${paperId}`, { method: 'DELETE' });
            setListPapers(prev => ({
                ...prev,
                [listId]: prev[listId] ? prev[listId].filter(p => p.id !== paperId) : []
            }));
            onRefresh();
        } catch (error) {
            console.error('Failed to remove paper:', error);
        }
    };

    const toggleList = async (listId: number) => {
        const newExpanded = new Set(expandedLists);

        if (newExpanded.has(listId)) {
            newExpanded.delete(listId);
        } else {
            newExpanded.add(listId);

            // Load papers for this list if not already loaded
            if (!listPapers[listId]) {
                await loadListPapers(listId);
            }
        }

        setExpandedLists(newExpanded);
    };

    const loadListPapers = async (listId: number) => {
        setLoadingPapers(prev => new Set(prev).add(listId));

        try {
            const response = await fetchAPI(`/reading-lists/${listId}/papers`);
            setListPapers(prev => ({
                ...prev,
                [listId]: response.papers || []
            }));
        } catch (error) {
            console.error(`Failed to load papers for list ${listId}:`, error);
            setListPapers(prev => ({
                ...prev,
                [listId]: []
            }));
        } finally {
            setLoadingPapers(prev => {
                const newSet = new Set(prev);
                newSet.delete(listId);
                return newSet;
            });
        }
    };

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Loading your reading lists...</p>
            </div>
        );
    }

    if (lists.length === 0) {
        return (
            <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Reading Lists Yet</h3>
                <p className="text-gray-600">Create reading lists to organize your papers.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Your Reading Lists ({lists.length})</h3>

            {lists.map((list) => (
                <div
                    key={list.id}
                    className="bg-white/60 backdrop-blur-sm rounded-xl border border-white/40 shadow-md hover:shadow-lg transition-all duration-300"
                >
                    {/* List Header */}
                    <div className="p-6 rounded-xl hover:bg-white/40 transition-colors">
                        <div className="flex items-center justify-between">
                            <div
                                className="flex-1 cursor-pointer"
                                onClick={() => toggleList(list.id)}
                            >
                                <h4 className="text-xl font-bold text-gray-800 mb-2">{list.name}</h4>
                                <p className="text-sm text-gray-600">
                                    {list.paperid?.length || 0} paper{(list.paperid?.length || 0) !== 1 ? 's' : ''}
                                    {' • '}
                                    Created {new Date(list.created_at).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="ml-4 flex items-center space-x-3">
                                <button
                                    type="button"
                                    onClick={(e) => handleDeleteList(list.id, e)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors z-10 relative"
                                    title="Delete list"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                                <div onClick={() => toggleList(list.id)} className="cursor-pointer p-1">
                                    <svg
                                        className={`w-6 h-6 text-gray-600 transition-transform duration-300 ${expandedLists.has(list.id) ? 'rotate-180' : ''
                                            }`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Expanded Papers List */}
                    {expandedLists.has(list.id) && (
                        <div className="px-6 pb-6">
                            <div className="border-t border-gray-200 pt-4">
                                {loadingPapers.has(list.id) ? (
                                    <div className="text-center py-8">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        <p className="text-gray-600 mt-2">Loading papers...</p>
                                    </div>
                                ) : listPapers[list.id] && listPapers[list.id].length > 0 ? (
                                    <div className="space-y-3">
                                        {listPapers[list.id].map((paper) => (
                                            <div key={paper.id} className="relative group bg-white/80 rounded-lg border border-gray-200 hover:bg-white hover:shadow-md transition-all duration-200">
                                                <Link href={`/article/${paper.id}`} className="block p-4">
                                                    <h5 className="font-semibold text-gray-800 hover:text-blue-600 mb-2 pr-6">
                                                        {paper.title}
                                                    </h5>
                                                    {paper.abstract && (
                                                        <p className="text-sm text-gray-600 line-clamp-2">{paper.abstract}</p>
                                                    )}
                                                    {paper.categories && (
                                                        <div className="flex flex-wrap gap-2 mt-2">
                                                            {paper.categories.split(',').slice(0, 3).map((category: string, idx: number) => (
                                                                <span
                                                                    key={idx}
                                                                    className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded"
                                                                >
                                                                    {category.trim()}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleRemovePaper(list.id, paper.id, e)}
                                                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                                                    title="Remove paper"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <p>No papers in this list yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

function PersonalInfoTab({ user }: { user: any }) {
    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-white/40 shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
                    <div className="flex items-center space-x-4">
                        <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center text-3xl font-bold text-blue-600 border-4 border-white/50 shadow-lg">
                            {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="text-white">
                            <h3 className="text-2xl font-bold">{user.username}</h3>
                            <p className="text-blue-100">Researcher / Student</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                                Account ID
                            </label>
                            <div className="flex items-center space-x-2 p-3 bg-white/50 rounded-lg border border-gray-200">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                </svg>
                                <span className="font-mono text-gray-700">
                                    {user.id ? `${user.id.substring(0, 8)}...${user.id.substring(user.id.length - 4)}` : 'N/A'}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                                Full Name
                            </label>
                            <div className="flex items-center space-x-2 p-3 bg-white/50 rounded-lg border border-gray-200">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span className="text-gray-700 text-lg">{user.username}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                                Email Address
                            </label>
                            <div className="flex items-center space-x-2 p-3 bg-white/50 rounded-lg border border-gray-200">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span className="text-gray-700 text-lg">{user.email || 'No email provided'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


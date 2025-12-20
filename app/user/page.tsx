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

export default function UserPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>('discussions');
    const [threads, setThreads] = useState<DiscussionThread[]>([]);
    const [loadingThreads, setLoadingThreads] = useState(false);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/');
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (user && activeTab === 'discussions') {
            loadDiscussionThreads();
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
                                <DiscussionsTab threads={threads} loading={loadingThreads} />
                            )}
                            {activeTab === 'reading' && (
                                <div className="text-center py-12">
                                    <h3 className="text-2xl font-bold text-gray-800 mb-4">Reading Lists</h3>
                                    <p className="text-lg text-gray-600">Coming soon...</p>
                                </div>
                            )}
                            {activeTab === 'personal' && (
                                <div className="text-center py-12">
                                    <h3 className="text-2xl font-bold text-gray-800 mb-4">Personal Information</h3>
                                    <p className="text-lg text-gray-600">Coming soon...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DiscussionsTab({ threads, loading }: { threads: DiscussionThread[]; loading: boolean }) {
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
                <p className="text-gray-600">You haven't participated in any discussions yet.</p>
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
                    <Link href={`/paper/${thread.article_id}`}>
                        <h4 className="text-xl font-bold text-blue-600 hover:text-blue-800 mb-4 cursor-pointer">
                            {thread.paper_title}
                        </h4>
                    </Link>

                    {/* Thread Display */}
                    <div className="space-y-3">
                        <CommentNode comment={thread.thread} depth={0} />
                    </div>
                </div>
            ))}
        </div>
    );
}

function CommentNode({ comment, depth }: { comment: ThreadComment; depth: number }) {
    const marginLeft = depth * 24; // 24px per level

    return (
        <div style={{ marginLeft: `${marginLeft}px` }}>
            <div
                className={`rounded-lg p-4 ${comment.isUserComment
                        ? 'bg-blue-50 border-2 border-blue-300 shadow-md'
                        : 'bg-gray-50/80 border border-gray-200'
                    }`}
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
                        <CommentNode key={child.id} comment={child} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
}

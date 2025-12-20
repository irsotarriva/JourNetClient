'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import NetworkBackground from '@/components/NetworkBackground';

export default function UserPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/');
        }
    }, [user, isLoading, router]);

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
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white/40 backdrop-blur-md rounded-2xl p-12 text-center border border-white/30 shadow-xl">
                            <h2 className="text-4xl font-bold text-gray-800 mb-4">User Profile</h2>
                            <p className="text-xl text-gray-600">Coming soon...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

'use client';

import Link from 'next/link';
import NetworkBackground from '@/components/NetworkBackground';

export default function WelcomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Network background */}
      <NetworkBackground />

      {/* Content */}
      <div className="relative z-10 text-center mx-4 max-w-4xl px-6">
        <h1 className="text-8xl lg:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 mb-8 tracking-tight animate-fade-in hover:scale-105 transition-transform duration-300 cursor-default">
          Welcome!
        </h1>

        <div className="space-y-6 mb-12 animate-slide-up">
          <p className="text-2xl lg:text-3xl text-gray-700 font-semibold leading-relaxed">
            The future of scientific discourse.
          </p>
          <p className="text-xl lg:text-2xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Explore and discuss research with clarity and depth.
          </p>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Join a community of researchers, scientists, and curious minds collaborating on groundbreaking ideas.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-fade-in">
          <Link
            href="/login"
            className="group relative inline-flex items-center justify-center px-10 py-5 font-bold text-white text-lg transition-all duration-300 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl hover:from-blue-700 hover:to-indigo-700 hover:shadow-2xl hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-300 transform"
          >
            <span>Start Exploring</span>
            <svg className="w-6 h-6 ml-3 transition-transform duration-300 group-hover:translate-x-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>

        <div className="mt-16 pt-8 flex items-center justify-center space-x-6 text-gray-500 text-sm font-medium animate-fade-in">
          <span className="hover:text-blue-600 transition-colors cursor-default">Powered by AI</span>
          <span>•</span>
          <span className="hover:text-blue-600 transition-colors cursor-default">Real-time Collaboration</span>
          <span>•</span>
          <span className="hover:text-blue-600 transition-colors cursor-default">Open Access</span>
        </div>
      </div>
    </div>
  );
}

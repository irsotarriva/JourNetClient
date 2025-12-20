'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { usePathname } from 'next/navigation';
import { Home, Search, Settings, LogOut, Sparkles } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  if (!user) return null;

  return (
    <nav className="gradient-primary text-white shadow-xl backdrop-blur-sm">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-10">
            <Link
              href="/home"
              className="flex items-center space-x-2 text-xl font-bold hover:scale-105 smooth-transition group"
            >
              <Sparkles className="w-6 h-6 group-hover:rotate-12 smooth-transition" />
              <span>Scientific Review</span>
            </Link>

            <div className="flex space-x-2">
              <Link
                href="/home"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium smooth-transition ${
                  isActive('/home')
                    ? 'bg-white/20 shadow-lg backdrop-blur-md'
                    : 'hover:bg-white/10'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </Link>
              <Link
                href="/search"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium smooth-transition ${
                  isActive('/search')
                    ? 'bg-white/20 shadow-lg backdrop-blur-md'
                    : 'hover:bg-white/10'
                }`}
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </Link>
              <Link
                href="/settings"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium smooth-transition ${
                  isActive('/settings')
                    ? 'bg-white/20 shadow-lg backdrop-blur-md'
                    : 'hover:bg-white/10'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm">
              Welcome, <span className="font-semibold">{user.username}</span>
            </div>
            <button
              onClick={logout}
              className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium backdrop-blur-sm shadow-md hover:shadow-lg smooth-transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

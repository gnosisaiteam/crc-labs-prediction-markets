'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Header() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-10 bg-white shadow-sm">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="text-xl font-bold">Prediction Markets with Circles</div>
        <div className="flex space-x-6">
          <Link 
            href="/" 
            className={`px-3 py-2 text-sm font-medium ${
              isActive('/') 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Markets
          </Link>
          <Link 
            href="/create" 
            className={`px-3 py-2 text-sm font-medium ${
              isActive('/create') 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Create Market
          </Link>
        </div>
      </nav>
    </header>
  );
}

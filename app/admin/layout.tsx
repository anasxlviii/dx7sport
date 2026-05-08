import { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-black">
      {/* Admin Header */}
      <header className="bg-black border-b border-border-subtle sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/admin" className="flex items-center gap-2">
                <span className="text-xl font-black italic tracking-tighter text-white">DX</span>
                <span className="text-xl font-black italic tracking-tighter text-lime">7</span>
                <span className="text-[10px] font-bold text-lime uppercase tracking-widest ml-1">Admin</span>
              </Link>
              <nav className="hidden md:flex gap-6">
                <Link
                  href="/admin"
                  className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-lime transition"
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/new"
                  className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-lime transition"
                >
                  Generate New
                </Link>
              </nav>
            </div>
            <Link href="/" className="text-xs font-bold text-gray-600 hover:text-white uppercase tracking-widest">
              View Site →
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-8">{children}</main>
    </div>
  );
}

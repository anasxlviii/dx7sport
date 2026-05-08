import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">⚽</span>
            <span className="text-xl font-bold text-gray-900">
              Football Content
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-gray-700 hover:text-blue-600 transition"
            >
              Home
            </Link>
            <Link
              href="/category/news"
              className="text-gray-700 hover:text-blue-600 transition"
            >
              News
            </Link>
            <Link
              href="/category/transfer"
              className="text-gray-700 hover:text-blue-600 transition"
            >
              Transfers
            </Link>
            <Link
              href="/category/comparison"
              className="text-gray-700 hover:text-blue-600 transition"
            >
              Comparisons
            </Link>
          </nav>

          <Link
            href="/admin"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Admin
          </Link>
        </div>
      </div>
    </header>
  );
}

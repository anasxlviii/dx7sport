import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-black border-b border-border-subtle sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="flex items-center group">
            <img 
              src="/logo.png?v=3" 
              alt="DX7 SPORT" 
              className="h-12 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-lime transition-colors"
            >
              الرئيسية
            </Link>
            <Link
              href="/category/news"
              className="text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-lime transition-colors"
            >
              الأخبار
            </Link>
            <Link
              href="/category/transfer"
              className="text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-lime transition-colors"
            >
              الانتقالات
            </Link>
            <Link
              href="/category/comparison"
              className="text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-lime transition-colors"
            >
              المقارنات
            </Link>
            <Link
              href="/scores"
              className="text-sm font-bold uppercase tracking-widest text-lime hover:text-white transition-colors flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              النتائج
            </Link>
            <Link
              href="/entertainment"
              className="text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-lime transition-colors"
            >
              تسلية
            </Link>

          </nav>

        </div>
      </div>
    </header>
  );
}

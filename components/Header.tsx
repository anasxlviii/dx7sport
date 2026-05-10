import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-black border-b border-border-subtle sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex flex-col leading-none">
              <div className="flex items-center gap-0.5">
                <span className="text-3xl font-black italic tracking-tighter text-white group-hover:text-lime transition-colors">DX</span>
                <span className="text-3xl font-black italic tracking-tighter text-lime group-hover:text-white transition-colors">7</span>
              </div>
              <span className="text-[10px] font-bold text-lime uppercase tracking-[0.3em] ml-0.5">SPORT</span>
            </div>
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

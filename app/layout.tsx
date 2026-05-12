import type { Metadata } from "next";
import { Cairo, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from '@/components/Header';
import { db } from '@/lib/db/db';
import { settings } from '@/lib/db/schema';
import { AdScriptInjector } from '@/components/AdScriptInjector';
import NextTopLoader from 'nextjs-toploader';

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://dx7sport.com'),
  title: "DX7 SPORT | The Ultimate Football Intel",
  description: "Your autonomous source for researched football intelligence, tactical analysis, and breaking news.",
  icons: {
    icon: '/favicon.png?v=4',
    shortcut: '/favicon.png?v=4',
    apple: '/favicon.png?v=4',
  },
  openGraph: {
    type: 'website',
    locale: 'ar_EG',
    url: 'https://dx7sport.com',
    siteName: 'DX7 SPORT',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@dx7sport',
  }
};

async function getGlobalScripts(retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      const rows = await db.select().from(settings);
      const scripts: string[] = [];
      
      const headScript = rows.find(r => r.key === 'ad_global_head');
      const headEnabled = rows.find(r => r.key === 'ad_global_head_enabled');
      if (headEnabled?.value === 'true' && headScript?.value) {
        scripts.push(headScript.value);
      }

      const socialBarScript = rows.find(r => r.key === 'ad_social_bar');
      const socialBarEnabled = rows.find(r => r.key === 'ad_social_bar_enabled');
      if (socialBarEnabled?.value === 'true' && socialBarScript?.value) {
        scripts.push(socialBarScript.value);
      }
      
      return scripts;
    } catch (err) {
      console.error(`[Layout] getGlobalScripts error (attempt ${i + 1}/${retries}):`, err);
      if (i === retries - 1) return [];
      const delay = Math.min(1000 * Math.pow(2, i), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return [];
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const globalHeadScripts = await getGlobalScripts();

  return (
    <html
      lang="ar"
      dir="rtl"
      prefix="og: http://ogp.me/ns#"
      className={`${cairo.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black text-white">
        <NextTopLoader 
          color="#9EFF00"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #9EFF00,0 0 5px #9EFF00"
        />
        {/* Global Adsterra Scripts (Pop-unders, Social Bars) */}
        {globalHeadScripts.map((script, idx) => (
          <AdScriptInjector key={idx} code={script} />
        ))}
        
        <Header />
        <main className="flex-1">{children}</main>
        
        <footer className="bg-zinc-950 border-t border-zinc-900 py-12">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="flex justify-center mb-6">
              <img src="/logo.png?v=4" alt="DX7 SPORT" className="h-10 w-auto object-contain opacity-50 hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.3em]">
              جميع الحقوق محفوظة © {new Date().getFullYear()} DX7 SPORT
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}

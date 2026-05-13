export const runtime = 'edge';
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        router.push('/admin');
        router.refresh();
      } else {
        setError('خطأ في اسم المستخدم أو كلمة المرور');
      }
    } catch (err) {
      setError('حدث خطأ ما. حاول مرة أخرى.');
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-lime/10 via-transparent to-lime/10 pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex flex-col leading-none mb-8">
            <div className="flex items-center gap-0.5">
              <span className="text-5xl font-black italic tracking-tighter text-white">DX</span>
              <span className="text-5xl font-black italic tracking-tighter text-lime">7</span>
            </div>
            <span className="text-[14px] font-black text-lime uppercase tracking-[0.5em] ml-0.5">ADMIN</span>
          </div>
          <h1 className="text-xl font-black text-white uppercase tracking-widest">الدخول إلى لوحة التحكم</h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-6 bg-zinc-950 border border-zinc-900 p-10 shadow-2xl">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 p-4 text-red-500 text-[11px] font-black uppercase tracking-widest text-center">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">اسم المستخدم</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-black border border-zinc-900 px-4 py-3 text-white focus:border-lime outline-none transition-all font-bold"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-zinc-900 px-4 py-3 text-white focus:border-lime outline-none transition-all font-bold"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-lime text-black py-4 font-black uppercase tracking-[0.3em] text-xs hover:bg-white transition-all transform hover:-translate-y-1"
          >
            تسجيل الدخول
          </button>
        </form>

        <div className="mt-8 text-center">
          <a href="/" className="text-[9px] font-black text-zinc-600 hover:text-lime transition-colors uppercase tracking-widest">
            ← العودة للموقع الرئيسي
          </a>
        </div>
      </div>
    </div>
  );
}

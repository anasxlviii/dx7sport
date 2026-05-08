'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NewArticlePage() {
  const router = useRouter();
  const [postContent, setPostContent] = useState('');
  const [postUrl, setPostUrl] = useState('');
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<Array<{ name: string; status: string; error?: string }>>([]);
  const [error, setError] = useState('');

  async function runPipeline() {
    if (!postContent.trim() && !postUrl.trim()) {
      setError('Please enter either a URL or raw content');
      return;
    }

    setRunning(true);
    setError('');
    setSteps([
      { name: 'Extract Topic', status: 'running' },
      { name: 'Deep Search', status: 'pending' },
      { name: 'Generate Article', status: 'pending' },
      { name: 'Save to Database', status: 'pending' },
    ]);

    try {
      const response = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postContent, postUrl: postUrl || undefined }),
      });

      const data = await response.json();

      if (data.success) {
        setSteps(data.steps);
        setTimeout(() => {
          router.push(`/admin/article/${data.article.id}`);
        }, 1000);
      } else {
        setSteps(data.steps || []);
        setError(data.error || 'Pipeline failed');
      }
    } catch (err) {
      setError('Failed to run pipeline. Please check your API keys.');
      setSteps(steps.map(s => ({ ...s, status: 'failed' })));
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-12">
        <Link href="/admin" className="text-xs font-bold uppercase tracking-widest text-lime hover:text-white transition-colors">
          ← Back to Dashboard
        </Link>
        <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase mt-6">Generate Intel</h1>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-2">
          Transform raw social data into tactical reports
        </p>
      </div>

      {/* Input Form */}
      <div className="dxt-card p-10 mb-8">
        <div className="mb-8">
          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-3">
            Source URL (optional)
          </label>
          <input
            type="url"
            placeholder="https://www.facebook.com/..."
            value={postUrl}
            onChange={(e) => setPostUrl(e.target.value)}
            disabled={running}
            className="w-full bg-black border border-border-subtle px-6 py-3 text-sm text-white focus:outline-none focus:border-lime transition-all disabled:opacity-50"
          />
        </div>

        <div className="mb-8">
          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-3">
            Raw Intel Content (Optional if URL provided)
          </label>
          <textarea
            placeholder="Paste the raw social post here..."
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            disabled={running}
            rows={8}
            className="w-full bg-black border border-border-subtle px-6 py-4 text-sm text-white focus:outline-none focus:border-lime transition-all disabled:opacity-50 font-medium"
          />
          <p className="text-[10px] font-bold text-gray-600 mt-3 uppercase tracking-widest italic">
            Best results with: Breaking news, comparisons, or match rumors.
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 border border-red-900 bg-red-950/20 text-red-500 text-xs font-bold uppercase tracking-widest">
            {error}
          </div>
        )}

        <button
          onClick={runPipeline}
          disabled={running || (!postContent.trim() && !postUrl.trim())}
          className="w-full bg-lime text-black py-4 font-black uppercase tracking-[0.2em] text-sm hover:bg-white transition-all disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(179,212,0,0.2)]"
        >
          {running ? 'Processing Intel...' : 'Generate Article'}
        </button>
      </div>

      {/* Progress Steps */}
      {steps.length > 0 && (
        <div className="dxt-card p-10 border-lime/20">
          <h2 className="text-xs font-black text-lime uppercase tracking-[0.4em] mb-8">Pipeline Ops</h2>
          <div className="space-y-6">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-6 group">
                <div className={`w-8 h-8 flex items-center justify-center border font-black text-xs ${
                  step.status === 'completed' ? 'border-lime text-lime' :
                  step.status === 'running' ? 'border-white text-white animate-pulse' :
                  step.status === 'failed' ? 'border-red-600 text-red-600' :
                  'border-border-subtle text-gray-700'
                }`}>
                  {step.status === 'completed' ? '✓' :
                   step.status === 'running' ? '>>' :
                   step.status === 'failed' ? '!!' :
                   i + 1}
                </div>
                <div className="flex-1">
                  <span className={`text-xs font-bold uppercase tracking-widest ${
                    step.status === 'failed' ? 'text-red-600' : 
                    step.status === 'running' ? 'text-white' :
                    step.status === 'completed' ? 'text-gray-300' :
                    'text-gray-700'
                  }`}>
                    {step.name}
                  </span>
                  {step.error && (
                    <p className="text-[10px] text-red-600 font-bold uppercase mt-1 italic">{step.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Example Content */}
      {!running && (
        <div className="mt-8 dxt-card p-8 border-border-subtle border-dashed bg-transparent opacity-60 hover:opacity-100 transition-opacity">
          <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 italic">Simulation Content:</h3>
          <p className="text-xs text-gray-400 font-medium leading-relaxed italic">
            "Breaking: Real Madrid is close to signing Kylian Mbappé from PSG. The 25-year-old
            French striker has been linked with a move to Spain for months. Would this be
            the final piece for Madrid's Champions League dreams?"
          </p>
          <button
            onClick={() => setPostContent("Breaking: Real Madrid is close to signing Kylian Mbappé from PSG. The 25-year-old French striker has been linked with a move to Spain for months. Would this be the final piece for Madrid's Champions League dreams?")}
            className="mt-4 text-[10px] font-black text-lime uppercase tracking-[0.2em] hover:text-white transition-colors"
          >
            Load Intel →
          </button>
        </div>
      )}
    </div>
  );
}

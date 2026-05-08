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
    if (!postContent.trim()) {
      setError('Please enter some content');
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin" className="text-blue-600 hover:text-blue-800">
          ← Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">Create New Article</h1>
        <p className="text-gray-600 mt-1">
          Paste a Facebook post and let AI create a researched article
        </p>
      </div>

      {/* Input Form */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Facebook Post URL (optional)
          </label>
          <input
            type="url"
            placeholder="https://www.facebook.com/..."
            value={postUrl}
            onChange={(e) => setPostUrl(e.target.value)}
            disabled={running}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Post Content *
          </label>
          <textarea
            placeholder="Paste the Facebook post content here..."
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            disabled={running}
            rows={8}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
          <p className="text-sm text-gray-500 mt-1">
            News, comparisons, polls, or match reports work best
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        <button
          onClick={runPipeline}
          disabled={running || !postContent.trim()}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {running ? 'Generating Article...' : 'Generate Article'}
        </button>
      </div>

      {/* Progress Steps */}
      {steps.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pipeline Progress</h2>
          <div className="space-y-3">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  step.status === 'completed' ? 'bg-green-500 text-white' :
                  step.status === 'running' ? 'bg-blue-500 text-white animate-pulse' :
                  step.status === 'failed' ? 'bg-red-500 text-white' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {step.status === 'completed' ? '✓' :
                   step.status === 'running' ? '→' :
                   step.status === 'failed' ? '✗' :
                   i + 1}
                </div>
                <span className={`flex-1 ${
                  step.status === 'failed' ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {step.name}
                </span>
                {step.error && (
                  <span className="text-sm text-red-600">{step.error}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Example Content */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Example Content to Try:</h3>
        <p className="text-sm text-blue-800">
          "Breaking: Real Madrid is close to signing Kylian Mbappé from PSG. The 25-year-old
          French striker has been linked with a move to Spain for months. Would this be
          the final piece for Madrid's Champions League dreams?"
        </p>
        <button
          onClick={() => setPostContent("Breaking: Real Madrid is close to signing Kylian Mbappé from PSG. The 25-year-old French striker has been linked with a move to Spain for months. Would this be the final piece for Madrid's Champions League dreams?")}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          disabled={running}
        >
          Use this example →
        </button>
      </div>
    </div>
  );
}

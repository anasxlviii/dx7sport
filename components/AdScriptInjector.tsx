'use client';

import { AdComponent } from './AdComponent';

/**
 * Global script injector for layouts.
 * Used for pop-unders, social bars, or global analytics.
 */
export function AdScriptInjector({ code }: { code: string }) {
  if (!code) return null;
  
  return (
    <div className="ad-global-container">
      <AdComponent code={code} noIframe={true} />
    </div>
  );
}

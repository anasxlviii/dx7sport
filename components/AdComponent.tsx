'use client';

import { useEffect, useRef } from 'react';

interface Props {
  code: string;
  className?: string;
  noIframe?: boolean;
}

/**
 * AdComponent - Handles Adsterra and other third-party ad scripts.
 * 
 * isGlobal: If true, injects directly into the DOM (good for pop-unders/head scripts).
 * Otherwise, uses an iframe-based isolation strategy (best for banner ads).
 */
export function AdComponent({ code, className, noIframe = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !code) return;

    // Clear previous
    containerRef.current.innerHTML = '';

    if (noIframe) {
      // DIRECT INJECTION (For Pop-unders, Social Bars)
      const div = document.createElement('div');
      div.innerHTML = code;
      const nodes = Array.from(div.childNodes);
      
      nodes.forEach(node => {
        if (node.nodeName === 'SCRIPT') {
          const oldScript = node as HTMLScriptElement;
          const newScript = document.createElement('script');
          Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
          if (oldScript.src) {
            newScript.src = oldScript.src;
          } else {
            newScript.textContent = oldScript.textContent;
          }
          containerRef.current?.appendChild(newScript);
        } else {
          containerRef.current?.appendChild(node.cloneNode(true));
        }
      });
      return;
    }

    // IFRAME INJECTION (For Banners)
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.border = 'none';
    iframe.style.overflow = 'hidden';
    iframe.style.display = 'block';
    iframe.setAttribute('scrolling', 'no');
    iframe.style.height = '0px'; 

    containerRef.current.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html dir="rtl">
          <head>
            <style>
              body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; overflow: hidden; background: transparent; }
              #ad-container { width: 100%; display: flex; justify-content: center; }
            </style>
          </head>
          <body>
            <div id="ad-container">${code}</div>
            <script>
              function updateHeight() {
                const height = document.body.scrollHeight;
                if (height > 0) {
                  window.parent.postMessage({ type: 'setHeight', height: height }, '*');
                }
              }
              window.onload = updateHeight;
              setInterval(updateHeight, 1000);
            </script>
          </body>
        </html>
      `);
      doc.close();
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'setHeight' && event.source === iframe.contentWindow) {
        iframe.style.height = event.data.height + 'px';
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [code, noIframe]);

  return (
    <div 
      ref={containerRef} 
      className={className} 
      style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
    />
  );
}

import { useEffect, useState } from 'react';

/**
 * Resolves an employer's mark from their domain.
 *
 * PRODUCTION NOTE: do this server side when the assessment is created and store
 * the result. Resolving in the browser leaks the employer's domain to a third
 * party on every candidate view, costs a round trip on the most latency
 * sensitive screen in the product, and dies behind a strict CSP.
 *
 * Sources are ordered by the resolution they actually return. The favicon
 * services top out around 48px, which upscales into mush in a 42px slot on a
 * retina screen. A site's own apple icon is normally 180px or larger.
 */
const SOURCES = [
  (d: string) => `https://${d}/apple-touch-icon.png`,
  (d: string) => `https://${d}/apple-icon.png`,
  (d: string) => `https://${d}/apple-touch-icon-precomposed.png`,
  (d: string) => `https://www.google.com/s2/favicons?domain=${d}&sz=256`,
  (d: string) => `https://icons.duckduckgo.com/ip3/${d}.ico`,
];

/** Enough pixels for a 42px slot at 3x, so we can stop looking. */
const GOOD_ENOUGH = 160;
const MIN_USABLE = 24;
const PER_SOURCE_TIMEOUT = 2200;

export function cleanDomain(value: string): string {
  return value.trim().toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0];
}

export function displayName(domain: string): string {
  const base = domain.split('.')[0];
  return base ? base.charAt(0).toUpperCase() + base.slice(1) : '';
}

/**
 * Generated marks vary per employer but stay in a cool band. A free hash across
 * all 360 degrees lands on browns and olives, which read as a bug rather than
 * as branding.
 */
export function lettermarkHue(domain: string): number {
  let h = 0;
  for (let i = 0; i < domain.length; i++) h = (h * 31 + domain.charCodeAt(i)) % 91;
  return 196 + h;
}

export function useEmployerLogo(domain: string): string | null {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!domain) return;
    setSrc(null);

    let cancelled = false;
    let best: { url: string; width: number } | null = null;
    let i = 0;

    const attempt = () => {
      if (cancelled || i >= SOURCES.length) return;
      const url = SOURCES[i++](domain);
      const img = new Image();
      let settled = false;

      const timer = window.setTimeout(() => {
        if (settled) return;
        settled = true;
        attempt();
      }, PER_SOURCE_TIMEOUT);

      img.onload = () => {
        if (settled || cancelled) return;
        settled = true;
        window.clearTimeout(timer);

        // Keep the sharpest thing seen rather than the first thing that loads.
        if (img.naturalWidth >= MIN_USABLE && (!best || img.naturalWidth > best.width)) {
          best = { url, width: img.naturalWidth };
          setSrc(url);
        }
        if (best && best.width >= GOOD_ENOUGH) return;
        attempt();
      };

      img.onerror = () => {
        if (settled || cancelled) return;
        settled = true;
        window.clearTimeout(timer);
        attempt();
      };

      img.src = url;
    };

    attempt();
    return () => { cancelled = true; };
  }, [domain]);

  return src;
}

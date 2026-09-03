import { useCallback, useEffect, useRef, useState } from 'react';

export type GuardKind = 'paste' | 'copy' | 'menu' | 'blur';

export interface GuardEvent {
  kind: GuardKind;
  /** How many times this candidate has done this. Shown from the second time. */
  count: number;
  /** Bumped on every trip so the banner can replay its entrance. */
  seq: number;
}

/** Framed as fairness to the honest candidate, not as policing. */
export const GUARD_COPY: Record<GuardKind, { title: string; body: string }> = {
  paste: {
    title: 'Pasting is off here',
    body: 'Everyone answers in their own words, so the comparison stays fair. Noted for the hiring team.',
  },
  copy: {
    title: 'Copying is off here',
    body: 'The questions stay inside the assessment. Noted for the hiring team.',
  },
  menu: {
    title: 'Right click is off here',
    body: 'Same reason. The questions stay in the assessment.',
  },
  blur: {
    title: 'You left the page',
    body: 'Not a problem on its own, and there is no timer. The hiring team does see it though.',
  },
};

/** A tab switch and an app switch both fire. Collapse them into one count. */
const AWAY_DEBOUNCE = 600;

interface Options {
  /** Only guard while a question is on screen. */
  active: boolean;
  /** The answer field, so paste can be refused without blocking the candidate's own typing. */
  fieldRef: React.RefObject<HTMLTextAreaElement | null>;
  /** Fires on a refused paste, so the field can shake. */
  onRefusedPaste?: () => void;
}

export function useIntegrityGuard({ active, fieldRef, onRefusedPaste }: Options) {
  const [event, setEvent] = useState<GuardEvent | null>(null);
  const counts = useRef<Record<GuardKind, number>>({ paste: 0, copy: 0, menu: 0, blur: 0 });
  const seq = useRef(0);
  const lastAway = useRef(0);

  const trip = useCallback((kind: GuardKind) => {
    counts.current[kind] += 1;
    seq.current += 1;
    setEvent({ kind, count: counts.current[kind], seq: seq.current });
  }, []);

  const clear = useCallback(() => setEvent(null), []);

  const reset = useCallback(() => {
    counts.current = { paste: 0, copy: 0, menu: 0, blur: 0 };
    setEvent(null);
  }, []);

  useEffect(() => {
    if (!active) return;

    const field = fieldRef.current;

    const onPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      trip('paste');
      onRefusedPaste?.();
    };

    // Document level, not field level. Copying the question is the half worth
    // catching, and the question never touches the textarea.
    const onCopy = (e: ClipboardEvent) => {
      if ((e.target as HTMLElement | null)?.closest?.('[data-guard-exempt]')) return;
      e.preventDefault();
      trip('copy');
    };

    const onContextMenu = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (t === field || t?.closest?.('[data-guard-exempt]')) return;
      e.preventDefault();
      trip('menu');
    };

    const away = () => {
      const now = Date.now();
      if (now - lastAway.current < AWAY_DEBOUNCE) return;
      lastAway.current = now;
      trip('blur');
    };

    const onVisibility = () => { if (document.hidden) away(); };

    field?.addEventListener('paste', onPaste as EventListener);
    document.addEventListener('copy', onCopy);
    document.addEventListener('cut', onCopy);
    document.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', away);

    return () => {
      field?.removeEventListener('paste', onPaste as EventListener);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('cut', onCopy);
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', away);
    };
  }, [active, fieldRef, trip, onRefusedPaste]);

  return { event, clear, reset, counts: counts.current };
}

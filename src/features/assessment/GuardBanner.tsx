import { AlertCircle } from 'lucide-react';
import { GUARD_COPY, type GuardEvent } from './useIntegrityGuard';

interface Props {
  event: GuardEvent | null;
}

export function GuardBanner({ event }: Props) {
  if (!event) return null;
  const copy = GUARD_COPY[event.kind];

  return (
    <div
      /* keyed on seq so a repeat trip replays the entrance */
      key={event.seq}
      role="status"
      aria-live="polite"
      className="animate-guard-in mb-3.5 flex items-start gap-2.5 rounded-[10px] border border-[#F0DDBE] bg-[#FDF6EC] px-3.5 py-3"
    >
      <AlertCircle className="mt-px size-[15px] shrink-0 text-[#A9600C]" strokeWidth={2} />
      <p className="text-[13px] leading-snug text-[#7A4A0B]">
        <b className="font-semibold">{copy.title}.</b> {copy.body}
        {event.count > 1 && <b className="font-semibold"> {event.count} times.</b>}
      </p>
    </div>
  );
}

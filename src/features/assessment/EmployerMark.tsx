import { useEmployerLogo, lettermarkHue } from './useEmployerLogo';

type Size = 'sm' | 'lg';

interface Props {
  domain: string;
  name: string;
  size?: Size;
  className?: string;
}

const BOX: Record<Size, string> = {
  sm: 'size-[30px] rounded-lg text-[13px]',
  lg: 'size-[42px] rounded-[11px] text-base',
};

const LABEL: Record<Size, string> = {
  sm: 'text-sm',
  lg: 'text-[19px]',
};

/**
 * The employer leads, everywhere. The candidate is applying to them, not to us,
 * and an assessment that looks like the employer's is one they are proud to
 * send. That pride is the distribution.
 */
export function EmployerMark({ domain, name, size = 'lg', className = '' }: Props) {
  const logo = useEmployerLogo(domain);
  const hue = lettermarkHue(domain);

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span
        className={`${BOX[size]} grid shrink-0 place-items-center overflow-hidden font-bold tracking-tight text-white shadow-[0_1px_3px_rgba(10,58,160,0.16)]`}
        style={logo ? { background: '#fff' } : { background: `hsl(${hue} 52% 34%)` }}
      >
        {logo ? (
          <img
            src={logo}
            alt=""
            className="animate-mark-in size-full bg-white object-contain"
            /* a fresh key restarts the fade when the employer changes */
            key={logo}
          />
        ) : (
          (domain.charAt(0) || '?').toUpperCase()
        )}
      </span>
      <span className={`${LABEL[size]} font-semibold tracking-[-0.01em] text-ink`}>{name}</span>
    </div>
  );
}

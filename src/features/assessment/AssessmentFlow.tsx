import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Clock, List, Mail, CircleCheck } from 'lucide-react';
import { EmployerMark } from './EmployerMark';
import { GuardBanner } from './GuardBanner';
import { useIntegrityGuard } from './useIntegrityGuard';
import { QUESTIONS, WORD_LIMIT } from './questions';

type Step = 'intro' | 'question' | 'email' | 'done';

export interface AssessmentFlowProps {
  /** Employer domain, e.g. "shypp.io". Drives the mark and the display name. */
  employerDomain: string;
  employerName: string;
  roleTitle: string;
  estimatedMinutes?: number;
  /** Shows "Run it again" on the last screen. Demo only, never for candidates. */
  demo?: boolean;
  /** Called once, with the answers and the integrity tally, on submit. */
  onSubmit?: (payload: {
    email: string;
    answers: string[];
    flags: Record<string, number>;
  }) => void;
}

const countWords = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);
const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());

/* ------------------------------------------------------------------ */

export function AssessmentFlow({
  employerDomain,
  employerName,
  roleTitle,
  estimatedMinutes = 25,
  demo = false,
  onSubmit,
}: AssessmentFlowProps) {
  const [step, setStep] = useState<Step>('intro');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>(() => QUESTIONS.map(() => ''));
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [saved, setSaved] = useState(false);
  const [shake, setShake] = useState(0);
  const [sheen, setSheen] = useState(0);
  const [woke, setWoke] = useState(0);

  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const mailRef = useRef<HTMLInputElement>(null);
  const wasDisabled = useRef(true);

  const onRefusedPaste = useCallback(() => setShake((n) => n + 1), []);
  const { event: guardEvent, clear: clearGuard, reset: resetGuard, counts } =
    useIntegrityGuard({ active: step === 'question', fieldRef, onRefusedPaste });

  const question = QUESTIONS[index];
  const answer = answers[index];
  const words = countWords(answer);
  const canAdvance = words > 0;
  const isLast = index === QUESTIONS.length - 1;

  /* autosave. this is about a browser crash, not about revision: there is
     deliberately no way back, which is the founder's call and the point of
     the product's name. */
  useEffect(() => {
    if (!answer) { setSaved(false); return; }
    const t = window.setTimeout(() => setSaved(true), 700);
    return () => window.clearTimeout(t);
  }, [answer]);

  useEffect(() => {
    if (wasDisabled.current && canAdvance) setWoke((n) => n + 1);
    wasDisabled.current = !canAdvance;
  }, [canAdvance]);

  const goToQuestion = (next: number) => {
    setIndex(next);
    setSaved(Boolean(answers[next]));
    clearGuard();
    setSheen((n) => n + 1);
    window.requestAnimationFrame(() => fieldRef.current?.focus());
  };

  const start = () => {
    setIndex(0);
    setSheen((n) => n + 1);
    setStep('question');
  };

  const next = () => (isLast ? setStep('email') : goToQuestion(index + 1));

  const submit = () => {
    if (!isEmail(email)) {
      setEmailError(true);
      mailRef.current?.focus();
      return;
    }
    onSubmit?.({ email: email.trim(), answers, flags: { ...counts } });
    setStep('done');
  };

  const restart = () => {
    setAnswers(QUESTIONS.map(() => ''));
    setIndex(0);
    setEmail('');
    setEmailError(false);
    resetGuard();
    setStep('intro');
  };

  const progress = useMemo(
    () => ((index + 1) / QUESTIONS.length) * 100,
    [index],
  );

  return (
    <div className="relative min-h-screen bg-surface">
      {/* ambient wash, fixed to the host brand. the chrome should not change
          colour per employer, that reads as unstable. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(64rem 36rem at 50% -14%, rgb(0 123 255 / 0.13), transparent 68%),' +
            'radial-gradient(34rem 22rem at 96% 4%, rgb(0 123 255 / 0.07), transparent 70%),' +
            'radial-gradient(28rem 20rem at 2% 98%, rgb(0 123 255 / 0.05), transparent 70%)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center px-5 pt-8 pb-24 sm:pt-15">
        {/* a fixed floor so the card does not resize between a short question
            and a long one. jumping chrome makes a five step flow feel unstable. */}
        <div data-testid="assessment-card" className="flex w-full max-w-[560px] flex-col rounded-2xl border border-gray-200 bg-surface p-6 shadow-[0_1px_2px_rgb(10_58_160/0.05),0_8px_24px_rgb(10_58_160/0.06),0_32px_64px_-26px_rgb(0_123_255/0.16)] sm:h-[648px] sm:p-8">

          {step === 'intro' && (
            <section className="animate-rise flex flex-1 flex-col justify-center text-center">
              <EmployerMark
                domain={employerDomain}
                name={employerName}
                className="mb-5 justify-center"
              />
              <h1 className="mb-4.5 text-[23px] font-bold leading-tight tracking-[-0.022em] text-ink">
                {roleTitle}
              </h1>

              <div className="mb-5.5 flex flex-wrap justify-center gap-1.5">
                <Chip delay={140} icon={<List className="size-3.5" strokeWidth={2} />}>
                  {QUESTIONS.length} questions
                </Chip>
                <Chip delay={210} icon={<Clock className="size-3.5" strokeWidth={2} />}>
                  About {estimatedMinutes} minutes
                </Chip>
                <Chip delay={280} icon={<CircleCheck className="size-3.5" strokeWidth={2} />}>
                  Saves as you go
                </Chip>
              </div>

              <p className="mb-3.5 text-[15px] leading-relaxed text-muted">
                Written answers, and there are no right or wrong ones. The hiring team
                wants to see how you approach real situations.
              </p>
              <p className="mb-6.5 text-[15px] leading-relaxed text-muted">
                Answer as naturally as you would if you were talking it through with a
                future teammate.
              </p>

              <PrimaryButton onClick={start} full>Start</PrimaryButton>

              <p className="mt-4 border-t border-gray-100 pt-4 text-[13px] leading-normal text-gray-400">
                Answers are your own work. Pasting is off, and you get one pass at each question.
              </p>
            </section>
          )}

          {step === 'question' && (
            <section className="animate-slide flex flex-1 flex-col">
              <div className="mb-3.5 flex items-center justify-between gap-3.5">
                <EmployerMark domain={employerDomain} name={employerName} size="sm" />
                <span className="text-[12.5px] font-semibold tabular-nums text-gray-400">
                  {index + 1} of {QUESTIONS.length}
                </span>
              </div>

              <div className="mb-6.5 h-[5px] overflow-hidden rounded-full bg-gray-100">
                <div
                  className="relative h-full overflow-hidden rounded-full transition-[width] duration-500 ease-[cubic-bezier(0.2,0,0,1)]"
                  style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #3D9BFF, #0064D2)',
                  }}
                >
                  <span
                    key={sheen}
                    className="animate-sheen absolute inset-y-0 left-0 w-1/3 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent)]"
                  />
                </div>
              </div>

              <GuardBanner event={guardEvent} />

              {/* the question is not selectable. copying it out is the first half
                  of the actual cheat, and blocking paste only stops the return leg. */}
              <p className="mb-4 select-none text-[16.5px] font-medium leading-snug tracking-[-0.005em] text-ink">
                {question.text}
              </p>

              <div className="mb-5 grid select-none gap-2.5">
                {question.parts.map((part, i) => {
                  const done = words > (i + 1) * 40;
                  return (
                    <div key={part} className="grid grid-cols-[22px_1fr] items-start gap-2.5">
                      <b
                        key={`${index}-${i}-${done}`}
                        className={
                          'grid size-[22px] place-items-center rounded-[7px] border text-[11px] font-bold transition-colors duration-300 ' +
                          (done
                            ? 'animate-tick border-primary/30 bg-primary/10 text-primary'
                            : 'border-gray-200 bg-surface-muted text-gray-400')
                        }
                      >
                        {i + 1}
                      </b>
                      <span className="text-sm leading-snug text-muted">{part}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex-1" />

              <textarea
                ref={fieldRef}
                key={shake}
                value={answer}
                onChange={(e) => {
                  const v = e.target.value;
                  setAnswers((prev) => prev.map((a, i) => (i === index ? v : a)));
                }}
                placeholder="Type your answer here…"
                spellCheck
                data-guard-exempt
                className={
                  'h-[168px] w-full resize-none rounded-xl border p-4 sm:h-[196px] text-[15px] leading-relaxed text-ink outline-none transition placeholder:text-gray-300 focus:border-primary focus:ring-4 focus:ring-primary/12 ' +
                  (shake ? 'animate-shake border-[#F0DDBE]' : 'border-gray-200')
                }
              />

              <div className="mt-2.5 flex items-center justify-between gap-3 text-xs tabular-nums text-gray-400">
                <span className={saved ? 'inline-flex items-center gap-1.5' : 'invisible'}>
                  <Check className="size-3.5 text-[#17864F]" strokeWidth={2} />
                  Saved
                </span>
                <span className={words > 300 ? 'font-semibold text-[#A9600C]' : undefined}>
                  {words} / {WORD_LIMIT} words
                </span>
              </div>

              <div className="mt-4.5 flex justify-end">
                <PrimaryButton onClick={next} disabled={!canAdvance} wake={woke}>
                  {isLast ? 'Finish' : 'Next question'}
                </PrimaryButton>
              </div>
            </section>
          )}

          {step === 'email' && (
            <section className="animate-slide flex flex-1 flex-col justify-center text-center">
              <EmployerMark
                domain={employerDomain}
                name={employerName}
                className="mb-5 justify-center"
              />
              <h1 className="mb-4.5 text-[23px] font-bold leading-tight tracking-[-0.022em] text-ink">
                Where should we send your copy?
              </h1>
              <p className="mx-auto mb-5.5 max-w-[34ch] text-[15px] leading-relaxed text-muted">
                All {QUESTIONS.length} answers, in full, so they are yours to keep. This is
                also how {employerName} reaches you.
              </p>

              <form
                className="mx-auto grid w-full max-w-[380px] gap-2.5 text-left"
                onSubmit={(e) => { e.preventDefault(); submit(); }}
              >
                <label htmlFor="assessment-email" className="text-[12.5px] font-semibold text-muted">
                  Email address
                </label>
                <input
                  ref={mailRef}
                  id="assessment-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  spellCheck={false}
                  placeholder="you@example.com"
                  data-guard-exempt
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(false); }}
                  className={
                    'w-full rounded-xl border px-4 py-3.5 text-[15px] text-ink outline-none transition placeholder:text-gray-300 focus:border-primary focus:ring-4 focus:ring-primary/12 ' +
                    (emailError ? 'animate-shake border-[#F0DDBE]' : 'border-gray-200')
                  }
                />
                <span
                  className={
                    'text-[12.5px] leading-snug ' +
                    (emailError ? 'text-[#A9600C]' : 'text-gray-400')
                  }
                >
                  {emailError
                    ? 'That address does not look right. Check it and try again.'
                    : 'Used for your copy and this application. Nothing else.'}
                </span>
                {/* a submit button inside the form, so Enter works natively */}
                <button type="submit" className="sr-only">Submit answers</button>
              </form>

              <PrimaryButton onClick={submit} full className="mt-7">Submit answers</PrimaryButton>
            </section>
          )}

          {step === 'done' && (
            <section className="animate-slide flex flex-1 flex-col justify-center text-center">
              <div className="animate-seal mx-auto mb-5.5 grid size-16 place-items-center rounded-full border border-primary/25 bg-primary/10">
                <Check
                  className="assessment-seal size-7 text-primary"
                  strokeWidth={2.4}
                />
              </div>
              <h1 className="mb-4.5 text-[23px] font-bold leading-tight tracking-[-0.022em] text-ink">
                That&rsquo;s everything
              </h1>
              <p className="mb-0 text-[15px] leading-relaxed text-muted">
                Your answers are with the {employerName} hiring team.
              </p>

              <div className="mt-5.5 flex flex-wrap justify-center gap-1.5">
                <Chip delay={140} icon={<Mail className="size-3.5" strokeWidth={2} />}>
                  {email}
                </Chip>
              </div>

              {demo && (
              <button
                type="button"
                onClick={restart}
                className="mt-7 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-400 transition hover:bg-surface-muted hover:text-ink"
              >
                Run it again
              </button>
              )}
            </section>
          )}
        </div>

        <p className="mt-6 inline-flex items-center gap-2 text-[13px] text-gray-400">
          <img src="/YOC_logo_black_y.png" alt="" className="size-[26px] object-contain" />
          Assessment by Your Opportunity Co.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Chip({
  children,
  icon,
  delay = 0,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  delay?: number;
}) {
  return (
    <span
      style={{ animationDelay: `${delay}ms` }}
      className="animate-rise inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-surface-muted px-3 py-1.5 text-[13px] font-medium text-muted transition hover:-translate-y-px"
    >
      {icon}
      {children}
    </span>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
  full,
  wake,
  className = '',
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  full?: boolean;
  /** bump to replay the "now usable" pulse */
  wake?: number;
  className?: string;
}) {
  return (
    <button
      key={wake}
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        'rounded-xl px-5 py-3.5 text-sm font-bold transition ' +
        (full ? 'w-full ' : 'w-full sm:w-auto sm:min-w-[160px] ') +
        (disabled
          ? 'cursor-not-allowed bg-gray-200 text-gray-400 '
          : 'animate-wake bg-primary text-white hover:-translate-y-px hover:bg-primary-dark hover:shadow-[0_8px_18px_rgb(0_123_255/0.3)] active:translate-y-0 active:shadow-none ') +
        className
      }
    >
      {children}
    </button>
  );
}

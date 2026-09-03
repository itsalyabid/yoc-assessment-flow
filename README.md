# Candidate assessment flow

A rebuild of the Your Opportunity Co. candidate experience: intro, five questions,
email, done. Written to drop into your existing repo rather than to be translated
out of a prototype.

Built against your stack as it ships today, read from `assets/index-*.css` and the
live DOM: React 18, Vite, TypeScript, Tailwind v4, `lucide-react`, Inter.

## Dropping it in

Copy one folder:

```
src/features/assessment/
├── AssessmentFlow.tsx      the flow and its four screens
├── EmployerMark.tsx        logo or generated lettermark
├── GuardBanner.tsx         the integrity states
├── useEmployerLogo.ts      resolves an employer mark from a domain
├── useIntegrityGuard.ts    paste / copy / right click / leaving the page
├── questions.ts            the question set
└── assessment.css          motion, registered through @theme
```

Import the stylesheet once, after your Tailwind entry:

```css
@import "tailwindcss";
@import "./features/assessment/assessment.css";
```

Then render it:

```tsx
<AssessmentFlow
  employerDomain="shypp.io"
  employerName="Shypp"
  roleTitle="Product Designer"
  estimatedMinutes={25}
  onSubmit={({ email, answers, flags }) => {
    // flags: { paste, copy, menu, blur } counts for this candidate
  }}
/>
```

No new dependencies. It uses your existing `primary`, `primary-dark`, `ink`,
`muted`, `surface` and `surface-muted` tokens, and your `rounded-xl` / `rounded-2xl`
radii, so it inherits any theme change you make later.

## What changed, and why

**The employer leads.** Their mark and name sit at the top of every screen and you
sign the foot. Candidates are applying to them, not to you, and an assessment that
looks like the employer's is one they are proud to send. That pride is distribution.

**The cost is stated before the commitment.** Question count and a time range on the
intro. The information already existed, it was just withheld until after Start,
which is the most expensive place to lose someone.

**Multi-part questions are shown as parts.** Asking for three things inside one
paragraph reliably gets two of them answered, and the answer is the artifact you
sell. The numbers light up as the answer grows.

**Email is collected before submit.** The copy promises the candidate a copy, so
something has to ask for the address. It sits after question five, not on the intro,
so the frictionless start survives.

**Integrity is visible.** Paste, copy, right click and leaving the page each produce
a state instead of nothing. The wording frames it as fairness to the honest
candidate rather than as policing, and repeats show a count. The question text is
`user-select: none`, because copying the question out is the first half of the
actual cheat and blocking paste only stops the return leg.

**No back button.** Deliberate, per your reasoning on the call. Autosave is separate
and is about a browser crash, not revision.

## Two things that need your side

**`onSubmit` is a stub.** Wire it to your API. The `flags` object carries the
integrity tally for the report.

**Server-side signals.** Client-side guards can only catch what happens in the
browser, and they are visible to anyone who looks. Submission timing and input
cadence belong on your side, where they are cheap to compute and a candidate
cannot see them. Worth a conversation.

**One promise to keep or remove.** The intro says "Saves as you go". The autosave
indicator is real in the UI but nothing is persisted yet. Either wire it to storage
or drop the chip, because the one thing worse than not saving is saying you do.

## Notes

- `useEmployerLogo` resolves client side for the demo. **Do it server side** when the
  assessment is created and store the result: in the browser it leaks the employer's
  domain to a third party on every candidate view, costs a round trip on your most
  latency-sensitive screen, and dies behind a strict CSP.
- The generated lettermark is not only a fallback. Plenty of small employers have a
  bad favicon or none, and a clean generated mark beats a blurry 16px icon.
- Tested at 375, 768 and desktop. All motion is disabled under
  `prefers-reduced-motion`.

## Running the demo

```bash
npm install
npm run dev
```

Built by [shypp](https://shypp.io).

export interface Question {
  /** The scenario. Kept as one sentence so the parts below carry the asks. */
  text: string;
  /**
   * A multi-part question, split. Asking for three things inside one paragraph
   * reliably gets two of them answered, and the answer is the artifact the
   * employer pays to read.
   */
  parts: string[];
}

export const QUESTIONS: Question[] = [
  {
    text: 'You receive a one-page founder brief for a new AI-assisted onboarding flow, with vague user outcomes and no metrics.',
    parts: [
      'The first three deliverables you would produce in week one',
      'How you would prioritise them',
      'Which assumption you would validate first',
    ],
  },
  {
    text: 'A feature you shipped is being used half as much as you expected.',
    parts: ['How you would find out why', 'What you would change first'],
  },
  {
    text: 'An engineer tells you your design cannot be built in the time available.',
    parts: ['What you ask them', 'What you cut'],
  },
  {
    text: 'You have one week and no research budget.',
    parts: ['How you decide what to build', 'What you accept being wrong about'],
  },
  {
    text: 'Describe a piece of work you would do differently now.',
    parts: ['What it was', 'What changed your mind'],
  },
];

export const WORD_LIMIT = 350;

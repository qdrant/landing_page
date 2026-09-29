/* Deployment router for the "How to Choose a Qdrant Deployment" post.
 *
 * Markup lives in layouts/shortcodes/deployment-quiz.html. This file only moves
 * between steps and reveals one of the three result cards already in the page.
 *
 * Routing: a hard residency or VPC mandate is the only answer that gates out
 * Qdrant Cloud. Self-hosting needs operational signals to stack up (deep
 * expertise plus infrastructure-as-advantage). Everything else lands on Cloud.
 *
 *   q1 expert + q3 infra, no mandate        -> sh
 *   q2 hard + q1 expert + q3 infra          -> sh
 *   q2 hard, anything less                  -> hc
 *   some expertise, no mandate, product-led -> mc
 */

const WEIGHTS = {
  q1: { expert: { sh: 2 }, some: { mc: 1 }, none: { mc: 2 } },
  q2: { hard: { hc: 3 }, soft: { mc: 1 }, none: { mc: 2 } },
  q3: { infra: { sh: 2 }, both: { mc: 1 }, product: { mc: 2 } },
  q4: { slow: { sh: 1 }, mid: { mc: 1 }, fast: { mc: 2 } },
};

const LAST_STEP = 5;

export function score(answers) {
  const s = { sh: 0, hc: 0, mc: 0 };

  Object.keys(WEIGHTS).forEach((q) => {
    const weight = WEIGHTS[q][answers[q]];
    if (weight) {
      Object.keys(weight).forEach((model) => {
        s[model] += weight[model];
      });
    }
  });

  // A hard mandate rules out Cloud: managed-in-your-own-VPC, unless the team is
  // already deep enough to run it themselves.
  if (answers.q2 === 'hard') {
    return s.sh >= 4 ? 'sh' : 'hc';
  }

  const max = Math.max(s.sh, s.hc, s.mc);
  if (max === s.mc) return 'mc';
  return max === s.sh ? 'sh' : 'hc';
}

function initQuiz(root) {
  const steps = Array.from(root.querySelectorAll('[data-qdq-step]'));
  const progress = root.querySelector('[data-qdq-progress]');
  const cards = Array.from(root.querySelectorAll('[data-qdq-result]'));
  if (!steps.length) return;

  const answers = {};
  let step = 0;

  const render = () => {
    steps.forEach((s) => {
      s.classList.toggle('is-active', Number(s.dataset.qdqStep) === step);
    });
    if (progress) progress.style.width = (step / LAST_STEP) * 100 + '%';
  };

  const go = (to) => {
    step = Math.min(Math.max(to, 0), LAST_STEP);
    render();
  };

  const reveal = () => {
    const winner = score(answers);
    cards.forEach((c) => c.classList.toggle('is-shown', c.dataset.qdqResult === winner));
  };

  root.addEventListener('click', (event) => {
    const option = event.target.closest('[data-qdq-q]');
    if (option && root.contains(option)) {
      answers[option.dataset.qdqQ] = option.dataset.qdqV;
      if (step === LAST_STEP - 1) reveal();
      go(step + 1);
      return;
    }

    const action = event.target.closest('[data-qdq-act]');
    if (!action || !root.contains(action)) return;

    if (action.dataset.qdqAct === 'next') go(step + 1);
    if (action.dataset.qdqAct === 'prev') go(step - 1);
    if (action.dataset.qdqAct === 'restart') {
      Object.keys(answers).forEach((k) => delete answers[k]);
      cards.forEach((c) => c.classList.remove('is-shown'));
      go(0);
    }
  });

  // Only hide steps once the handler is wired, so a JS failure leaves the whole
  // questionnaire readable instead of a dead Start button.
  root.classList.add('is-ready');
  render();
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-deployment-quiz]').forEach(initQuiz);
});

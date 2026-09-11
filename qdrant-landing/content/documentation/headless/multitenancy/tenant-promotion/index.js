/*
 * tenant-promotion island — interactive replacement for tenant-promotion.png.
 *
 * Illustrates tiered multitenancy: small tenants (user_2/3/4) share the
 * `Default` fallback shard; a large tenant (user_1) already has its own
 * dedicated shard. Promote a small tenant to watch its points transfer into a
 * new dedicated shard (dashed "Partial" -> solid "Active") and leave the
 * Default shard. The promote buttons swap to a single Reset once promoted.
 *
 * Layout is balanced: a tall Default shard on the left, and user_1 + the
 * promoted shard stacked on the right at the same total height, so there is no
 * empty space. Pure SVG + CSS on the shared island design system
 * (islands.scss); tenant hues are the categorical palette.
 */

const NS = 'http://www.w3.org/2000/svg';

const SMALL = [
  { id: 'u2', label: 'user_2', count: 6 },
  { id: 'u3', label: 'user_3', count: 8 },
  { id: 'u4', label: 'user_4', count: 6 },
];
const TOTAL_SMALL = SMALL.reduce((n, t) => n + t.count, 0);

// Geometry (viewBox 720 x 250).
const DEF = { x: 2, y: 8, w: 290, h: 234, bx: 18, by: 54, bw: 258, bh: 168 };
const BIG = { x: 426, y: 8, w: 292, h: 112, bx: 442, by: 48, bw: 260, bh: 56 };
const PRO = { x: 426, y: 138, w: 292, h: 104, bx: 442, by: 178, bw: 260, bh: 48 };
const ARROW_Y = 190;

function el(name, attrs) {
  const node = document.createElementNS(NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  return node;
}

export function mount(node) {
  node.classList.add('qi-tp');

  node.innerHTML = [
    '<div class="qi-fig">',
    '  <div class="qi-controls">',
    '    <div class="qi-group qi-tp__promote-group">',
    '      <span class="qi-hint">Promote a tenant:</span>',
    SMALL.map(
      (t) =>
        `<button type="button" class="qi-chip qi-tp__btn qi-tp__btn--${t.id}" data-tenant="${t.id}">` +
        `<span class="qi-chip__swatch"></span>${t.label}</button>`,
    ).join(''),
    '    </div>',
    '    <button type="button" class="qi-chip qi-tp__reset" data-reset hidden>',
    '      <svg class="qi-chip__icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>Reset',
    '    </button>',
    '  </div>',
    '  <svg class="qi-svg qi-tp__svg" viewBox="0 0 720 250" role="img"',
    '    aria-label="Small tenants share the Default shard; user_1 has a dedicated shard. Promoting a tenant moves it to its own dedicated shard.">',
    '    <defs>',
    '      <marker id="qi-tp-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">',
    '        <path class="qi-tp__arrowhead" d="M 0 0 L 10 5 L 0 10 z"/>',
    '      </marker>',
    '    </defs>',
    // Promotion connector (hidden until a promotion happens)
    '    <g class="qi-tp__promo" style="display: none">',
    `      <path class="qi-tp__arrow" d="M ${DEF.x + DEF.w} ${ARROW_Y} L ${PRO.x - 4} ${ARROW_Y}" marker-end="url(#qi-tp-arrow)"/>`,
    `      <g class="qi-tp__pill" transform="translate(${(DEF.x + DEF.w + PRO.x) / 2 - 46} ${ARROW_Y - 34})">`,
    '        <rect class="qi-tp__pill-bg" x="0" y="0" width="92" height="26" rx="4"/>',
    '        <text class="qi-tp__pill-text" x="46" y="17">Promotion</text>',
    '      </g>',
    '    </g>',
    // Default (shared fallback) shard
    `    <rect class="qi-frame" x="${DEF.x}" y="${DEF.y}" width="${DEF.w}" height="${DEF.h}" rx="6"/>`,
    `    <text class="qi-frame-label" x="${DEF.x + 16}" y="${DEF.y + 28}">\`Default\` Shard</text>`,
    '    <g class="qi-tp__default-bars"></g>',
    // user_1 dedicated shard (static context)
    `    <rect class="qi-frame" x="${BIG.x}" y="${BIG.y}" width="${BIG.w}" height="${BIG.h}" rx="6"/>`,
    `    <text class="qi-frame-label" x="${BIG.x + 16}" y="${BIG.y + 28}">\`user_1\` Shard</text>`,
    '    <g class="qi-tp__big-bars"></g>',
    // Promoted (dedicated) shard — placeholder before promotion, fills on promotion
    `    <rect class="qi-frame qi-tp__frame--dashed" x="${PRO.x}" y="${PRO.y}" width="${PRO.w}" height="${PRO.h}" rx="6"/>`,
    `    <text class="qi-label qi-tp__placeholder" x="${PRO.x + PRO.w / 2}" y="${PRO.y + PRO.h / 2 + 4}" text-anchor="middle">a promoted tenant lands here</text>`,
    `    <text class="qi-frame-label qi-tp__promoted-label" x="${PRO.x + 16}" y="${PRO.y + 28}" style="display: none"></text>`,
    '    <g class="qi-tp__pro-bars"></g>',
    '  </svg>',
    '  <p class="qi-status qi-tp__status" role="status" aria-live="polite"></p>',
    '</div>',
  ].join('');

  const defG = node.querySelector('.qi-tp__default-bars');
  const bigG = node.querySelector('.qi-tp__big-bars');
  const proG = node.querySelector('.qi-tp__pro-bars');
  const promotedFrame = node.querySelector('.qi-tp__frame--dashed');
  const promotedLabel = node.querySelector('.qi-tp__promoted-label');
  const placeholder = node.querySelector('.qi-tp__placeholder');
  const promoConnector = node.querySelector('.qi-tp__promo');
  const statusEl = node.querySelector('.qi-tp__status');
  const promoteGroup = node.querySelector('.qi-tp__promote-group');
  const resetBtn = node.querySelector('.qi-tp__reset');
  const tenantBtns = [...node.querySelectorAll('[data-tenant]')];

  const slot = DEF.bw / TOTAL_SMALL;
  const barW = slot * 0.5;

  // Small-tenant points.
  const points = [];
  SMALL.forEach((t) => {
    for (let i = 0; i < t.count; i++) points.push({ id: `${t.id}-${i}`, tenant: t.id });
  });

  const defRects = {};
  points.forEach((p) => {
    const r = el('rect', { class: `qi-tp__bar qi-tp__bar--${p.tenant}`, x: DEF.bx, y: DEF.by, width: barW, height: DEF.bh, rx: 2 });
    defRects[p.id] = r;
    defG.appendChild(r);
  });

  const proRects = {};
  points.forEach((p) => {
    const r = el('rect', { class: `qi-tp__bar qi-tp__bar--${p.tenant} qi-tp__bar--pro`, x: PRO.bx, y: PRO.by, width: barW, height: PRO.bh, rx: 2 });
    proRects[p.id] = r;
    proG.appendChild(r);
  });

  // user_1 dedicated shard: static blue bars.
  const bigCount = 18;
  const bigSlot = BIG.bw / bigCount;
  const bigW = bigSlot * 0.5;
  for (let i = 0; i < bigCount; i++) {
    bigG.appendChild(el('rect', { class: 'qi-tp__bar qi-tp__bar--u1', x: BIG.bx + i * bigSlot + (bigSlot - bigW) / 2, y: BIG.by, width: bigW, height: BIG.bh, rx: 2 }));
  }

  let promoted = null;
  let timers = [];
  const clearTimers = () => {
    timers.forEach((t) => clearTimeout(t));
    timers = [];
  };

  function layoutDefault() {
    let pos = 0;
    SMALL.forEach((t) => {
      const gone = promoted === t.id;
      points
        .filter((p) => p.tenant === t.id)
        .forEach((p) => {
          const r = defRects[p.id];
          r.classList.toggle('is-gone', gone);
          if (!gone) {
            r.setAttribute('x', DEF.bx + pos * slot + (slot - barW) / 2);
            pos++;
          }
        });
    });
  }

  function render() {
    layoutDefault();
    promoteGroup.hidden = promoted != null;
    resetBtn.hidden = promoted == null;

    if (promoted == null) {
      const wasPromoted = points.some((p) => proRects[p.id].classList.contains('is-in'));
      promoConnector.style.display = 'none';
      node.style.removeProperty('--tp-arrow');
      promotedLabel.style.display = 'none';
      promotedFrame.classList.remove('is-active');
      // Fade the promoted bars out uniformly, and only reveal the placeholder
      // once they are gone, so the two never overlap.
      points.forEach((p) => {
        proRects[p.id].style.transitionDelay = '0s';
        proRects[p.id].classList.remove('is-in');
      });
      clearTimers();
      if (wasPromoted) {
        placeholder.style.display = 'none';
        timers.push(window.setTimeout(() => (placeholder.style.display = ''), 400));
      } else {
        placeholder.style.display = '';
      }
      statusEl.innerHTML = 'Small tenants share the <code>Default</code> shard. Promote one to give it its own.';
      return;
    }

    const t = SMALL.find((s) => s.id === promoted);
    placeholder.style.display = 'none';
    promoConnector.style.display = '';
    node.style.setProperty('--tp-arrow', `var(--tp-${promoted})`);
    promotedLabel.style.display = '';
    promotedLabel.textContent = `\`${t.label}\` Shard`;
    promotedFrame.classList.remove('is-active');

    // Reset every promoted-shard bar to its from-state, then transition the
    // chosen tenant's bars in. A forced reflow commits the from-state (more
    // robust than requestAnimationFrame, which pauses on hidden tabs).
    const mine = points.filter((p) => p.tenant === promoted);
    points.forEach((p) => proRects[p.id].classList.remove('is-in'));
    mine.forEach((p, i) => {
      const r = proRects[p.id];
      r.setAttribute('x', PRO.bx + i * slot + (slot - barW) / 2);
      r.style.transitionDelay = `${0.15 + i * 0.07}s`;
    });
    void proG.getBoundingClientRect();
    mine.forEach((p) => proRects[p.id].classList.add('is-in'));

    statusEl.innerHTML = `Transferring <b>${t.label}</b> to a new dedicated shard (<b>Partial</b>)…`;
    const settle = 0.15 + mine.length * 0.07 + 0.5;
    clearTimers();
    timers.push(
      window.setTimeout(() => {
        promotedFrame.classList.add('is-active');
        statusEl.innerHTML = `<b>${t.label}</b> now has a dedicated shard (<b>Active</b>); its requests route there.`;
      }, settle * 1000),
    );
  }

  tenantBtns.forEach((b) =>
    b.addEventListener('click', () => {
      if (promoted != null) return;
      promoted = b.dataset.tenant;
      render();
    }),
  );
  resetBtn.addEventListener('click', () => {
    clearTimers();
    promoted = null;
    render();
  });

  render();

  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
}

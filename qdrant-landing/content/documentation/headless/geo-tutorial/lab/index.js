/*
 * lab island for the geo search tutorial: a map and an embedding space showing
 * why a geo filter is not just a filter on top of vector search.
 *
 * 700 synthetic venues in Berlin have a place on the map and a place in
 * embedding space. The reader moves a search circle and changes its radius, and
 * three approaches try to find the 10 venues inside the circle that are closest
 * to the query in embedding space:
 *   - Search, then filter: take the best matches citywide, then drop the ones
 *     outside the circle.
 *   - Filter during search: walk a nearest-neighbor graph and skip nodes outside
 *     the circle. The filter can cut the graph into islands.
 *   - Qdrant: the same walk on a graph with extra links between nearby venues,
 *     with an exact scan when few venues match.
 *
 * This is a simplified simulation with sample data, not a benchmark. The data
 * is seeded, so the numbers quoted in the tutorial text (1 of 10, 37x, 48
 * islands) are reproducible. If the simulation changes, recompute them.
 *
 * Styles read the --im-* tokens of the immersive layout (layouts/documentation/
 * immersive.html), so this island belongs inside that layout.
 */

/* ---- simulation core ------------------------------------------------------- */

const SIM = (() => {
  function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
  const R = rng(42);
  const gauss = () => { let u=0; while(!u) u=R(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*R()); };
  const KX = 67.8, KY = 111.32, LON0 = 13.405, LAT0 = 52.52;
  const BOX = { x0: -22, x1: 24, y0: -20, y1: 17 }; // km around Mitte
  const DISTRICTS = [
    ["Mitte",52.520,13.405,1.0,1.4],["Kreuzberg",52.498,13.403,.8,1.5],["Friedrichshain",52.514,13.454,.7,1.3],
    ["Prenzlauer Berg",52.540,13.424,.7,1.4],["Neukölln",52.479,13.437,.6,1.7],["Charlottenburg",52.513,13.300,.55,2.0],
    ["Schöneberg",52.484,13.354,.45,1.7],["Wedding",52.550,13.364,.35,1.7],["Steglitz",52.456,13.322,.22,2.4],
    ["Pankow",52.570,13.402,.18,2.4],["Spandau",52.535,13.200,.16,2.4],["Köpenick",52.445,13.576,.14,2.8],
    ["Lichtenberg",52.514,13.499,.2,2.4],["Tempelhof",52.466,13.386,.18,2.0]
  ].map(([name,lat,lon,w,s]) => ({ name, x:(lon-LON0)*KX, y:(lat-LAT0)*KY, w, s }));
  const CATS = [
    ["Specialty coffee",.30,.30],["Coworking",.18,.46],["Bookstores",.30,.62],["Bakeries",.48,.20],
    ["Ramen & noodles",.70,.24],["Vegan kitchens",.62,.42],["Natural wine",.82,.52],["Cocktail bars",.72,.70],
    ["Techno clubs",.52,.84],["Galleries",.40,.70],["Vintage shops",.16,.80]
  ].map(([name,x,y]) => ({ name, x, y }));
  const N = 700;
  const gx = new Float32Array(N), gy = new Float32Array(N), vx = new Float32Array(N), vy = new Float32Array(N), cat = new Uint8Array(N), lvl = new Float32Array(N);
  const wsum = DISTRICTS.reduce((a,d)=>a+d.w,0);
  for (let i=0;i<N;i++){
    if (R() < .07) { gx[i] = BOX.x0 + R()*(BOX.x1-BOX.x0); gy[i] = BOX.y0 + R()*(BOX.y1-BOX.y0); }
    else { let t=R()*wsum, d=DISTRICTS[0]; for (const D of DISTRICTS){ t-=D.w; if (t<=0){ d=D; break; } }
      do { gx[i]=d.x+gauss()*d.s; gy[i]=d.y+gauss()*d.s; } while (gx[i]<BOX.x0||gx[i]>BOX.x1||gy[i]<BOX.y0||gy[i]>BOX.y1); }
    const c = Math.floor(R()*CATS.length); cat[i]=c;
    vx[i] = CATS[c].x + gauss()*.06; vy[i] = CATS[c].y + gauss()*.06;
    lvl[i] = R();
  }
  const vd = (i,x,y) => { const a=vx[i]-x, b=vy[i]-y; return a*a+b*b; };
  function knn(ids, M, adj){
    for (const i of ids){
      const best = [];
      for (const j of ids){ if (j===i) continue; const d=vd(j,vx[i],vy[i]);
        if (best.length<M || d<best[best.length-1][0]){ best.push([d,j]); best.sort((a,b)=>a[0]-b[0]); if (best.length>M) best.pop(); } }
      for (const [,j] of best){ adj[i].add(j); adj[j].add(i); }
    }
  }
  const all = Array.from({length:N},(_,i)=>i);
  const base = Array.from({length:N},()=>new Set());
  knn(all, 6, base);
  // geo blocks: smallest quadtree cells holding more than T points
  const T = 16, blocks = [];
  (function quad(x0,y0,s,ids,depth){
    if (ids.length <= T) return false;
    const h=s/2, kids=[[],[],[],[]];
    for (const i of ids) kids[(gx[i]>=x0+h?1:0)+(gy[i]>=y0+h?2:0)].push(i);
    let child=false;
    if (depth<10) kids.forEach((k,q)=>{ if (quad(x0+(q&1)*h, y0+(q>>1)*h, h, k, depth+1)) child=true; });
    if (ids.length < N*0.6) blocks.push({x0,y0,s,ids});
    return true;
  })(BOX.x0, BOX.y0, Math.max(BOX.x1-BOX.x0, BOX.y1-BOX.y0), all, 0);
  const extra = Array.from({length:N},()=>new Set());
  for (const b of blocks) knn(b.ids, 8, extra);
  const geoAware = base.map((s,i)=>{ const u=new Set(s); for (const j of extra[i]) u.add(j); return u; });
  const extraEdges = []; extra.forEach((s,i)=>{ for (const j of s) if (j>i && !base[i].has(j)) extraEdges.push(i,j); });
  const baseEdges = []; base.forEach((s,i)=>{ for (const j of s) if (j>i) baseEdges.push(i,j); });
  let globalEntry = 0; for (let i=1;i<N;i++) if (lvl[i]>lvl[globalEntry]) globalEntry=i;

  function beam(adj, entry, qx, qy, ok, ef){
    const seen = new Uint8Array(N), order=[]; seen[entry]=1; order.push(entry);
    let cand=[[vd(entry,qx,qy),entry]], res=[[vd(entry,qx,qy),entry]];
    while (cand.length){
      cand.sort((a,b)=>a[0]-b[0]); const [d,c]=cand.shift();
      if (res.length>=ef && d>res[res.length-1][0]) break;
      for (const n of adj[c]){ if (seen[n]) continue; seen[n]=1; if (!ok(n)) continue; order.push(n);
        const dn=vd(n,qx,qy);
        if (res.length<ef || dn<res[res.length-1][0]){ cand.push([dn,n]); res.push([dn,n]); res.sort((a,b)=>a[0]-b[0]); if (res.length>ef) res.pop(); } }
    }
    return { res: res.map(r=>r[1]), order };
  }
  const K = 10, EF = 64, POST_EF = 32, FS = 60;
  function run(strategy, cx, cy, r, qx, qy){
    const r2=r*r, inside = new Uint8Array(N); let count=0;
    for (let i=0;i<N;i++){ const a=gx[i]-cx, b=gy[i]-cy; if (a*a+b*b<=r2){ inside[i]=1; count++; } }
    const ok = i => inside[i]===1;
    const matching = []; for (let i=0;i<N;i++) if (inside[i]) matching.push(i);
    const truth = matching.map(i=>[vd(i,qx,qy),i]).sort((a,b)=>a[0]-b[0]).slice(0,K).map(x=>x[1]);
    let found=[], order=[], plan, graph=null;
    if (strategy==="post"){
      const s = beam(base, globalEntry, qx, qy, ()=>true, POST_EF); order=s.order; found=s.res.filter(ok).slice(0,K); plan="post"; graph="base";
    } else if (strategy==="qdrant" && count < FS){
      order=matching.slice(); found=truth.slice(); plan="exact";
    } else if (count>0){
      // entry point: the closest to the query among matching points on the upper layer
      let e=-1; for (const i of matching) if (lvl[i]>0.9 && (e<0 || vd(i,qx,qy)<vd(e,qx,qy))) e=i;
      if (e<0) for (const i of matching) if (e<0 || lvl[i]>lvl[e]) e=i;
      const adj = strategy==="qdrant" ? geoAware : base;
      const s = beam(adj, e, qx, qy, ok, EF); order=s.order; found=s.res.slice(0,K); plan="graph"; graph = strategy==="qdrant" ? "geo" : "base";
    } else plan = strategy==="qdrant" ? "exact" : (strategy==="post"?"post":"graph");
    const ts = new Set(truth); const hit = found.filter(i=>ts.has(i)).length;
    return { count, inside, truth, found, order, plan, graph, recall: truth.length ? hit/truth.length : 1, evals: order.length };
  }
  return { N, gx, gy, vx, vy, cat, CATS, DISTRICTS, BOX, blocks, baseEdges, extraEdges, run, T, FS, K, KX, KY, LON0, LAT0 };
})();

/* ---- mount ---------------------------------------------------------------- */

const PLACES = [
  ['Mitte', 0, 0],
  ['Neukölln', 2.1, -4.5],
  ['Spandau', -13.8, 1.6],
];
const QUERY = { x: 0.24, y: 0.38 };
const LABELED = ['Mitte', 'Kreuzberg', 'Neukölln', 'Charlottenburg', 'Spandau', 'Köpenick', 'Pankow'];
const R_MIN = 0.3; // km, the radius slider is logarithmic
const R_MAX = 15;

const STRATEGIES = [
  { id: 'post', label: 'Search, Then Filter', color: 'blue' },
  { id: 'graph', label: 'Filter During Search', color: 'orange' },
  { id: 'qdrant', label: 'Qdrant', color: 'red' },
];

const fmt = (n) => n.toLocaleString('en-US');
const radiusOf = (v) => R_MIN * Math.pow(R_MAX / R_MIN, v / 1000);
const sliderOf = (r) => Math.round((1000 * Math.log(r / R_MIN)) / Math.log(R_MAX / R_MIN));
const radiusLabel = (r) => (r < 1 ? `${Math.round(r * 100) * 10} m` : `${r < 10 ? r.toFixed(1) : Math.round(r)} km`);
const alpha = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
};

export function mount(node) {
  const S = SIM;
  node.classList.add('gl');
  node.innerHTML = `
    <div class="gl-lab">
      <div class="gl-bar">
        <div class="gl-grp"><span class="gl-label">Near</span><div class="gl-chips" role="group" aria-label="Search area center" data-places></div></div>
        <div class="gl-grp gl-grow">
          <label class="gl-label" data-radius-label>Radius</label>
          <input type="range" min="0" max="1000" step="1" data-radius aria-label="Search radius">
          <span class="gl-radius-val" data-radius-value></span>
        </div>
      </div>
      <div class="gl-panes">
        <div class="gl-pane">
          <div class="gl-pane-head"><span class="gl-title">On the Map</span><span class="gl-hint">Drag the circle</span></div>
          <canvas data-map style="display:block;width:100%;max-width:100%;aspect-ratio:1.24" tabindex="0" role="img" aria-label="Map of ${fmt(S.N)} venues with a circular search area. Drag it, or use the arrow keys, to move it."></canvas>
        </div>
        <div class="gl-pane">
          <div class="gl-pane-head"><span class="gl-title">In Embedding Space</span><span class="gl-hint">Query: “quiet café to work from”</span></div>
          <canvas data-vec style="display:block;width:100%;max-width:100%;aspect-ratio:1.24" role="img" aria-label="The same venues placed by meaning, with the query and the results marked."></canvas>
        </div>
      </div>
      <div class="gl-pane gl-pane--legend">
        <div class="gl-legend">
          <span><i class="gl-dot" style="background: var(--im-fg)"></i>Venue in the area</span>
          <span><i class="gl-dot" style="background: var(--im-faint)"></i>Outside the area</span>
          <span><i class="gl-dot" style="border: 2px solid var(--im-red)"></i>Returned</span>
          <span><i class="gl-dot" style="border: 2px dashed var(--im-muted)"></i>Missed</span>
          <span data-legend-links><i class="gl-line" style="background: var(--im-muted)"></i>Index links left after filtering</span>
          <span data-legend-geo><i class="gl-line" style="background: var(--im-violet)"></i>Qdrant's extra geo links</span>
        </div>
      </div>
      <div class="gl-summary" role="status" aria-live="polite" data-summary></div>
      <div class="gl-results" role="group" aria-label="Search approach" data-results></div>
    </div>`;

  const $ = (sel) => node.querySelector(sel);
  const radiusEl = $('[data-radius]');
  const radiusValueEl = $('[data-radius-value]');
  const placesEl = $('[data-places]');
  const resultsEl = $('[data-results]');
  const summaryEl = $('[data-summary]');
  const legendLinks = $('[data-legend-links]');
  const legendGeo = $('[data-legend-geo]');
  const cv = { map: $('[data-map]'), vec: $('[data-vec]') };
  const ctx = {};
  const dim = {};
  const st = { cx: 0, cy: 0, r: 2, s: 'qdrant', res: {} };

  radiusEl.id = `gl-radius-${Math.random().toString(36).slice(2, 8)}`;
  $('[data-radius-label]').setAttribute('for', radiusEl.id);

  let C = {};
  const readColors = () => {
    const cs = getComputedStyle(node);
    for (const k of ['fg', 'muted', 'faint', 'grid', 'red', 'violet']) C[k] = cs.getPropertyValue(`--im-${k}`).trim();
  };

  function setup() {
    const d = window.devicePixelRatio || 1;
    for (const k in cv) {
      const r = cv[k].getBoundingClientRect();
      dim[k] = { w: r.width, h: r.height };
      cv[k].width = Math.round(r.width * d);
      cv[k].height = Math.round(r.height * d);
      ctx[k] = cv[k].getContext('2d');
      ctx[k].setTransform(d, 0, 0, d, 0, 0);
    }
  }
  function mapT() {
    const { w, h } = dim.map;
    const bw = S.BOX.x1 - S.BOX.x0;
    const bh = S.BOX.y1 - S.BOX.y0;
    const pad = 6;
    const k = Math.min((w - 2 * pad) / bw, (h - 2 * pad) / bh);
    const ox = (w - bw * k) / 2;
    const oy = (h - bh * k) / 2;
    return { k, X: (x) => ox + (x - S.BOX.x0) * k, Y: (y) => oy + (S.BOX.y1 - y) * k, ix: (px) => (px - ox) / k + S.BOX.x0, iy: (py) => S.BOX.y1 - (py - oy) / k };
  }
  function vecT() {
    const { w, h } = dim.vec;
    const pad = 14;
    return { X: (x) => pad + x * (w - 2 * pad), Y: (y) => pad + (1 - y) * (h - 2 * pad) };
  }
  const ring = (c, x, y, r) => { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.stroke(); };
  const dot = (c, x, y, r) => { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); };

  function drawMap() {
    const c = ctx.map;
    const { w, h } = dim.map;
    const t = mapT();
    const res = st.res[st.s];
    c.clearRect(0, 0, w, h);
    c.strokeStyle = C.grid;
    c.lineWidth = 1;
    for (let x = -20; x <= 24; x += 5) { const px = Math.round(t.X(x)) + 0.5; c.beginPath(); c.moveTo(px, 0); c.lineTo(px, h); c.stroke(); }
    for (let y = -20; y <= 17; y += 5) { const py = Math.round(t.Y(y)) + 0.5; c.beginPath(); c.moveTo(0, py); c.lineTo(w, py); c.stroke(); }
    for (let i = 0; i < S.N; i++) { const inn = res.inside[i]; c.fillStyle = inn ? C.fg : C.faint; dot(c, t.X(S.gx[i]), t.Y(S.gy[i]), inn ? 1.8 : 1.4); }
    const px = t.X(st.cx);
    const py = t.Y(st.cy);
    c.beginPath();
    c.arc(px, py, Math.max(2, st.r * t.k), 0, Math.PI * 2);
    c.fillStyle = alpha(C.red, 0.1);
    c.fill();
    c.strokeStyle = C.red;
    c.lineWidth = 1.5;
    c.stroke();
    for (const i of res.found) ring(c, t.X(S.gx[i]), t.Y(S.gy[i]), 4.5);
    c.font = "500 11px 'Mona Sans', sans-serif";
    c.fillStyle = C.muted;
    c.textAlign = 'center';
    for (const d of S.DISTRICTS) if (LABELED.includes(d.name)) c.fillText(d.name, t.X(d.x), t.Y(d.y) + (d.name === 'Kreuzberg' ? 18 : -16));
    const sb = 5 * t.k;
    const sx = w - sb - 14;
    const sy = h - 14;
    c.strokeStyle = C.muted;
    c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(sx, sy - 4); c.lineTo(sx, sy); c.lineTo(sx + sb, sy); c.lineTo(sx + sb, sy - 4); c.stroke();
    c.fillStyle = C.muted;
    c.font = "10px 'Geist Mono', monospace";
    c.fillText('5 km', sx + sb / 2, sy - 6);
    c.textAlign = 'left';
  }

  function edges(c, list, inn, t) {
    c.beginPath();
    for (let e = 0; e < list.length; e += 2) {
      const a = list[e];
      const b = list[e + 1];
      if (!(inn[a] && inn[b])) continue;
      c.moveTo(t.X(S.vx[a]), t.Y(S.vy[a]));
      c.lineTo(t.X(S.vx[b]), t.Y(S.vy[b]));
    }
    c.stroke();
  }
  function drawVec() {
    const c = ctx.vec;
    const { w, h } = dim.vec;
    const t = vecT();
    const res = st.res[st.s];
    const inn = res.inside;
    c.clearRect(0, 0, w, h);
    c.font = "500 11px 'Mona Sans', sans-serif";
    c.textAlign = 'center';
    c.fillStyle = C.muted;
    for (const k of S.CATS) c.fillText(k.name, t.X(k.x), t.Y(k.y + 0.12));
    c.textAlign = 'left';
    if (res.graph) { c.lineWidth = 0.8; c.strokeStyle = alpha(C.muted, 0.45); edges(c, S.baseEdges, inn, t); }
    if (res.graph === 'geo') { c.lineWidth = 0.7; c.strokeStyle = alpha(C.violet, 0.35); edges(c, S.extraEdges, inn, t); }
    for (let i = 0; i < S.N; i++) { c.fillStyle = inn[i] ? C.fg : alpha(C.faint, 0.7); dot(c, t.X(S.vx[i]), t.Y(S.vy[i]), inn[i] ? 2.2 : 1.5); }
    const got = new Set(res.found);
    c.setLineDash([3, 2]);
    c.strokeStyle = C.muted;
    c.lineWidth = 1.3;
    for (const i of res.truth) if (!got.has(i)) ring(c, t.X(S.vx[i]), t.Y(S.vy[i]), 6);
    c.setLineDash([]);
    c.strokeStyle = C.red;
    c.lineWidth = 1.8;
    for (const i of res.found) ring(c, t.X(S.vx[i]), t.Y(S.vy[i]), 6);
    const qx = t.X(QUERY.x);
    const qy = t.Y(QUERY.y);
    c.strokeStyle = C.red;
    c.lineWidth = 2;
    c.beginPath(); c.moveTo(qx - 8, qy); c.lineTo(qx + 8, qy); c.moveTo(qx, qy - 8); c.lineTo(qx, qy + 8); c.stroke();
    c.fillStyle = C.red;
    c.font = "600 11px 'Geist Mono', monospace";
    c.fillText('query', qx + 10, qy - 8);
  }
  const drawAll = () => { drawMap(); drawVec(); };

  function why(s, r) {
    if (r.count === 0) return 'No venues in this area.';
    if (s === 'post') return r.recall >= 0.9 ? 'The area is large, so most top matches are already inside it.' : `Took the 32 best matches citywide. Only ${r.found.length} of them are inside the area.`;
    if (s === 'graph') return r.recall >= 0.9 ? 'Enough venues match that the index stays connected.' : `The filter cut the index into islands. The search got stuck on one with ${r.evals} venue${r.evals === 1 ? '' : 's'}.`;
    return r.plan === 'exact' ? `Only ${r.count} venues match, so Qdrant simply checks each one.` : 'Extra links between nearby venues keep the index connected inside the area.';
  }

  STRATEGIES.forEach((s) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'gl-res';
    b.dataset.s = s.id;
    b.style.setProperty('--c', `var(--im-${s.color})`);
    b.innerHTML = `<span class="gl-res__name"><i class="gl-res__sw"></i>${s.label}</span><span class="gl-res__big"></span><span class="gl-res__cnt"></span><p></p>`;
    b.addEventListener('click', () => { st.s = s.id; render(); });
    resultsEl.append(b);
  });

  function render() {
    for (const s of ['post', 'graph', 'qdrant']) st.res[s] = S.run(s, st.cx, st.cy, st.r, QUERY.x, QUERY.y);
    const r = st.res.qdrant;
    const want = Math.min(S.K, r.count);
    summaryEl.innerHTML = `<b>${fmt(r.count)} of ${fmt(S.N)} venues</b> are within ${radiusLabel(st.r)}. Each approach should return the ${want === 1 ? 'single' : want} best match${want === 1 ? '' : 'es'} among them.`;
    resultsEl.querySelectorAll('.gl-res').forEach((b) => {
      const s = b.dataset.s;
      const o = st.res[s];
      b.setAttribute('aria-pressed', String(s === st.s));
      const hit = o.found.filter((i) => o.truth.includes(i)).length;
      const w = Math.min(S.K, o.count);
      b.querySelector('.gl-res__big').textContent = o.count ? `${Math.round((100 * hit) / w)}%` : '–';
      b.querySelector('.gl-res__cnt').textContent = o.count ? `${hit} of ${w} best matches found` : '';
      b.querySelector('p').textContent = why(s, o);
    });
    const cur = st.res[st.s];
    legendLinks.hidden = !cur.graph;
    legendGeo.hidden = cur.graph !== 'geo';
    drawAll();
  }

  function sync() {
    PLACES.forEach((p) => p.button.setAttribute('aria-pressed', String(Math.hypot(p[1] - st.cx, p[2] - st.cy) < 0.05)));
    radiusEl.value = sliderOf(st.r);
    radiusValueEl.textContent = radiusLabel(st.r);
  }
  PLACES.forEach((p) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'gl-chip';
    b.textContent = p[0];
    b.addEventListener('click', () => { st.cx = p[1]; st.cy = p[2]; sync(); render(); });
    placesEl.append(b);
    p.button = b;
  });
  radiusEl.addEventListener('input', (e) => { st.r = radiusOf(+e.target.value); radiusValueEl.textContent = radiusLabel(st.r); render(); });

  let dragging = false;
  const moveTo = (e) => {
    const r = cv.map.getBoundingClientRect();
    const t = mapT();
    st.cx = Math.max(S.BOX.x0, Math.min(S.BOX.x1, t.ix(e.clientX - r.left)));
    st.cy = Math.max(S.BOX.y0, Math.min(S.BOX.y1, t.iy(e.clientY - r.top)));
    sync();
    render();
  };
  cv.map.addEventListener('pointerdown', (e) => { dragging = true; cv.map.setPointerCapture(e.pointerId); moveTo(e); });
  cv.map.addEventListener('pointermove', (e) => { if (dragging) moveTo(e); });
  cv.map.addEventListener('pointerup', () => { dragging = false; });
  cv.map.addEventListener('pointercancel', () => { dragging = false; });
  cv.map.addEventListener('keydown', (e) => {
    const step = { ArrowLeft: [-0.5, 0], ArrowRight: [0.5, 0], ArrowUp: [0, 0.5], ArrowDown: [0, -0.5] }[e.key];
    if (!step) return;
    e.preventDefault();
    st.cx = Math.max(S.BOX.x0, Math.min(S.BOX.x1, st.cx + step[0]));
    st.cy = Math.max(S.BOX.y0, Math.min(S.BOX.y1, st.cy + step[1]));
    sync();
    render();
  });

  readColors();
  setup();
  sync();
  render();
  node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));

  // The canvases follow the page theme and the width of the column.
  const redraw = () => { readColors(); drawAll(); };
  new MutationObserver(redraw).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', redraw);
  // The island loader adds this island's stylesheet and mounts the module without
  // waiting for it, so on a cold load the canvases can change size after mount().
  // Watch the canvases themselves, not only the column, and redraw when one moves.
  const resizer = new ResizeObserver(() => {
    const moved = Object.keys(cv).some((k) => {
      const r = cv[k].getBoundingClientRect();
      return Math.abs(r.width - dim[k].w) >= 1 || Math.abs(r.height - dim[k].h) >= 1;
    });
    if (!moved) return;
    setup();
    drawAll();
  });
  resizer.observe(cv.map);
  resizer.observe(cv.vec);
  if (document.fonts) document.fonts.ready.then(drawAll);
}

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';

const source = await readFile(new URL('./index.js', import.meta.url), 'utf8');
const data = JSON.parse(await readFile(new URL('../../../../../static/guides_data/chunking/media-demo/results.json', import.meta.url), 'utf8'));
let instance = 0;
const flush = async () => { for (let i = 0; i < 10; i++) await Promise.resolve(); };

async function fixture(t, { metadata = true, fetchFails = false } = {}) {
  const dom = new JSDOM('<main><div data-media-kind="video"><div id="video"></div></div><div data-media-kind="audio"><div id="audio"></div></div></main>', { url: 'https://example.test/' });
  const previous = { fetch: globalThis.fetch, CustomEvent: globalThis.CustomEvent };
  globalThis.CustomEvent = dom.window.CustomEvent;
  let fetches = 0;
  globalThis.fetch = async () => {
    fetches++;
    if (fetchFails) throw new Error('Network unavailable');
    return { ok: true, json: async () => structuredClone(data) };
  };
  const state = new WeakMap();
  const get = player => {
    if (!state.has(player)) state.set(player, { ready: metadata ? 1 : 0, paused: true, seeking: false, time: 0, plays: 0, pauses: 0, seek: 0 });
    return state.get(player);
  };
  const prototype = dom.window.HTMLMediaElement.prototype;
  Object.defineProperties(prototype, {
    readyState: { get() { return get(this).ready; } },
    paused: { get() { return get(this).paused; } },
    seeking: { get() { return get(this).seeking; } },
    currentTime: {
      get() { return get(this).time; },
      set(value) {
        const current = get(this);
        const request = ++current.seek;
        current.time = value;
        current.seeking = true;
        this.dispatchEvent(new dom.window.Event('seeking'));
        queueMicrotask(() => {
          if (request !== current.seek) return;
          current.seeking = false;
          this.dispatchEvent(new dom.window.Event('seeked'));
        });
      },
    },
  });
  prototype.play = function () {
    const current = get(this);
    current.plays++;
    current.paused = false;
    this.dispatchEvent(new dom.window.Event('play'));
    return Promise.resolve();
  };
  prototype.pause = function () {
    const current = get(this);
    if (current.paused) return;
    current.pauses++;
    current.paused = true;
    queueMicrotask(() => this.dispatchEvent(new dom.window.Event('pause')));
  };
  const { mount } = await import(`data:text/javascript;base64,${Buffer.from(`${source}\n// test instance ${instance++}`).toString('base64')}`);
  t.after(() => {
    globalThis.fetch = previous.fetch;
    if (previous.CustomEvent === undefined) delete globalThis.CustomEvent;
    else globalThis.CustomEvent = previous.CustomEvent;
    dom.window.close();
  });
  return { dom, document: dom.window.document, mount, get, fetches: () => fetches };
}

test('two inline players share results, retain real content, and browse all frames without navigation', async t => {
  const { document, mount, get, fetches } = await fixture(t);
  const videoNode = document.querySelector('#video');
  const audioNode = document.querySelector('#audio');
  const ready = [];
  document.addEventListener('island:ready', event => ready.push(event.target));
  await Promise.all([mount(videoNode), mount(audioNode)]);
  assert.equal(fetches(), 1);
  assert.deepEqual(new Set(ready), new Set([videoNode, audioNode]));
  assert.equal(videoNode.querySelectorAll('[data-index]').length, 6);
  assert.equal(audioNode.querySelectorAll('[data-index]').length, 8);
  assert.equal(videoNode.querySelector('h4').textContent, 'Apollo 11 first steps on the moon');
  assert.equal(videoNode.querySelector('.qi-inline-media__credit').textContent, 'Source: NASA');
  assert.equal(videoNode.querySelector('.qi-inline-media__credit a').href, data.source.url);
  const player = videoNode.querySelector('video');
  assert.equal(player.currentTime, data.video.chunks[0].frame_time_sec);
  const last = videoNode.querySelector('[data-index="5"]');
  last.focus();
  last.querySelector('img').click();
  await flush();
  assert.equal(document.activeElement, last);
  assert.equal(player.currentTime, data.video.chunks[5].frame_time_sec);
  assert.equal(get(player).plays, 0);
  assert.equal(last.getAttribute('aria-pressed'), 'true');
  assert.match(videoNode.querySelector('[data-selection]').textContent, /Frame 6 of 6/);
  assert.equal(audioNode.querySelector('[data-index="0"]').getAttribute('aria-pressed'), 'true');
});

test('latest frame request wins when metadata arrives after multiple selections', async t => {
  const { dom, document, mount, get } = await fixture(t, { metadata: false });
  const node = document.querySelector('#video');
  const mounting = mount(node);
  await flush();
  node.querySelector('[data-index="3"]').click();
  node.querySelector('[data-index="5"]').click();
  const player = node.querySelector('video');
  get(player).ready = 1;
  player.dispatchEvent(new dom.window.Event('loadedmetadata'));
  await mounting;
  await flush();
  assert.equal(player.currentTime, data.video.chunks[5].frame_time_sec);
  assert.equal(get(player).plays, 0);
  assert.equal(node.querySelector('[data-index="5"]').getAttribute('aria-pressed'), 'true');
});

test('audio selection preserves raw ASR, highlights its interval, and pauses the other player', async t => {
  const { dom, document, mount, get } = await fixture(t);
  const video = document.querySelector('#video');
  const audio = document.querySelector('#audio');
  await Promise.all([mount(video), mount(audio)]);
  video.querySelector('[data-play]').click();
  await flush();
  const videoPlayer = video.querySelector('video');
  assert.equal(get(videoPlayer).paused, false);
  audio.querySelector('[data-index="3"]').click();
  await flush();
  const player = audio.querySelector('audio');
  const selected = data.audio.chunks[3];
  assert.equal(player.currentTime, selected.start_sec);
  assert.equal(get(player).paused, false);
  assert.equal(get(videoPlayer).paused, true);
  assert.equal(audio.querySelector('[data-transcript]').textContent, selected.text);
  assert.match(audio.querySelector('[data-transcript]').textContent, /fine green/);
  assert.equal(Number(audio.querySelector('[data-band]').getAttribute('x')), selected.start_sec / data.source.duration_sec * 600);
  assert.equal(audio.querySelector('[data-wave]').getAttribute('d').match(/M/g).length, data.audio.waveform.length);
  get(player).time = selected.end_sec + 0.01;
  player.dispatchEvent(new dom.window.Event('timeupdate'));
  assert.equal(get(player).paused, true);
});

test('rapid audio selections cancel stale autoplay; chunk buttons pause and replay without native controls', async t => {
  const { dom, document, mount, get } = await fixture(t);
  const node = document.querySelector('#audio');
  await mount(node);
  const player = node.querySelector('audio');
  assert.equal(player.controls, false);
  assert.equal(player.hidden, true);
  node.querySelector('[data-index="1"]').click();
  node.querySelector('[data-index="3"]').click();
  await flush();
  assert.equal(get(player).plays, 1);
  assert.equal(player.currentTime, data.audio.chunks[3].start_sec);
  assert.match(node.querySelector('[data-index="3"]').getAttribute('aria-label'), /^Pause chunk 4/);
  node.querySelector('[data-index="3"]').click();
  await flush();
  assert.equal(get(player).paused, true);
  assert.equal(get(player).plays, 1);
  assert.match(node.querySelector('[data-index="3"]').getAttribute('aria-label'), /^Play chunk 4/);
  node.querySelector('[data-index="3"]').click();
  await flush();
  assert.equal(get(player).paused, false);
  assert.equal(player.currentTime, data.audio.chunks[3].start_sec);
  player.currentTime = 50;
  await flush();
  player.dispatchEvent(new dom.window.Event('timeupdate'));
  assert.equal(get(player).paused, false, 'Native seeking must release the old clip end');
});

test('native audio playback and seeking update transcript and waveform without restarting playback', async t => {
  const { dom, document, mount, get } = await fixture(t);
  const node = document.querySelector('#audio');
  await mount(node);
  const player = node.querySelector('audio');
  await player.play();
  get(player).time = 37;
  player.dispatchEvent(new dom.window.Event('timeupdate'));
  assert.equal(node.querySelector('[data-transcript]').textContent, data.audio.chunks[5].text);
  assert.equal(node.querySelector('[data-index="5"]').getAttribute('aria-pressed'), 'true');
  assert.equal(get(player).plays, 1);
  player.currentTime = 30;
  await flush();
  assert.equal(node.querySelector('[data-transcript]').textContent, data.audio.chunks[4].text, 'Gaps retain the nearest preceding chunk');
  assert.equal(Number(node.querySelector('[data-band]').getAttribute('x')), data.audio.chunks[4].start_sec / data.source.duration_sec * 600);
  assert.equal(get(player).plays, 1);
  assert.equal(player.currentTime, 30);
});

test('fetch and metadata failures signal fallback without a late ready event', async t => {
  const unavailable = await fixture(t, { fetchFails: true });
  const first = unavailable.document.querySelector('#video');
  const events = [];
  first.addEventListener('island:error', () => events.push('error'));
  first.addEventListener('island:ready', () => events.push('ready'));
  await unavailable.mount(first);
  assert.deepEqual(events, ['error']);
  assert.equal(first.children.length, 0);

  const broken = await fixture(t, { metadata: false });
  const node = broken.document.querySelector('#audio');
  const statuses = [];
  node.addEventListener('island:error', () => statuses.push('error'));
  node.addEventListener('island:ready', () => statuses.push('ready'));
  const mounting = broken.mount(node);
  await flush();
  const player = node.querySelector('audio');
  player.dispatchEvent(new broken.dom.window.Event('error'));
  await mounting;
  broken.get(player).ready = 1;
  player.dispatchEvent(new broken.dom.window.Event('loadedmetadata'));
  await flush();
  assert.deepEqual(statuses, ['error']);
  assert.equal(node.children.length, 0);
});

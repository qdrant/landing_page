const BASE = '/guides_data/chunking/media-demo/';
const TITLE = 'Apollo 11 first steps on the moon';
let resultsPromise;
const players = new Set();

const escape = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

function time(seconds) {
  const value = Math.round(seconds * 100);
  const fraction = value % 100;
  return `${String(Math.floor(value / 6000)).padStart(2, '0')}:${String(Math.floor(value / 100) % 60).padStart(2, '0')}${fraction ? `.${String(fraction).padStart(2, '0')}` : ''}`;
}

const range = chunk => `${time(chunk.start_sec)}–${time(chunk.end_sec)}`;

function validate(data) {
  if (!Number.isFinite(data?.source?.duration_sec) || data.source.duration_sec <= 0 ||
      !Array.isArray(data.video?.chunks) || !data.video.chunks.length ||
      !Array.isArray(data.audio?.chunks) || !data.audio.chunks.length) {
    throw new Error('The media results are incomplete.');
  }
  for (const chunk of [...data.video.chunks, ...data.audio.chunks]) {
    if (!Number.isFinite(chunk.start_sec) || !Number.isFinite(chunk.end_sec) ||
        chunk.start_sec < 0 || chunk.end_sec <= chunk.start_sec ||
        chunk.end_sec > data.source.duration_sec + 0.1) throw new Error('Invalid media interval.');
  }
  if (data.video.chunks.some(chunk => !/^frames\/[\w.-]+\.jpg$/.test(chunk.frame_path) ||
      !Number.isFinite(chunk.frame_time_sec) || chunk.frame_time_sec < chunk.start_sec ||
      chunk.frame_time_sec > chunk.end_sec)) throw new Error('Invalid video frame.');
  if (data.audio.chunks.some(chunk => typeof chunk.text !== 'string') ||
      !Array.isArray(data.audio.waveform) || !data.audio.waveform.length ||
      data.audio.waveform.some(value => !Number.isFinite(value) || value < 0 || value > 1)) {
    throw new Error('Invalid audio results.');
  }
  const source = new URL(data.source.url);
  if (source.protocol !== 'https:') throw new Error('Invalid source credit.');
  return data;
}

function loadResults() {
  if (!resultsPromise) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    resultsPromise = fetch(`${BASE}results.json`, { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error('The media results could not be loaded.');
        return response.json();
      })
      .then(validate)
      .finally(() => clearTimeout(timeout));
  }
  return resultsPromise;
}

function aborted() {
  return new DOMException('The media action was cancelled.', 'AbortError');
}

function waitForMedia(player, eventName, signal, ready) {
  if (signal.aborted) return Promise.reject(aborted());
  if (ready()) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      player.removeEventListener(eventName, check);
      player.removeEventListener('error', failed);
      signal.removeEventListener('abort', cancelled);
      clearTimeout(timeout);
    };
    const check = () => {
      if (ready()) { cleanup(); resolve(); }
    };
    const failed = () => { cleanup(); reject(new Error('The recording could not be loaded.')); };
    const cancelled = () => { cleanup(); reject(aborted()); };
    const timeout = setTimeout(failed, 10000);
    player.addEventListener(eventName, check);
    player.addEventListener('error', failed);
    signal.addEventListener('abort', cancelled, { once: true });
  });
}

function playback(player, reportError) {
  let request;
  let activeRange = null;
  let internalTarget = null;
  let ignoredPauseEvents = 0;
  const listeners = [];
  const listen = (name, listener) => {
    player.addEventListener(name, listener);
    listeners.push([name, listener]);
  };
  const pause = () => {
    if (!player.paused) {
      ignoredPauseEvents++;
      player.pause();
    }
  };
  const cancel = () => {
    request?.abort();
    internalTarget = null;
    activeRange = null;
    pause();
  };
  const handle = { player, cancel };
  players.add(handle);

  function claimPlayback() {
    for (const other of players) {
      if (!other.player.isConnected) { other.cancel(); players.delete(other); }
      else if (other !== handle) other.cancel();
    }
  }

  async function seek(target, signal) {
    await waitForMedia(player, 'loadedmetadata', signal, () => player.readyState >= 1);
    if (signal.aborted) throw aborted();
    if (Math.abs(player.currentTime - target) < 0.01 && !player.seeking) return;
    internalTarget = target;
    // Register before assigning currentTime, since media events can follow
    // immediately. Abort previous waits when a newer selection wins.
    const settled = waitForMedia(player, 'seeked', signal,
      () => !player.seeking && Math.abs(player.currentTime - target) < 0.05);
    player.currentTime = target;
    await settled;
    if (signal.aborted) throw aborted();
    internalTarget = null;
  }

  function begin(target, chunk = null, throwOnError = false) {
    cancel();
    const current = new AbortController();
    request = current;
    if (chunk) { claimPlayback(); activeRange = chunk; }
    return seek(target, current.signal).then(async () => {
      if (chunk && !current.signal.aborted) await player.play();
    }).catch(error => {
      if (error.name === 'AbortError') return;
      if (throwOnError) throw error;
      if (request === current) reportError();
    });
  }

  listen('play', claimPlayback);
  listen('pause', () => {
    if (ignoredPauseEvents) { ignoredPauseEvents--; return; }
    // A native pause must cancel deferred autoplay, while retaining the clip
    // end if the user resumes it with the native play control.
    request?.abort();
    internalTarget = null;
  });
  listen('seeking', () => {
    if (internalTarget !== null && Math.abs(player.currentTime - internalTarget) < 0.05) return;
    // Native seeking releases the selected clip's stop point.
    request?.abort();
    internalTarget = null;
    activeRange = null;
  });
  listen('timeupdate', () => {
    if (activeRange && player.currentTime >= activeRange.end_sec) {
      activeRange = null;
      pause();
    }
  });
  listen('error', () => { cancel(); reportError(); });

  return {
    browse: (target, throwOnError = false) => begin(target, null, throwOnError),
    play: chunk => begin(chunk.start_sec, chunk),
    initialize: signal => waitForMedia(player, 'loadedmetadata', signal, () => player.readyState >= 1),
    dispose: () => {
      cancel();
      for (const [name, listener] of listeners) player.removeEventListener(name, listener);
      players.delete(handle);
    },
  };
}

function render(node, kind, data) {
  const chunks = data[kind].chunks;
  node.classList.add('qi-inline-media');
  node.innerHTML = `
    <div class="qi-inline-media__content">
      <h4 class="qi-inline-media__title">${TITLE}</h4>
      ${kind === 'video'
        ? `<video class="qi-inline-media__player" controls playsinline preload="metadata" poster="${BASE}${escape(chunks[0].frame_path)}" aria-label="${TITLE}"><source src="${BASE}source.mp4" type="video/mp4"></video>`
        : `<audio hidden preload="metadata"><source src="${BASE}audio.m4a" type="audio/mp4"></audio>
          <svg class="qi-inline-media__waveform" viewBox="0 0 600 90" role="img" aria-label="Normalized RMS computed from the recording">
            <rect data-band y="0" height="90"></rect><path data-wave></path>
          </svg>`}
      <p class="qi-inline-media__selection" data-selection aria-live="polite" aria-atomic="true"></p>
      <div class="qi-inline-media__choices ${kind === 'video' ? 'qi-inline-media__choices--frames' : ''}" role="group" aria-label="${kind === 'video' ? 'Browse extracted frames' : 'Play transcript chunks'}">
        ${chunks.map((chunk, index) => `<button type="button" class="qi-chip qi-inline-media__choice" data-index="${index}" aria-pressed="false" aria-label="${kind === 'video' ? `Show frame ${index + 1} at ${time(chunk.frame_time_sec)}` : `Play chunk ${index + 1}, ${range(chunk)}`}">
          ${kind === 'video' ? `<img src="${BASE}${escape(chunk.frame_path)}" alt="" width="320" height="240" loading="lazy">` : ''}<span>${index + 1}</span>
        </button>`).join('')}
      </div>
      ${kind === 'video'
        ? '<button type="button" class="qi-chip qi-inline-media__play" data-play></button>'
        : '<p class="qi-inline-media__transcript" data-transcript></p>'}
      <p class="qi-inline-media__error" data-error role="alert" hidden>Playback is unavailable. <a href="${BASE}${kind === 'video' ? 'source.mp4' : 'audio.m4a'}">Open the recording</a>.</p>
      <p class="qi-inline-media__credit">Source: <a href="${escape(data.source.url)}">NASA</a></p>
    </div>`;
  const player = node.querySelector(kind);
  const error = node.querySelector('[data-error]');
  const control = playback(player, () => { error.hidden = false; });
  let selected = 0;
  let interacted = false;
  if (kind === 'audio') {
    node.querySelector('[data-wave]').setAttribute('d', data.audio.waveform.map((value, index, samples) => {
      const x = (index + 0.5) * 600 / samples.length;
      const amplitude = value * 38;
      return `M${x.toFixed(2)} ${(45 - amplitude).toFixed(2)}V${(45 + amplitude).toFixed(2)}`;
    }).join(''));
  }

  function select(index) {
    selected = index;
    error.hidden = true;
    const chunk = chunks[index];
    node.querySelectorAll('[data-index]').forEach(button => {
      button.setAttribute('aria-pressed', String(Number(button.dataset.index) === index));
    });
    node.querySelector('[data-selection]').textContent = kind === 'video'
      ? `Frame ${index + 1} of ${chunks.length} · ${time(chunk.frame_time_sec)}`
      : `Chunk ${index + 1} of ${chunks.length} · ${range(chunk)}`;
    if (kind === 'video') {
      player.poster = `${BASE}${chunk.frame_path}`;
      node.querySelector('[data-play]').textContent = `Play clip · ${range(chunk)}`;
    } else {
      node.querySelector('[data-transcript]').textContent = chunk.text;
      const band = node.querySelector('[data-band]');
      band.setAttribute('x', String(chunk.start_sec / data.source.duration_sec * 600));
      band.setAttribute('width', String((chunk.end_sec - chunk.start_sec) / data.source.duration_sec * 600));
      node.querySelector('svg').setAttribute('aria-label', `Normalized audio RMS. Selected chunk: ${range(chunk)}.`);
    }
  }

  const click = event => {
    const button = event.target.closest('button');
    if (!button || !node.contains(button)) return;
    interacted = true;
    if (button.hasAttribute('data-index')) {
      const index = Number(button.dataset.index);
      if (kind === 'audio' && index === selected && !player.paused) {
        player.pause();
        return;
      }
      select(index);
      if (kind === 'video') void control.browse(chunks[index].frame_time_sec);
      else void control.play(chunks[index]);
    } else if (button.hasAttribute('data-play')) {
      error.hidden = true;
      void control.play(chunks[selected]);
    }
  };
  const labelAudioControls = () => {
    if (kind !== 'audio') return;
    node.querySelectorAll('[data-index]').forEach(button => {
      const index = Number(button.dataset.index);
      const action = index === selected && !player.paused ? 'Pause' : 'Play';
      button.setAttribute('aria-label', `${action} chunk ${index + 1}, ${range(chunks[index])}`);
      button.title = `${action} chunk ${index + 1}`;
    });
  };
  const followAudio = () => {
    if (kind !== 'audio' || player.seeking) return;
    // In pauses between ASR intervals, retain the nearest preceding chunk.
    let index = 0;
    for (let i = 0; i < chunks.length; i++) {
      if (chunks[i].start_sec <= player.currentTime) index = i;
      else break;
    }
    if (index !== selected) select(index);
  };
  node.addEventListener('click', click);
  player.addEventListener('timeupdate', followAudio);
  player.addEventListener('seeked', followAudio);
  player.addEventListener('play', labelAudioControls);
  player.addEventListener('pause', labelAudioControls);
  select(0);
  labelAudioControls();
  return {
    async initialize(signal) {
      await control.initialize(signal);
      if (kind === 'video' && !interacted && !signal.aborted) await control.browse(chunks[0].frame_time_sec, true);
      if (signal.aborted) throw aborted();
    },
    dispose() {
      control.dispose();
      node.removeEventListener('click', click);
      player.removeEventListener('timeupdate', followAudio);
      player.removeEventListener('seeked', followAudio);
      player.removeEventListener('play', labelAudioControls);
      player.removeEventListener('pause', labelAudioControls);
    },
  };
}

export function mount(node) {
  const kind = node.closest('[data-media-kind]')?.dataset.mediaKind;
  if (kind !== 'video' && kind !== 'audio') throw new Error('An inline media kind is required.');
  const initialization = new AbortController();
  let view;
  let completed = false;
  const timeout = setTimeout(() => initialization.abort(), 12000);
  const fail = () => {
    if (completed) return;
    completed = true;
    clearTimeout(timeout);
    view?.dispose();
    node.replaceChildren();
    node.dispatchEvent(new CustomEvent('island:error', { bubbles: true }));
  };
  initialization.signal.addEventListener('abort', fail, { once: true });
  // The host does not await asynchronous mount functions. Handle every failure
  // here and signal it before the host's 15-second fallback deadline.
  return loadResults().then(async data => {
    if (initialization.signal.aborted) return;
    view = render(node, kind, data);
    await view.initialize(initialization.signal);
    if (initialization.signal.aborted) return;
    completed = true;
    clearTimeout(timeout);
    node.dispatchEvent(new CustomEvent('island:ready', { bubbles: true }));
  }).catch(fail);
}

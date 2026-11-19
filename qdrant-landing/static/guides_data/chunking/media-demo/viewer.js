// This viewer renders only outputs from the accompanying processing run.
// Media, timestamps, transcripts, and waveform values come from results.json.
const $ = selector => document.querySelector(selector);
const params = new URLSearchParams(location.search);
const view = params.get('view') === 'audio' ? 'audio' : 'video';
const capture = params.get('capture') === '1';
const requestedIds = (params.get('chunk') || '').split(',').filter(Boolean);
document.body.classList.toggle('capture', capture);

function time(seconds) {
  const totalHundredths = Math.round(seconds * 100);
  const minutes = Math.floor(totalHundredths / 6000);
  const remainder = totalHundredths % 6000;
  const wholeSeconds = Math.floor(remainder / 100);
  const fraction = remainder % 100;
  return `${String(minutes).padStart(2, '0')}:${String(wholeSeconds).padStart(2, '0')}${fraction ? `.${String(fraction).padStart(2, '0')}` : ''}`;
}

function interval(chunk) {
  return `${time(chunk.start_sec)}–${time(chunk.end_sec)}`;
}

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function mediaUrl(path) {
  if (typeof path !== 'string' || !path) throw new Error('A frame path is missing.');
  const base = new URL('.', location.href);
  const url = new URL(path, base);
  if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) {
    throw new Error('A frame path is outside this media example.');
  }
  return url.href;
}

function validate(data) {
  if (!data?.source || !data?.run || !Array.isArray(data?.video?.chunks) || !Array.isArray(data?.audio?.chunks)) {
    throw new Error('The processing results are incomplete.');
  }
  if (!Number.isFinite(data.source.duration_sec) || data.source.duration_sec <= 0) {
    throw new Error('The source duration is missing.');
  }
  for (const chunk of [...data.video.chunks, ...data.audio.chunks]) {
    if (!Number.isFinite(chunk.start_sec) || !Number.isFinite(chunk.end_sec) || chunk.start_sec < 0 || chunk.end_sec <= chunk.start_sec || chunk.end_sec > data.source.duration_sec + 0.1) {
      throw new Error('A computed chunk has invalid time boundaries.');
    }
  }
  if (!Array.isArray(data.audio.waveform) || data.audio.waveform.length === 0 || data.audio.waveform.some(value => !Number.isFinite(value) || value < 0 || value > 1)) {
    throw new Error('The computed waveform is missing or invalid.');
  }
  if (data.video.chunks.some(chunk => !Number.isFinite(chunk.frame_time_sec) || chunk.frame_time_sec < chunk.start_sec || chunk.frame_time_sec > chunk.end_sec)) {
    throw new Error('A sampled frame has an invalid timestamp.');
  }
  if (data.audio.chunks.some(chunk => typeof chunk.text !== 'string' || !Number.isInteger(chunk.word_count) || chunk.word_count < 0)) {
    throw new Error('A transcript chunk is incomplete.');
  }
  if (requestedIds.some(id => !data[view].chunks.some(chunk => chunk.id === id))) {
    throw new Error('The requested chunk ID is not present in this run.');
  }
  return data;
}

function displayedChunks(chunks, mediaView) {
  if (!capture || view !== mediaView) return chunks;
  return requestedIds.length ? chunks.filter(chunk => requestedIds.includes(chunk.id)) : chunks.slice(0, 1);
}

function wirePlayback(player, chunks, buttons, onSelect = () => {}) {
  let selectedIndex = 0;
  let activeRange = null;

  const select = (index, play = false) => {
    selectedIndex = index;
    const chunk = chunks[index];
    buttons.forEach((button, buttonIndex) => button.setAttribute('aria-pressed', String(buttonIndex === index)));
    onSelect(chunk);
    if (player.id === `${view}-player`) $('#capture-link').href = `?view=${view}&capture=1&chunk=${encodeURIComponent(chunk.id)}`;
    if (!play) return;
    activeRange = chunk;
    player.currentTime = chunk.start_sec;
    const promise = player.play();
    if (promise) promise.catch(() => {
      // A browser can require the native play button. The selected interval
      // remains available and no transcript or result is substituted.
      player.focus();
    });
  };

  buttons.forEach((button, index) => button.addEventListener('click', () => select(index, !capture)));
  player.addEventListener('timeupdate', () => {
    if (activeRange && player.currentTime >= activeRange.end_sec) {
      player.pause();
      activeRange = null;
      return;
    }
    const index = chunks.findIndex(chunk => player.currentTime >= chunk.start_sec && player.currentTime < chunk.end_sec);
    if (index !== -1 && index !== selectedIndex) select(index);
  });
  // Seeking with the native control should not retain a prior range limit.
  player.addEventListener('seeking', () => {
    if (activeRange && (player.currentTime < activeRange.start_sec - 0.05 || player.currentTime >= activeRange.end_sec)) activeRange = null;
  });
  if (chunks.length) {
    const initialIndex = chunks.findIndex(chunk => chunk.id === requestedIds[0]);
    select(initialIndex === -1 ? 0 : initialIndex);
  }
}

function videoResults(data) {
  const chunks = displayedChunks(data.video.chunks, 'video');
  const buttons = chunks.map(chunk => {
    const index = data.video.chunks.indexOf(chunk);
    const button = node('button', 'video-card');
    button.type = 'button';
    button.setAttribute('aria-label', `Play video window ${index + 1}, ${interval(chunk)}`);
    button.setAttribute('aria-pressed', 'false');
    const image = node('img');
    image.src = mediaUrl(chunk.frame_path);
    image.alt = `Source video frame sampled at ${time(chunk.frame_time_sec)}`;
    image.width = 640;
    image.height = 480;
    const caption = node('span', 'video-caption');
    const heading = node('span', 'chunk-heading');
    heading.append(node('span', '', interval(chunk)), node('span', 'chunk-number', `Window ${index + 1} of ${data.video.chunks.length}`));
    caption.append(heading, node('span', 'frame-time', `Frame at ${time(chunk.frame_time_sec)}`));
    button.append(image, caption);
    $('#video-chunks').append(button);
    return button;
  });
  if (!buttons.length) $('#video-chunks').append(node('p', '', 'The run produced no video windows.'));
  wirePlayback($('#video-player'), chunks, buttons);
}

function audioResults(data) {
  const width = 672;
  const height = 116;
  const middle = height / 2;
  const samples = data.audio.waveform;
  const path = samples.map((peak, index) => {
    const x = (index + 0.5) * width / samples.length;
    const amplitude = peak * (middle - 8);
    return `M${x.toFixed(2)} ${(middle - amplitude).toFixed(2)}V${(middle + amplitude).toFixed(2)}`;
  }).join('');
  $('#waveform-peaks').setAttribute('d', path);
  $('#duration-label').textContent = time(data.source.duration_sec);

  const chunks = displayedChunks(data.audio.chunks, 'audio');
  const buttons = chunks.map(chunk => {
    const index = data.audio.chunks.indexOf(chunk);
    const button = node('button', 'audio-card');
    button.type = 'button';
    button.setAttribute('aria-pressed', 'false');
    const heading = node('span', 'chunk-heading');
    heading.append(node('span', '', interval(chunk)), node('span', 'chunk-number', `${chunk.word_count} words · Chunk ${index + 1} of ${data.audio.chunks.length}`));
    button.append(heading, node('span', 'transcript', chunk.text));
    $('#audio-chunks').append(button);
    return button;
  });
  if (!buttons.length) $('#audio-chunks').append(node('p', '', 'The run produced no transcript chunks.'));
  wirePlayback($('#audio-player'), chunks, buttons, chunk => {
    $('#selected-audio-range').textContent = interval(chunk);
    $('#waveform-selection').setAttribute('x', String(chunk.start_sec / data.source.duration_sec * width));
    $('#waveform-selection').setAttribute('width', String((chunk.end_sec - chunk.start_sec) / data.source.duration_sec * width));
    $('#waveform-description').textContent = `Normalized RMS computed from the audio samples. Selected transcript chunk: ${interval(chunk)}.`;
  });
}

function render(data) {
  document.title = `${view === 'audio' ? 'Audio' : 'Video'} chunking: actual results`;
  $('#view-title').textContent = view === 'audio' ? 'Audio transcript chunks' : 'Video frame windows';
  $('#source-title').textContent = data.source.title;
  document.querySelectorAll('[data-view]').forEach(link => {
    if (link.dataset.view === view) link.setAttribute('aria-current', 'page');
  });
  $('#capture-link').href = `?view=${view}&capture=1${requestedIds.length ? `&chunk=${encodeURIComponent(requestedIds.join(','))}` : ''}`;
  const modelName = data.run.model.replace(/^.*\/whisper-(.*?)-mlx$/, '$1');
  $('#run-label').textContent = view === 'audio' ? `Whisper ${modelName} · actual run` : 'FFmpeg frame extraction · actual run';
  const parameters = view === 'audio'
    ? [`${data.run.audio_max_seconds}s maximum chunk`, `${data.run.pause_seconds}s ASR word-gap threshold`, `${data.audio.chunks.length} chunks`]
    : [`${data.run.video_window_seconds}s windows`, `${data.video.chunks.length} sampled frames`, `${time(data.source.duration_sec)} source duration`];
  parameters.forEach(value => $('#parameters').append(node('li', '', value)));

  const sourceUrl = new URL(data.source.url);
  if (!['http:', 'https:'].includes(sourceUrl.protocol)) throw new Error('The source URL is invalid.');
  $('#source-link').href = sourceUrl.href;
  $('#source-credit').textContent = ` · ${data.source.credit}`;
  $('#source-license').textContent = data.source.license;
  $('#run-date').textContent = `Processing run: ${data.run.date.slice(0, 10)}`;
  $('#run-date').title = data.run.date;
  $('#model-revision').textContent = data.run.model_revision;
  $('#source-hash').textContent = data.source.sha256;

  videoResults(data);
  audioResults(data);
  $(`#${view}-view`).hidden = false;
  $('#results').hidden = false;
  $('#load-status').hidden = true;
  $('.demo').setAttribute('aria-busy', 'false');
}

try {
  const response = await fetch('results.json');
  if (!response.ok) throw new Error(`Computed results are unavailable (HTTP ${response.status}).`);
  render(validate(await response.json()));
} catch (error) {
  $('#load-status').textContent = `Unable to load this processing run. ${error.message}`;
  $('#load-status').setAttribute('role', 'alert');
  $('.demo').setAttribute('aria-busy', 'false');
}

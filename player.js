/* =============================================
   RESONANCE — player.js
   Full working audio player using the Web Audio API
   and real royalty-free track URLs via public CDNs.
   ============================================= */

'use strict';

/* ──────────────────────────────────────────────
   SONG LIBRARY
   All tracks are public-domain / CC0 / royalty-free
   sourced from Wikimedia Commons & Free Music Archive.
   ────────────────────────────────────────────── */
const songs = [
  {
    id: 1,
    title: "Pheli Dafaa",
    artist: "Atif Aslam",
    genre: "Romantic",
    year: 2015,
    emoji: "🌸",
    album: "Pheli Dafaa-Single",
    mood: "Emotional",
    duration: 0,
    src: "music/music1.mp3"
  },
  {
    id: 2,
    title: "Channa Meraya",
    artist: "Arijit Singh",
    genre: "Romantic",
    year: 2016,
    emoji: "🎻",
    album: "Ae Dil Hai Mushkil",
    mood: "Sad",
    duration: 0,
    src: "music/music3.mp3"
  },
  {
    id: 3,
    title: "Moonlight",
    artist: "Harnoor",
    genre: "Romantic",
    year: 2020,
    emoji: "🎼",
    /*cover: "images/bg1.jpg"*/
    album: "Moonlight-Single",
    mood: "Emotional",
    duration: 0,
    src: "music/music4.mpeg"
  },
  {
    id: 4,
    title: "Akhiyan Da Surma",
    artist: "Aamir Khan",
    genre: "Romantic",
    year: 2020,
    emoji: "🌙",
    album: "Akhiyan Da Surma-Single",
    mood: "Devotion",
    duration: 0,
    src: "music/music5.mpeg"
  },
  {
    id: 5,
    title: "Tu Hi Das De",
    artist: "Simar Panag",
    genre: "Romantic",
    year: 2019,
    emoji: "💫",
    album: "Tu Hi Das De-Single",
    mood: "Sad",
    duration: 0,
    src: "music/music6.mpeg"
  },
  {
    id: 6,
    title: "Raataan Lambiyan",
    artist: "Jubin Nautiyal",
    genre: "Romantic",
    year: 2021,
    emoji: "🎹",
    album: "SherShaah(soundtrack)",
    mood: "Dreamy",
    duration: 0,
    src: "music/music7.mpeg"
  },
  {
    id: 7,
    title: "Mere Wala Sardar",
    artist: "Jugraj Sandhu",
    genre: "Romantic",
    year: 2018,
    emoji: "🌺",
    album: "Mere Wala Sardar-Single",
    mood: "Devotion",
    duration: 0,
    src: "music/music8.mpeg"
  },
  {
    id: 8,
    title: "Naina",
    artist: "Arijit Singh",
    genre: "Sad",
    year: 2017,
    emoji: "🏰",
    album: "Dangal",
    mood: "melancholic",
    duration: 0,
    src: "music/music2.mp3"
  },
  {
    id: 9,
    title: "Channa Meraya",
    artist: "Arijit Singh",
    genre: "Sad",
    year: 2016,
    emoji: "🎷",
    album: "Ae Dil Hai Mushkil",
    mood: "melancholic",
    duration: 0,
    src: "music/music3.mp3"
  },
  {
    id: 10,
    title: "Falling Down",
    artist: "Wild Cards",
    genre: "Electronic",
    year: 2017,
    emoji: "🍁",
    album: "Single",
    mood: "Upbeat",
    duration: 0,
    src: "music/fallingdown.mp3"
  },
  {
    id: 11,
    title: "Faded",
    artist: "Alan Walker",
    genre: "Electronic",
    year: 2018,
    emoji: "🏔️",
    album: "Different World",
    mood: "melancholic",
    duration: 0,
    src: "music/Faded.mp3"
  },
  {
    id: 12,
    title: "Stay",
    artist: "The Kid LAROI & Justin Bieber",
    genre: "Pop-rock",
    year: 2021,
    emoji: "✨",
    album: "Over you",
    mood: "High-energy",
    duration: 0,
    src: "music/stay.mp3"
  }
];

const categories = [
  { name: "Romantic", emoji: "🎻", desc: "Timeless Elegance",   color: "linear-gradient(135deg,#1a1228 0%,#0d1a2e 100%)" },
  { name: "Sad",      emoji: "🎷", desc: "Smooth & Soulful",    color: "linear-gradient(135deg,#2a1608 0%,#1a1228 100%)" },
  { name: "Electronic",   emoji: "🏰", desc: "Rich & Ornate",       color: "linear-gradient(135deg,#0d1a1a 0%,#1a1208 100%)" },
  { name: "Pop-rock",emoji: "🎼", desc: "Grand & Sweeping",    color: "linear-gradient(135deg,#1a080d 0%,#0d1a2e 100%)" },
];

/* ──────────────────────────────────────────────
   STATE
   ────────────────────────────────────────────── */
let currentIndex   = 0;
let isPlaying      = false;
let isShuffle      = false;
let isLoop         = false;
let isMuted        = false;
let volumeLevel    = 0.8;      // 0 – 1
let progressTimer  = null;
let filteredSongs  = [...songs];
let activeGenre    = 'all';
let history        = [];

/* Persistent history from localStorage */
try { history = JSON.parse(localStorage.getItem('resonance_history') || '[]'); }
catch(e) { history = []; }

/* ──────────────────────────────────────────────
   AUDIO ELEMENT  (single <audio> tag, we swap src)
   ────────────────────────────────────────────── */
const audio = new Audio();
audio.volume  = volumeLevel;
audio.preload = 'metadata';

/* When track ends naturally */
audio.addEventListener('ended', () => {
  if (isLoop) {
    audio.currentTime = 0;
    audio.play().catch(() => {});
    addToHistory(songs[currentIndex], currentIndex);
  } else {
    advanceTrack(1);
  }
});

/* Keep progress bar in sync */
audio.addEventListener('timeupdate', updateProgress);

/* Duration loaded */
audio.addEventListener('loadedmetadata', () => {
  document.getElementById('totalTime').textContent = formatTime(audio.duration);
});

/* ──────────────────────────────────────────────
   PLAY / PAUSE / LOAD
   ────────────────────────────────────────────── */
function playSong(index) {
  if (index < 0 || index >= songs.length) return;
  currentIndex = index;
  const song   = songs[index];

  audio.src = song.src;
  audio.load();
  audio.volume = isMuted ? 0 : volumeLevel;

  audio.play()
    .then(() => {
      isPlaying = true;
      syncPlayPauseUI();
      addToHistory(song, index);
    })
    .catch(err => {
      console.warn('Playback blocked or failed:', err);
    });

  /* Update player bar metadata */
  document.getElementById('playerThumb').textContent   = song.emoji;
  document.getElementById('playerTitle').textContent   = song.title;
  document.getElementById('playerArtist').textContent  = `${song.artist} · ${song.genre}`;
  document.getElementById('currentTime').textContent   = '0:00';
  document.getElementById('totalTime').textContent     = '…';
  document.getElementById('progressFill').style.width  = '0%';

  /* Spinning album art when playing */
  document.getElementById('playerThumb').classList.add('spinning');

  renderSongs(filteredSongs);
  renderQueue();
}

function togglePlay() {
  if (!audio.src) {
    playSong(currentIndex);
    return;
  }
  if (isPlaying) {
    audio.pause();
    isPlaying = false;
    document.getElementById('playerThumb').classList.remove('spinning');
  } else {
    audio.play().then(() => {
      isPlaying = true;
      document.getElementById('playerThumb').classList.add('spinning');
    }).catch(() => {});
  }
  syncPlayPauseUI();
  renderSongs(filteredSongs);
}

function syncPlayPauseUI() {
  document.getElementById('playIcon').style.display  = isPlaying ? 'none' : 'block';
  document.getElementById('pauseIcon').style.display = isPlaying ? 'block' : 'none';
}

/* ──────────────────────────────────────────────
   SKIP / PREV
   ────────────────────────────────────────────── */
function nextSong() { advanceTrack(1); }
function prevSong() {
  /* If more than 3 s in, restart; else truly go back */
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }
  advanceTrack(-1);
}

function advanceTrack(direction) {
  let next;
  if (isShuffle) {
    do { next = Math.floor(Math.random() * songs.length); }
    while (songs.length > 1 && next === currentIndex);
  } else {
    next = (currentIndex + direction + songs.length) % songs.length;
  }
  playSong(next);
}

/* ──────────────────────────────────────────────
   PROGRESS & SEEK
   ────────────────────────────────────────────── */
function updateProgress() {
  const dur = audio.duration;
  if (!dur) return;
  const pct = (audio.currentTime / dur) * 100;
  document.getElementById('progressFill').style.width  = pct + '%';
  document.getElementById('currentTime').textContent   = formatTime(audio.currentTime);
}

function seekTo(e) {
  const bar = document.getElementById('progressBar');
  const rect = bar.getBoundingClientRect();
  const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  if (audio.duration) {
    audio.currentTime = pct * audio.duration;
    document.getElementById('progressFill').style.width = (pct * 100) + '%';
  }
}

/* ──────────────────────────────────────────────
   SHUFFLE / LOOP
   ────────────────────────────────────────────── */
function toggleShuffle() {
  isShuffle = !isShuffle;
  document.getElementById('shuffleBtn').classList.toggle('active', isShuffle);
}

function toggleLoop() {
  isLoop = !isLoop;
  audio.loop = isLoop;    /* native loop — seamless */
  document.getElementById('loopBtn').classList.toggle('active', isLoop);
}

/* ──────────────────────────────────────────────
   VOLUME
   ────────────────────────────────────────────── */
function setVolume(value) {
  volumeLevel    = value / 100;
  audio.volume   = volumeLevel;
  isMuted        = volumeLevel === 0;
  updateVolIcon();
}

function toggleMute() {
  isMuted      = !isMuted;
  audio.volume = isMuted ? 0 : volumeLevel;
  const slider = document.getElementById('volumeSlider');
  slider.value = isMuted ? 0 : Math.round(volumeLevel * 100);
  updateVolIcon();
}

function updateVolIcon() {
  const vol = isMuted ? 0 : volumeLevel;
  const btn  = document.getElementById('muteBtn');
  if (vol === 0) {
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`;
  } else if (vol < 0.5) {
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`;
  } else {
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`;
  }
}

/* ──────────────────────────────────────────────
   HISTORY
   ────────────────────────────────────────────── */
function addToHistory(song, index) {
  const entry = {
    songIndex : index,
    title     : song.title,
    artist    : song.artist,
    genre     : song.genre,
    album     : song.album,
    year      : song.year,
    emoji     : song.emoji,
    time      : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    date      : new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })
  };
  /* Avoid consecutive duplicates */
  if (history.length && history[history.length - 1].songIndex === index) return;
  history.push(entry);
  if (history.length > 80) history.shift();
  try { localStorage.setItem('resonance_history', JSON.stringify(history)); } catch(e) {}
}

/* ──────────────────────────────────────────────
   RENDER — SONG CARDS
   ────────────────────────────────────────────── */
function renderSongs(list) {
  const grid = document.getElementById('songGrid');
  if (!list.length) {
    grid.innerHTML = '<div class="no-history"><div class="icon">🔍</div><p>No songs match your search.</p></div>';
    return;
  }
  grid.innerHTML = list.map(s => {
    const globalIdx = songs.indexOf(s);
    const active    = globalIdx === currentIndex && isPlaying;
    return `
      <div class="song-card${active ? ' active' : ''}" onclick="playSong(${globalIdx})">
        <div class="song-cover">
          <span>${s.emoji}</span>
          <div class="play-overlay">
            <div class="play-btn-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#0a0a0f">
                ${active
                  ? '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>'
                  : '<polygon points="5 3 19 12 5 21 5 3"/>'}
              </svg>
            </div>
          </div>
        </div>
        <div class="song-info">
          <div class="song-title">
            ${s.title}
            ${active ? '<span class="now-playing-dot"></span>' : ''}
          </div>
          <div class="song-artist">${s.artist}</div>
          <div class="song-album">${s.album}</div>
          <div class="song-meta">
            <span class="meta-tag">${s.genre}</span>
            <span class="meta-tag">${s.year}</span>
            <span class="meta-tag">${s.mood}</span>
          </div>
        </div>
      </div>`;
  }).join('');
}

/* ──────────────────────────────────────────────
   RENDER — GENRE CARDS
   ────────────────────────────────────────────── */
function renderCategories() {
  document.getElementById('categoriesGrid').innerHTML = categories.map(c => {
    const count = songs.filter(s => s.genre === c.name).length;
    return `
      <div class="category-card" onclick="filterByGenre('${c.name}', null); showView('discover')" style="background:${c.color}">
        <div class="cat-bg">${c.emoji}</div>
        <div class="overlay">
          <h3>${c.name}</h3>
          <p>${count} track${count !== 1 ? 's' : ''} · ${c.desc}</p>
        </div>
      </div>`;
  }).join('');
}

/* ──────────────────────────────────────────────
   RENDER — QUEUE (sidebar)
   ────────────────────────────────────────────── */
function renderQueue() {
  document.getElementById('queueList').innerHTML = filteredSongs.slice(0, 10).map(s => {
    const globalIdx = songs.indexOf(s);
    return `
      <div class="queue-item${globalIdx === currentIndex ? ' playing' : ''}" onclick="playSong(${globalIdx})">
        <div class="queue-thumb">${s.emoji}</div>
        <div class="queue-info">
          <div class="queue-title">${s.title}</div>
          <div class="queue-artist">${s.artist}</div>
        </div>
      </div>`;
  }).join('');
}

/* ──────────────────────────────────────────────
   RENDER — HISTORY
   ────────────────────────────────────────────── */
function renderHistory() {
  const el = document.getElementById('historyList');
  if (!history.length) {
    el.innerHTML = `
      <div class="no-history">
        <div class="icon">🎵</div>
        <p>No songs played yet.<br>Start listening to build your history.</p>
      </div>`;
    return;
  }
  el.innerHTML = [...history].reverse().map(h => `
    <div class="history-item" onclick="playSong(${h.songIndex})">
      <div class="history-emoji">${h.emoji}</div>
      <div class="history-info">
        <div class="history-title">${h.title}</div>
        <div class="history-detail">${h.artist} · ${h.genre} · ${h.year}</div>
      </div>
      <div class="history-time">${h.date} ${h.time}</div>
    </div>`).join('');
}

/* ──────────────────────────────────────────────
   NAVIGATION
   ────────────────────────────────────────────── */
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');

  const navMap = { discover: 0, categories: 1, history: 2 };
  const navEl  = document.querySelectorAll('.nav-item')[navMap[name]];
  if (navEl) navEl.classList.add('active');

  if (name === 'history') renderHistory();
}

function filterByGenre(genre, btn) {
  activeGenre    = genre;
  filteredSongs  = genre === 'all'
    ? [...songs]
    : songs.filter(s => s.genre === genre);

  if (btn) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
  }
  renderSongs(filteredSongs);
  renderQueue();
}

function handleSearch(query) {
  const q = query.toLowerCase().trim();
  if (!q) {
    filteredSongs = activeGenre === 'all' ? [...songs] : songs.filter(s => s.genre === activeGenre);
  } else {
    filteredSongs = songs.filter(s =>
      s.title.toLowerCase().includes(q)  ||
      s.artist.toLowerCase().includes(q) ||
      s.genre.toLowerCase().includes(q)  ||
      s.album.toLowerCase().includes(q)  ||
      s.mood.toLowerCase().includes(q)
    );
    showView('discover');
  }
  renderSongs(filteredSongs);
  renderQueue();
}

/* ──────────────────────────────────────────────
   UTILS
   ────────────────────────────────────────────── */
function formatTime(secs) {
  if (isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/* ──────────────────────────────────────────────
   KEYBOARD SHORTCUTS
   ────────────────────────────────────────────── */
document.addEventListener('keydown', e => {
  /* Don't trigger when typing in search */
  if (e.target.tagName === 'INPUT') return;
  switch (e.key) {
    case ' ':         e.preventDefault(); togglePlay();    break;
    case 'ArrowRight': e.preventDefault(); nextSong();     break;
    case 'ArrowLeft':  e.preventDefault(); prevSong();     break;
    case 'm': case 'M': toggleMute();                      break;
    case 's': case 'S': toggleShuffle();                   break;
    case 'l': case 'L': toggleLoop();                      break;
  }
});

/* ──────────────────────────────────────────────
   INIT
   ────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  renderSongs(songs);
  renderCategories();
  renderQueue();
  updateVolIcon();

  /* Set slider to initial volume */
  document.getElementById('volumeSlider').value = Math.round(volumeLevel * 100);

  /* Prime first track metadata without auto-playing */
  audio.src = songs[0].src;
  audio.load();
  document.getElementById('playerThumb').textContent  = songs[0].emoji;
  document.getElementById('playerTitle').textContent  = songs[0].title;
  document.getElementById('playerArtist').textContent = `${songs[0].artist} · ${songs[0].genre}`;
});

// Worgle Daily Answers - Static Site
// Works with archive.json and solutions.json on GitHub Pages

const EPOCH = new Date(2021, 5, 19); // June 19, 2021
const INDEX_OFFSET = 207;
let archive = [];
let solutions = [];
let filteredArchive = [];
let archivePage = 0;
const PAGE_SIZE = 20;

// --- Date Helpers (IST timezone) ---

function getTodayIST() {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateReadable(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getDaysSinceEpoch(targetDate) {
  const epochMs = new Date(2021, 5, 19, 0, 0, 0, 0).getTime();
  const targetMs = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0).getTime();
  return Math.round((targetMs - epochMs) / 86400000);
}

function computeAnswer(targetDate) {
  const dayOffset = getDaysSinceEpoch(targetDate);
  const rawIndex = dayOffset - INDEX_OFFSET;
  const index = ((rawIndex % solutions.length) + solutions.length) % solutions.length;
  return {
    word: solutions[index],
    index: index,
    dayOffset: dayOffset,
    puzzle: dayOffset - 206,
  };
}

// --- Tab Switching ---

document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
});

// --- Today's Answer ---

let todayWord = '';
let todayPuzzle = 0;

function initToday() {
  const today = getTodayIST();
  const answer = computeAnswer(today);
  todayWord = answer.word;
  todayPuzzle = answer.puzzle;

  document.getElementById('today-date').textContent = formatDateReadable(today);
  document.getElementById('today-puzzle').textContent = answer.puzzle;
  document.getElementById('stat-puzzle').textContent = '#' + answer.puzzle;
  document.getElementById('revealed-meta').textContent =
    `Solution index: ${answer.index} · Days since epoch: ${answer.dayOffset}`;
}

function revealAnswer() {
  document.getElementById('answer-hidden').classList.add('hidden');
  document.getElementById('answer-shown').classList.remove('hidden');

  const tilesContainer = document.getElementById('revealed-tiles');
  tilesContainer.innerHTML = '';
  todayWord.split('').forEach((letter, i) => {
    const tile = document.createElement('div');
    tile.className = 'big-tile revealed';
    tile.textContent = letter;
    tile.style.animationDelay = `${i * 80}ms`;
    tilesContainer.appendChild(tile);
  });

  document.getElementById('revealed-word').textContent = todayWord;
}

function hideAnswer() {
  document.getElementById('answer-shown').classList.add('hidden');
  document.getElementById('answer-hidden').classList.remove('hidden');
}

// --- Countdown Timer ---

function updateCountdown() {
  const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const tomorrowIST = new Date(nowIST);
  tomorrowIST.setDate(tomorrowIST.getDate() + 1);
  tomorrowIST.setHours(0, 0, 0, 0);
  const diff = tomorrowIST.getTime() - nowIST.getTime();
  if (diff <= 0) {
    document.getElementById('countdown-time').textContent = '00:00:00';
    return;
  }
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  document.getElementById('countdown-time').textContent =
    `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// --- Archive ---

function getFilteredArchive() {
  const monthInput = document.getElementById('archive-month').value;
  if (!monthInput) return archive;

  const [year, month] = monthInput.split('-').map(Number);
  return archive.filter(entry => {
    const [ey, em] = entry.date.split('-').map(Number);
    return ey === year && em === month;
  });
}

function renderArchive() {
  filteredArchive = getFilteredArchive();
  // Reverse to show newest first
  filteredArchive = [...filteredArchive].reverse();
  const totalPages = Math.ceil(filteredArchive.length / PAGE_SIZE);
  if (archivePage >= totalPages) archivePage = Math.max(0, totalPages - 1);

  const start = archivePage * PAGE_SIZE;
  const pageItems = filteredArchive.slice(start, start + PAGE_SIZE);
  const todayStr = formatDate(getTodayIST());

  const listEl = document.getElementById('archive-list');
  listEl.innerHTML = '';

  pageItems.forEach(entry => {
    const div = document.createElement('div');
    div.className = 'archive-entry' + (entry.date === todayStr ? ' today-entry' : '');
    div.onclick = () => toggleArchiveWord(div);

    const d = new Date(entry.date + 'T00:00:00');
    const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
    const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const isToday = entry.date === todayStr;

    div.innerHTML = `
      <div class="archive-entry-left">
        <div class="archive-entry-date">
          <span>${weekday}, ${monthDay}</span>
          ${isToday ? '<span class="today-badge">Today</span>' : ''}
        </div>
        <div class="archive-entry-puzzle">Puzzle #${entry.puzzle}</div>
      </div>
      <div class="archive-entry-word">
        ${entry.word.split('').map(l => `<div class="mini-tile concealed">${l}</div>`).join('')}
      </div>
    `;

    listEl.appendChild(div);
  });

  document.getElementById('archive-count').textContent = `${filteredArchive.length} entries`;

  // Pagination
  const pagEl = document.getElementById('pagination');
  if (totalPages <= 1) {
    pagEl.innerHTML = '';
  } else {
    pagEl.innerHTML = `
      <button ${archivePage === 0 ? 'disabled' : ''} onclick="archivePage--;renderArchive()">&#8592; Prev</button>
      <span>Page ${archivePage + 1} of ${totalPages}</span>
      <button ${archivePage >= totalPages - 1 ? 'disabled' : ''} onclick="archivePage++;renderArchive()">Next &#8594;</button>
    `;
  }
}

function toggleArchiveWord(el) {
  const tiles = el.querySelectorAll('.mini-tile');
  const isConcealed = tiles[0].classList.contains('concealed');
  tiles.forEach(t => {
    t.classList.toggle('concealed', !isConcealed);
    t.classList.toggle('shown', isConcealed);
  });
}

function clearMonthFilter() {
  document.getElementById('archive-month').value = '';
  archivePage = 0;
  renderArchive();
}

// --- Search ---

function handleSearch(query) {
  const resultsEl = document.getElementById('search-results');

  if (!query.trim()) {
    resultsEl.innerHTML = `
      <div class="search-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <p>Start typing to search through ${solutions.length} solution words</p>
      </div>`;
    return;
  }

  const lower = query.toLowerCase();
  const wordSet = new Set();
  const uniqueMatches = [];

  for (const word of solutions) {
    if (word.includes(lower) || word.startsWith(lower)) {
      if (!wordSet.has(word)) {
        wordSet.add(word);
        uniqueMatches.push(word);
      }
    }
  }

  // Also search archive for dates
  if (uniqueMatches.length === 0) {
    resultsEl.innerHTML = `
      <div class="no-results">
        <p>No results found for "${query}"</p>
      </div>`;
    return;
  }

  // Build lookup from archive
  const archiveLookup = {};
  archive.forEach(entry => {
    if (!archiveLookup[entry.word]) archiveLookup[entry.word] = [];
    archiveLookup[entry.word].push(entry.date);
  });

  let html = '';
  uniqueMatches.slice(0, 30).forEach(word => {
    const dates = archiveLookup[word] || [];
    const latestDate = dates.length > 0 ? dates[dates.length - 1] : 'N/A';
    const moreCount = Math.max(0, dates.length - 1);

    html += `
      <div class="search-result">
        <div style="display:flex;gap:3px;">
          ${word.split('').map(l => `<div class="mini-tile shown">${l}</div>`).join('')}
        </div>
        <div class="search-result-dates">
          ${latestDate}
          ${moreCount > 0 ? `<small>+${moreCount} more occurrence${moreCount > 1 ? 's' : ''}</small>` : ''}
        </div>
      </div>`;
  });

  resultsEl.innerHTML = html;
}

// --- Auto-refresh for day change ---

let lastDateStr = '';

function checkDayChange() {
  const today = getTodayIST();
  const dateStr = formatDate(today);
  if (lastDateStr && lastDateStr !== dateStr) {
    initToday();
    renderArchive();
  }
  lastDateStr = dateStr;
}

// --- Init ---

async function init() {
  try {
    const [archiveRes, solutionsRes] = await Promise.all([
      fetch('archive.json'),
      fetch('solutions.json'),
    ]);
    archive = await archiveRes.json();
    solutions = await solutionsRes.json();

    document.getElementById('stat-words').textContent = solutions.length;

    initToday();
    renderArchive();
    updateCountdown();

    setInterval(updateCountdown, 1000);
    setInterval(checkDayChange, 60000);
  } catch (err) {
    console.error('Failed to load data:', err);
    document.querySelector('.main').innerHTML = `
      <div style="text-align:center;padding:48px;color:var(--text-secondary);">
        <p style="font-size:18px;margin-bottom:8px;">Failed to load data</p>
        <p style="font-size:13px;">Please try refreshing the page.</p>
      </div>`;
  }
}

document.getElementById('archive-month').addEventListener('change', () => {
  archivePage = 0;
  renderArchive();
});

init();

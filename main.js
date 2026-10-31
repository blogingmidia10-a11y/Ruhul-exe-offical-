/* Ruhul Exe Official — site logic (plain JavaScript, no dependencies) */
(() => {
  'use strict';

  const CHANNEL_URL = 'https://www.youtube.com/@ruhulexe';
  const CHANNEL_ID  = 'UCc5tOTHFS79rpB6Rgvnsyhw';
  const MAX_VIDEOS  = 6;

  const $ = (sel) => document.querySelector(sel);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- helpers ---------- */
  function h(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function safeUrl(u) {
    try { const x = new URL(u); return x.protocol === 'https:' ? x.href : null; }
    catch { return null; }
  }
  async function getJSON(path) {
    const res = await fetch(path, { cache: 'no-cache' });
    if (!res.ok) throw new Error(path + ' ' + res.status);
    return res.json();
  }
  function fmtDate(d, opts) {
    return new Intl.DateTimeFormat(undefined, opts).format(d);
  }
  function emptyMsg(node, text, withLink) {
    node.replaceChildren();
    const p = h('p', 'empty', text + ' ');
    if (withLink) {
      const a = h('a', '', 'Visit the YouTube channel');
      a.href = CHANNEL_URL; a.target = '_blank'; a.rel = 'noopener';
      p.append(a, '.');
    }
    node.append(p);
  }

  /* ---------- mobile menu ---------- */
  const menuBtn = $('#menu-btn');
  const menu = $('#menu');
  function setMenu(open) {
    menu.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  menuBtn.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- hero loading bar (decorative) ---------- */
  (function loadBar() {
    const fill = $('#exe-fill'), pct = $('#exe-pct');
    if (reduceMotion) { fill.style.width = '100%'; pct.textContent = 'Ready'; return; }
    const start = performance.now() + 500, dur = 1400;
    (function tick(t) {
      const p = Math.max(0, Math.min(1, (t - start) / dur));
      const eased = 1 - Math.pow(1 - p, 3);
      fill.style.width = (eased * 100) + '%';
      pct.textContent = p >= 1 ? 'Ready' : Math.round(eased * 100) + '%';
      if (p < 1) requestAnimationFrame(tick);
    })(performance.now());
  })();

  $('#year').textContent = new Date().getFullYear();
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) $('#tz-label').textContent = ' (' + tz.replace(/_/g, ' ') + ')';
  } catch { /* ignore */ }

  /* ---------- settings (Instagram etc.) ---------- */
  let settings = { instagramUrl: '', autoLoadLatestVideos: true, showEndedStreamsForHours: 24 };
  async function loadSettings() {
    try { settings = Object.assign(settings, await getJSON('data/settings.json')); }
    catch { /* keep defaults */ }
    const ig = safeUrl(settings.instagramUrl);
    if (ig) {
      const card = $('#instagram-card'), foot = $('#footer-ig');
      card.href = ig; card.hidden = false;
      foot.href = ig; foot.hidden = false;
      const m = ig.match(/instagram\.com\/([^/?#]+)/i);
      if (m) $('#instagram-handle').textContent = '@' + m[1].replace(/^@/, '');
    }
  }

  /* ---------- live schedule ---------- */
  let streams = [];
  function streamState(s, now) {
    if (s.status === 'cancelled') return 'cancelled';
    if (s.status === 'postponed') return 'postponed';
    const start = new Date(s.start).getTime();
    const end = start + (Number(s.durationMinutes) || 120) * 60000;
    if (now < start) return 'upcoming';
    if (now < end) return 'live';
    return 'ended';
  }
  const STATE_LABEL = { upcoming: 'Upcoming', live: 'Live now', ended: 'Ended', cancelled: 'Cancelled', postponed: 'Postponed' };

  function renderSchedule() {
    const box = $('#schedule');
    const now = Date.now();
    const keepMs = (Number(settings.showEndedStreamsForHours) || 24) * 3600000;

    const list = streams
      .map((s) => ({ s, start: new Date(s.start), state: streamState(s, now) }))
      .filter((x) => !isNaN(x.start))
      .filter((x) => x.state !== 'ended' || now - x.start.getTime() < keepMs)
      .sort((a, b) => {
        const rank = { live: 0, upcoming: 1, postponed: 2, cancelled: 3, ended: 4 };
        return rank[a.state] - rank[b.state] || a.start - b.start;
      });

    updateNextStream(list);

    if (!list.length) {
      emptyMsg(box, 'No live streams are scheduled right now. Subscribe on YouTube and turn on notifications to get alerts when a stream is announced.', true);
      return;
    }

    box.replaceChildren(...list.map(({ s, start, state }) => {
      const row = h('article', 'stream' + (state === 'live' ? ' is-live' : '') + (state === 'ended' ? ' is-ended' : ''));

      const date = h('div', 's-date');
      date.append(h('span', 's-day', fmtDate(start, { day: 'numeric' })), h('span', 's-mon', fmtDate(start, { month: 'short' })));

      const info = h('div', 's-info');
      info.append(h('h3', 's-title', s.title || 'Live stream'));
      info.append(h('p', 's-time', fmtDate(start, { weekday: 'long', hour: 'numeric', minute: '2-digit' })));
      if (s.note) info.append(h('p', 's-note', s.note));

      const side = h('div', 's-side');
      side.append(h('span', 'pill ' + state, STATE_LABEL[state]));
      if (state === 'upcoming' || state === 'live') {
        const a = h('a', 'btn btn-primary btn-sm', 'Watch Live');
        a.href = safeUrl(s.url) || CHANNEL_URL; a.target = '_blank'; a.rel = 'noopener';
        side.append(a);
      }
      row.append(date, info, side);
      return row;
    }));
  }

  function updateNextStream(list) {
    const out = $('#next-stream');
    const live = list.find((x) => x.state === 'live');
    const next = list.find((x) => x.state === 'upcoming');
    const pick = live || next;
    if (!pick) { out.textContent = 'None scheduled yet'; return; }
    const when = fmtDate(pick.start, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    out.textContent = (live ? 'Live now: ' : '') + (pick.s.title || 'Live stream') + ' | ' + when;
  }

  async function loadSchedule() {
    try {
      const data = await getJSON('data/schedule.json');
      streams = Array.isArray(data) ? data : [];
      renderSchedule();
      setInterval(renderSchedule, 30000); // keeps "Live now" / "Ended" accurate
    } catch {
      emptyMsg($('#schedule'), 'The schedule could not be loaded right now.', true);
      $('#next-stream').textContent = 'See YouTube channel';
    }
  }

  /* ---------- updates ---------- */
  const TYPES = {
    video:     { label: 'New video',            cls: 't-video' },
    live:      { label: 'Live notification',    cls: 't-live' },
    milestone: { label: 'Subscriber milestone', cls: 't-milestone' },
    news:      { label: 'News',                 cls: 't-news' }
  };
  async function loadUpdates() {
    const box = $('#updates-list');
    try {
      const data = await getJSON('data/updates.json');
      const items = (Array.isArray(data) ? data : [])
        .filter((u) => u && u.title)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      if (!items.length) {
        emptyMsg(box, 'No announcements yet. New video news, live alerts and milestones will appear here.', true);
        return;
      }
      box.replaceChildren(...items.map((u) => {
        const t = TYPES[u.type] || TYPES.news;
        const card = h('article', 'card ' + t.cls);
        const top = h('div', 'card-top');
        top.append(h('span', 'card-type', t.label));
        const d = new Date(u.date);
        if (!isNaN(d)) top.append(h('span', 'card-date', fmtDate(d, { year: 'numeric', month: 'short', day: 'numeric' })));
        card.append(top, h('h3', '', u.title));
        if (u.text) card.append(h('p', '', u.text));
        const link = safeUrl(u.link);
        if (link) {
          const a = h('a', 'text-link', u.linkText || 'Open on YouTube');
          a.href = link; a.target = '_blank'; a.rel = 'noopener';
          card.append(a);
        }
        return card;
      }));
    } catch {
      emptyMsg(box, 'Updates could not be loaded right now.', true);
    }
  }

  /* ---------- videos ---------- */
  const ID_RE = /^[\w-]{11}$/;
  function videoIdFrom(v) {
    if (v.id && ID_RE.test(v.id)) return v.id;
    const m = String(v.url || v.link || '').match(/(?:v=|youtu\.be\/|shorts\/)([\w-]{11})/);
    return m ? m[1] : null;
  }
  function renderVideos(videos) {
    const box = $('#video-grid');
    const items = videos.map((v) => ({ ...v, vid: videoIdFrom(v) })).filter((v) => v.vid).slice(0, MAX_VIDEOS);
    if (!items.length) {
      emptyMsg(box, 'Videos are not listed here yet. Watch everything on YouTube.', true);
      return;
    }
    box.replaceChildren(...items.map((v) => {
      const a = h('a', 'video');
      a.href = 'https://www.youtube.com/watch?v=' + v.vid;
      a.target = '_blank'; a.rel = 'noopener';
      const title = v.title || 'Watch on YouTube';
      a.setAttribute('aria-label', 'Watch on YouTube: ' + title);

      const thumb = h('div', 'thumb');
      const img = document.createElement('img');
      img.src = 'https://i.ytimg.com/vi/' + v.vid + '/hqdefault.jpg';
      img.alt = ''; img.loading = 'lazy'; img.width = 480; img.height = 360;
      const play = h('span', 'play');
      play.innerHTML = '<svg aria-hidden="true"><use href="#i-play"/></svg>';
      thumb.append(img, play);

      const info = h('div', 'v-info');
      info.append(h('span', 'v-title', title));
      const d = new Date(v.date);
      if (v.date && !isNaN(d)) info.append(h('span', 'v-date', fmtDate(d, { year: 'numeric', month: 'short', day: 'numeric' })));

      a.append(thumb, info);
      return a;
    }));
  }

  // Optional free auto-load of the newest uploads from the channel's public RSS feed,
  // through the free rss2json converter. Turn off with "autoLoadLatestVideos": false.
  async function fetchFromFeed() {
    const feed = 'https://www.youtube.com/feeds/videos.xml?channel_id=' + CHANNEL_ID;
    const res = await fetch('https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(feed));
    if (!res.ok) throw new Error('feed ' + res.status);
    const data = await res.json();
    if (data.status !== 'ok' || !Array.isArray(data.items)) throw new Error('feed bad');
    return data.items.map((i) => ({ title: i.title, url: i.link, date: (i.pubDate || '').replace(' ', 'T') }));
  }

  async function loadVideos() {
    let manual = [];
    try { const d = await getJSON('data/videos.json'); manual = Array.isArray(d) ? d : []; } catch { /* none */ }
    if (manual.length) { renderVideos(manual); return; }
    if (settings.autoLoadLatestVideos) {
      try { renderVideos(await fetchFromFeed()); return; } catch { /* fall through */ }
    }
    renderVideos([]);
  }

  /* ---------- go ---------- */
  loadSettings().then(() => { loadSchedule(); loadUpdates(); loadVideos(); });
})();

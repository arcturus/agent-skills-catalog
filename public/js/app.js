(function () {
  'use strict';

  const API_BASE = '';
  const CATEGORY_KEYWORDS = {
    document: ['document', 'pdf', 'docx', 'pptx', 'xlsx', 'artifact', 'file', 'processing', 'extract', 'merge', 'annotate'],
    development: ['code', 'developer', 'programming', 'git', 'commit', 'api', 'script', 'build', 'typescript', 'javascript'],
    business: ['business', 'productivity', 'ads', 'competitive', 'domain', 'internal', 'comms', 'research', 'writer'],
    creative: ['creative', 'collaboration', 'design', 'canvas', 'art', 'image', 'brand', 'visual']
  };

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

  const grid = $('#skills-grid');
  const countEl = $('#skill-count');
  const searchInput = $('#search');
  const filtersEl = $('#filters');
  const loadingEl = $('#loading-state');
  const emptyEl = $('#empty-state');
  const errorEl = $('#error-state');
  const sourceReposEl = $('#source-repos');

  let allSkills = [];
  let configuredRepos = [];
  let currentCategory = 'all';
  let searchQuery = '';

  function inferCategory(skill) {
    const text = `${(skill.name || '')} ${(skill.description || '')}`.toLowerCase();
    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some(k => text.includes(k))) return cat;
    }
    return 'general';
  }

  function getCategoryLabel(key) {
    const labels = {
      all: 'All',
      document: 'Document & Processing',
      development: 'Development & Code',
      business: 'Business & Productivity',
      creative: 'Creative & Collaboration',
      general: 'General'
    };
    return labels[key] || key;
  }

  function matchesCategory(skill, category) {
    if (category === 'all') return true;
    return inferCategory(skill) === category;
  }

  function matchesSearch(skill, q) {
    if (!q.trim()) return true;
    const lower = q.toLowerCase();
    return (
      (skill.name && skill.name.toLowerCase().includes(lower)) ||
      (skill.description && skill.description.toLowerCase().includes(lower))
    );
  }

  function getFilteredSkills() {
    return allSkills.filter(
      s => matchesCategory(s, currentCategory) && matchesSearch(s, searchQuery)
    );
  }

  function renderCard(skill) {
    const category = inferCategory(skill);
    const card = document.createElement('article');
    card.className = 'skill-card';
    card.setAttribute('role', 'listitem');

    const name = escapeHtml(skill.name || 'Unnamed');
    const desc = escapeHtml(truncate(skill.description || '', 160));
    const categoryLabel = getCategoryLabel(category);

    card.innerHTML = `
      <h2>${name}</h2>
      <span class="category-tag">${escapeHtml(categoryLabel)}</span>
      <p class="description">${desc}</p>
      <div class="actions">
        <button type="button" class="btn btn-copy" data-skill-id="${skill.id}" data-skill-name="${escapeAttr(skill.name)}" title="Copy skill name">${iconCopy()} Copy</button>
        <a href="${API_BASE}/skills/${skill.id}/download" class="btn btn-download" download title="Download as zip">${iconDownload()} Download</a>
        ${skill.source_url ? `<a href="${escapeAttr(skill.source_url)}" class="btn btn-gh" target="_blank" rel="noopener" title="View on GitHub">${iconGitHub()} GitHub</a>` : ''}
      </div>
    `;

    const copyBtn = card.querySelector('.btn-copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => handleCopy(copyBtn));
    }

    return card;
  }

  function iconCopy() {
    return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
  }
  function iconDownload() {
    return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
  }
  function iconGitHub() {
    return '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>';
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }
  function escapeAttr(s) {
    return escapeHtml(String(s == null ? '' : s));
  }
  function truncate(s, len) {
    if (s.length <= len) return s;
    return s.slice(0, len).trim() + '…';
  }

  function handleCopy(btn) {
    const name = btn.getAttribute('data-skill-name') || '';
    const url = `${window.location.origin}${API_BASE}/skills/${btn.getAttribute('data-skill-id')}/download`;
    const text = `${name}\n${url}`;
    navigator.clipboard.writeText(text).then(() => {
      btn.innerHTML = 'Copied!';
      setTimeout(() => { btn.innerHTML = iconCopy() + ' Copy'; }, 1500);
    }).catch(() => {});
  }

  function getUniqueSourceReposFromSkills() {
    const repos = new Set();
    allSkills.forEach(s => {
      if (s.source_repo && s.source_repo.trim()) repos.add(s.source_repo.trim());
    });
    return [...repos].sort();
  }

  function renderSourceRepos() {
    const repos = configuredRepos.length > 0 ? configuredRepos : getUniqueSourceReposFromSkills();
    sourceReposEl.innerHTML = '';
    repos.forEach(repo => {
      const [owner, repoName] = repo.split('/');
      const label = repoName ? `${owner} / ${repoName}` : repo;
      const url = `https://github.com/${repo}`;
      const li = document.createElement('li');
      li.className = 'source-repo-item';
      li.innerHTML = `
        <a href="${escapeAttr(url)}" class="source-repo-link" target="_blank" rel="noopener" title="View ${escapeAttr(label)} on GitHub">
          <span class="source-repo-icon" aria-hidden="true">${iconGitHub()}</span>
          <span class="source-repo-label">${escapeHtml(label)}</span>
        </a>
      `;
      sourceReposEl.appendChild(li);
    });
  }

  function render() {
    const skills = getFilteredSkills();
    grid.innerHTML = '';
    skills.forEach((skill, index) => {
      const card = renderCard(skill);
      card.style.setProperty('--stagger', Math.min(index, 12));
      if (index === 0) card.classList.add('skill-card--featured');
      grid.appendChild(card);
    });

    countEl.textContent = `${skills.length} skill${skills.length !== 1 ? 's' : ''} in catalog`;
    loadingEl.hidden = true;
    emptyEl.hidden = skills.length > 0;
    errorEl.hidden = true;
    if (skills.length === 0 && allSkills.length > 0) {
      emptyEl.hidden = false;
    }
    renderSourceRepos();
  }

  function setLoading(loading) {
    loadingEl.hidden = !loading;
    if (loading) {
      emptyEl.hidden = true;
      errorEl.hidden = true;
    }
  }

  function setError(message) {
    loadingEl.hidden = true;
    emptyEl.hidden = true;
    errorEl.textContent = message || 'Failed to load skills.';
    errorEl.hidden = false;
  }

  function fetchSkills() {
    setLoading(true);
    fetch(`${API_BASE}/skills`)
      .then(r => {
        if (!r.ok) throw new Error(r.statusText);
        return r.json();
      })
      .then(data => {
        allSkills = data.skills || [];
        render();
      })
      .catch(err => {
        setError(err.message || 'Could not load skills. Is the server running?');
        allSkills = [];
        grid.innerHTML = '';
      });
  }

  function onSearch() {
    searchQuery = searchInput.value.trim();
    render();
  }

  function onFilterClick(e) {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    $$('.filter-btn', filtersEl).forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentCategory = btn.getAttribute('data-category') || 'all';
    render();
  }

  let searchDebounce;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(onSearch, 200);
  });
  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      clearTimeout(searchDebounce);
      onSearch();
    }
  });
  filtersEl.addEventListener('click', onFilterClick);

  function fetchConfiguredRepos() {
    fetch(`${API_BASE}/repos`)
      .then(r => (r.ok ? r.json() : { repos: [] }))
      .then(data => {
        configuredRepos = Array.isArray(data.repos) ? data.repos : [];
        renderSourceRepos();
      })
      .catch(() => {
        configuredRepos = [];
      });
  }

  fetchSkills();
  fetchConfiguredRepos();
})();

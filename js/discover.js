document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('discoverGrid');
  const search = document.getElementById('discoverSearch');
  const director = document.getElementById('discoverDirector');
  const sort = document.getElementById('discoverSort');
  const loading = document.getElementById('discoverLoading');
  const errorBox = document.getElementById('discoverError');
  const empty = document.getElementById('discoverEmpty');
  const count = document.getElementById('discoverCount');
  const refresh = document.getElementById('refreshFilms');
  const controls = [search, director, sort, refresh, ...document.querySelectorAll('[data-reset-discover]')];
  let films = [];
  let busy = false;

  function element(tag, className, text) {
    const node = document.createElement(tag);
    node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function filmCard(film) {
    const column = element('div', 'col-12 col-sm-6 col-lg-4 col-xl-3 discover-film');
    const card = element('article', 'card h-100 rounded-4 overflow-hidden hover-card');
    const image = element('img', 'discover-poster');
    image.alt = `Poster for ${film.title}`;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.width = 400;
    image.height = 600;
    image.addEventListener('error', () => {
      image.src = 'images/placeholder.svg';
      image.alt = `Poster unavailable for ${film.title}`;
    }, { once: true });
    try {
      const url = new URL(film.image);
      image.src = url.protocol === 'https:' ? url.href : 'images/placeholder.svg';
    } catch { image.src = 'images/placeholder.svg'; }
    const body = element('div', 'card-body d-flex flex-column');
    body.append(element('h2', 'h5 card-title fw-bold text-warning', film.title));
    body.append(element('p', 'small text-secondary mb-2', `${film.release_date} · ${film.running_time} min`));
    body.append(element('p', 'small mb-3', `Directed by ${film.director}`));
    const details = element('details', 'discover-details mt-auto');
    details.append(element('summary', 'fw-semibold', 'Film details'));
    details.append(element('p', 'small mt-3 mb-2', film.description));
    details.append(element('p', 'small mb-1', `Original title: ${film.original_title}`));
    details.append(element('p', 'small mb-0', `Producer: ${film.producer}`));
    body.append(details);
    card.append(image, body);
    column.append(card);
    return column;
  }

  function renderFilms() {
    const query = search.value.trim().toLowerCase();
    const matches = films.filter(film => film.title.toLowerCase().includes(query) &&
      (!director.value || film.director === director.value));
    matches.sort((a, b) => sort.value === 'title' ? a.title.localeCompare(b.title) :
      sort.value === 'oldest' ? Number(a.release_date) - Number(b.release_date) : Number(b.release_date) - Number(a.release_date));
    grid.replaceChildren(...matches.map(filmCard));
    empty.hidden = matches.length > 0;
    count.textContent = `${matches.length} of ${films.length} films`;
  }

  async function loadFilms() {
    if (busy) return;
    busy = true;
    films = [];
    controls.forEach(control => { control.disabled = true; });
    loading.hidden = false;
    errorBox.hidden = true;
    empty.hidden = true;
    grid.replaceChildren();
    count.textContent = '';
    grid.setAttribute('aria-busy', 'true');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch('https://ghibliapi.vercel.app/films', { signal: controller.signal });
      if (!response.ok) throw new Error('Request failed');
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('Invalid catalogue');
      const fields = ['title', 'director', 'release_date', 'running_time', 'image', 'description', 'original_title', 'producer'];
      films = data.filter(film => film && typeof film.title === 'string' && film.title.trim()).map(film => {
        const clean = {};
        fields.forEach(field => { clean[field] = typeof film[field] === 'string' ? film[field] : 'Not available'; });
        return clean;
      });
      const selectedDirector = director.value;
      director.replaceChildren(new Option('All directors', ''));
      [...new Set(films.map(film => film.director))].sort().forEach(name => director.add(new Option(name, name)));
      if ([...director.options].some(option => option.value === selectedDirector)) director.value = selectedDirector;
      renderFilms();
    } catch (error) {
      document.getElementById('discoverErrorText').textContent = error.name === 'AbortError' ?
        'The film library took too long to respond. Please try again.' :
        'We could not load the film library. Check your connection and try again.';
      errorBox.hidden = false;
    } finally {
      clearTimeout(timer);
      busy = false;
      controls.forEach(control => { control.disabled = false; });
      if (!films.length) [search, director, sort].forEach(control => { control.disabled = true; });
      loading.hidden = true;
      grid.setAttribute('aria-busy', 'false');
    }
  }

  search.addEventListener('input', renderFilms);
  director.addEventListener('change', renderFilms);
  sort.addEventListener('change', renderFilms);
  document.querySelectorAll('[data-reset-discover]').forEach(button => button.addEventListener('click', () => {
    search.value = '';
    director.value = '';
    sort.value = 'newest';
    if (films.length) renderFilms();
  }));
  refresh.addEventListener('click', loadFilms);
  document.getElementById('retryFilms').addEventListener('click', loadFilms);
  loadFilms();
});

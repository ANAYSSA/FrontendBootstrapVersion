(() => {
  const storageProblems = new Set();
  const normalizeEmail = value => String(value || '').trim().toLowerCase();

  // Reads fall back safely; writes and removal return false when browser storage is unavailable.
  const store = {
    read(key, fallback) {
      try {
        const value = localStorage.getItem(key);
        const result = value === null ? fallback : JSON.parse(value);
        storageProblems.delete(key);
        return result;
      } catch {
        storageProblems.add(key);
        return fallback;
      }
    },
    write(key, value) {
      try {
        const result = JSON.stringify(value);
        if (result === undefined) return false;
        localStorage.setItem(key, result);
        storageProblems.delete(key);
        return true;
      } catch {
        storageProblems.add(key);
        return false;
      }
    },
    remove(key) {
      try {
        localStorage.removeItem(key);
        storageProblems.delete(key);
        return true;
      } catch {
        storageProblems.add(key);
        return false;
      }
    }
  };
  window.CinemaStore = store;

  function getUsers() {
    const users = store.read('cinema-users', []);
    if (!Array.isArray(users)) {
      storageProblems.add('cinema-users');
      return [];
    }
    const valid = users.filter(user => user && typeof user.name === 'string' && typeof user.email === 'string' && typeof user.password === 'string' && typeof user.phone === 'string');
    if (valid.length !== users.length) storageProblems.add('cinema-users');
    return valid;
  }

  function currentUser() {
    const session = store.read('cinema-session', null);
    if (!session || typeof session.email !== 'string') return null;
    const user = getUsers().find(item => normalizeEmail(item.email) === normalizeEmail(session.email));
    return user ? { name: user.name, email: normalizeEmail(user.email), phone: user.phone } : null;
  }

  function updateNavigation() {
    const user = currentUser();
    document.querySelectorAll('[data-auth="guest"]').forEach(item => { item.hidden = !!user; });
    document.querySelectorAll('[data-auth="member"]').forEach(item => { item.hidden = !user; });
    document.querySelectorAll('[data-user-name]').forEach(item => { item.textContent = user?.name || ''; });
    return user;
  }

  function message(text, success = false) {
    const box = document.getElementById('accountMessage') || document.getElementById('siteToast');
    if (!box) return;
    box.textContent = text;
    box.hidden = false;
    box.classList.toggle('alert-success', success);
    box.classList.toggle('alert-danger', !success);
    if (box.id === 'siteToast' && window.jQuery) window.jQuery(box).stop(true, true).fadeIn(150).delay(4000).fadeOut(250);
  }

  function pending(form, active) {
    form.dataset.pending = active ? 'true' : '';
    form.setAttribute('aria-busy', String(active));
    form.querySelectorAll('input, button').forEach(field => { field.disabled = active; });
    const button = form.querySelector('[type="submit"]');
    if (!button.dataset.label) button.dataset.label = button.textContent.trim();
    button.replaceChildren();
    if (active) {
      const spinner = document.createElement('span');
      spinner.className = 'spinner-border spinner-border-sm me-2';
      spinner.setAttribute('aria-hidden', 'true');
      button.append(spinner, document.createTextNode('Please wait...'));
    } else button.textContent = button.dataset.label;
  }

  function signedIn(email) {
    if (!store.write('cinema-session', { email })) return false;
    updateNavigation();
    window.dispatchEvent(new CustomEvent('cinema:authchange'));
    window.location.assign('profile.html');
    return true;
  }

  function logout() {
    if (!store.remove('cinema-session')) {
      message('Your browser could not clear the saved session. Please allow site storage and try again.');
      return;
    }
    updateNavigation();
    window.dispatchEvent(new CustomEvent('cinema:authchange'));
    window.location.assign('login.html?loggedout=1');
  }

  function renderProfile() {
    const content = document.getElementById('profileContent');
    if (!content) return;
    const user = currentUser();
    document.getElementById('profileGuest').hidden = !!user;
    content.hidden = !user;
    if (!user) return;
    for (const key of ['name', 'email', 'phone']) document.getElementById('profile' + key[0].toUpperCase() + key.slice(1)).textContent = user[key];
    const records = store.read('cinema-bookings', []);
    const bookings = Array.isArray(records) ? records.filter(record => record && normalizeEmail(record.email) === user.email) : [];
    if (!Array.isArray(records) || storageProblems.has('cinema-bookings')) message('Your saved reservations could not be read. You can still browse films and make a new reservation.');
    bookings.sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0));
    const list = document.getElementById('profileBookings');
    list.replaceChildren();
    document.getElementById('bookingCount').textContent = String(bookings.length);
    document.getElementById('emptyBookings').hidden = bookings.length > 0;
    const titles = { odyssey: 'The Odyssey', dune3: 'Dune: Part Three', spiderman: 'Spider-Man: Brand New Day', fall2: 'Fall 2: Deadpoint', backrooms: 'Backrooms', inception: 'Inception', interstellar: 'Interstellar', avatar: 'Avatar: Fire and Ash', batman: 'The Batman: Part II' };
    bookings.forEach(record => {
      const item = document.createElement('article');
      item.className = 'booking-record';
      const title = document.createElement('h3');
      title.className = 'h5 fw-bold mb-2';
      title.textContent = titles[record.movie] || String(record.movie || 'Movie session');
      const details = document.createElement('p');
      details.className = 'small mb-2';
      const total = Number(record.total);
      const price = Number.isFinite(total) ? new Intl.NumberFormat('en-US').format(total) + ' KZT' : 'Price unavailable';
      const tier = { front: 'Front rows', middle: 'Standard', vip: 'VIP' }[record.tier] || 'Standard';
      details.textContent = `${record.time || 'Time unavailable'} · ${tier} · ${price}`;
      const code = document.createElement('span');
      code.className = 'reservation-code';
      code.textContent = String(record.code || 'No code');
      const copy = document.createElement('button');
      copy.type = 'button';
      copy.className = 'btn btn-sm btn-outline-warning copy-button';
      copy.dataset.copy = code.textContent;
      copy.textContent = 'Copy code';
      const row = document.createElement('div');
      row.className = 'd-flex flex-wrap align-items-center gap-2';
      row.append(code, copy);
      const date = new Date(record.createdAt);
      const saved = document.createElement('p');
      saved.className = 'small mb-0 mt-2';
      saved.textContent = Number.isNaN(date.getTime()) ? 'Saved in this browser' : 'Saved on ' + date.toLocaleDateString('en-GB', { timeZone: 'Asia/Almaty', day: 'numeric', month: 'short', year: 'numeric' });
      item.append(title, details, row, saved);
      list.append(item);
    });
  }

  window.CinemaAuth = { currentUser, updateNavigation, logout };
  document.addEventListener('DOMContentLoaded', () => {
    const user = updateNavigation();
    renderProfile();
    const signup = document.getElementById('signup-form');
    const login = document.getElementById('login-form');
    if (user && (signup || login)) {
      window.location.replace('profile.html');
      return;
    }
    if (login && new URLSearchParams(window.location.search).has('loggedout')) message('You have been logged out.', true);
    signup?.addEventListener('submit', event => {
      event.preventDefault();
      if (signup.dataset.pending) return;
      const formRules = {
        signupName: CinemaForms.rules.name,
        signupEmail: CinemaForms.rules.email,
        signupPhone: CinemaForms.rules.phone,
        signupPassword: CinemaForms.rules.password,
        signupConfirm: value => value === document.getElementById('signupPassword').value && !!value ? '' : 'Re-enter the same password.',
        signupConsent: (value, field) => field.checked ? '' : 'Accept the demo account terms to continue.'
      };
      if (!CinemaForms.check(signup, formRules)) return;
      const users = getUsers();
      if (storageProblems.has('cinema-users')) return message('Saved demo accounts could not be read. Check browser storage or clear this site\'s data before creating an account.');
      const email = normalizeEmail(document.getElementById('signupEmail').value);
      if (users.some(item => normalizeEmail(item.email) === email)) {
        CinemaForms.check(signup, { ...formRules, signupEmail: value => normalizeEmail(value) === email ? 'An account with this email already exists. Please log in.' : CinemaForms.rules.email(value) });
        return;
      }
      const account = {
        name: document.getElementById('signupName').value.trim(),
        email,
        phone: document.getElementById('signupPhone').value.trim(),
        password: document.getElementById('signupPassword').value
      };
      pending(signup, true);
      setTimeout(() => {
        const latest = getUsers();
        if (storageProblems.has('cinema-users') || latest.some(item => normalizeEmail(item.email) === email)) {
          pending(signup, false);
          return message('Account data changed. Please check this email and try again.');
        }
        if (!store.write('cinema-users', [...latest, account])) {
          pending(signup, false);
          return message('Your browser could not save the account. Allow local storage for this site and try again.');
        }
        if (!signedIn(email)) {
          pending(signup, false);
          message('Account created, but the session could not be saved. Allow local storage, then log in.');
        }
      }, 500);
    });
    login?.addEventListener('submit', event => {
      event.preventDefault();
      if (login.dataset.pending) return;
      if (!CinemaForms.check(login, { loginEmail: CinemaForms.rules.email, loginPassword: CinemaForms.rules.password })) return;
      const email = normalizeEmail(document.getElementById('loginEmail').value);
      const password = document.getElementById('loginPassword').value;
      const users = getUsers();
      if (storageProblems.has('cinema-users')) return message('Saved accounts could not be read. Check that local storage is allowed in this browser.');
      if (!users.some(item => normalizeEmail(item.email) === email && item.password === password)) return message('Email or password is incorrect. Check your details or create an account.');
      pending(login, true);
      setTimeout(() => {
        if (!signedIn(email)) {
          pending(login, false);
          message('Your browser could not save the session. Allow local storage and try again.');
        }
      }, 500);
    });
    document.addEventListener('click', event => {
      const button = event.target.closest('[data-logout]');
      if (!button) return;
      event.preventDefault();
      logout();
    });
  });
  window.addEventListener('storage', event => {
    if (event.key === 'cinema-users' || event.key === 'cinema-session' || event.key === 'cinema-bookings' || event.key === null) {
      updateNavigation();
      renderProfile();
    }
  });
})();

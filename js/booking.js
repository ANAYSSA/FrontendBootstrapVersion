document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('booking-form');
  if (!form) return;
  const field = id => document.getElementById(id);
  const prices = { odyssey: 2800, dune3: 2600, spiderman: 2800, fall2: 2400, backrooms: 2200, inception: 2500 };
  const movie = field('movie');
  const showtime = field('sessionTime');
  const discountBox = field('studentDiscountCheck');
  const [placeholder, ...sessions] = showtime.options;

  function updateShowtimes() {
    const available = sessions.filter(option => option.dataset.movie === movie.value);
    showtime.replaceChildren(...(available.length ? available : [placeholder]));
    showtime.selectedIndex = 0;
    showtime.disabled = !available.length;
  }

  function weekdaySession() {
    return showtime.value.endsWith(' weekdays');
  }

  function updateDiscount() {
    discountBox.disabled = !!showtime.value && !weekdaySession();
    if (discountBox.disabled) discountBox.checked = false;
  }

  let pending = false;
  function fillAccount() {
    const user = CinemaAuth.currentUser();
    field('bookingAccess').hidden = !!user;
    if (user) {
      field('fullname').value = user.name;
      field('email').value = user.email;
      field('phone').value = user.phone;
    }
    return user;
  }
  function total() {
    const base = prices[field('movie').value] || 0;
    const tier = form.querySelector('[name="seatingTier"]:checked')?.value || 'middle';
    const ticket = base ? base + (tier === 'vip' ? 1500 : 0) : 0;
    const discount = weekdaySession() && discountBox.checked ? Math.round(ticket * 0.25) : 0;
    const extras = base && field('comboPopcorn').checked ? 1500 : 0;
    const sum = ticket - discount + extras;
    field('bookingTotal').textContent = sum.toLocaleString('en-US') + ' ₸';
    field('bookingBreakdown').textContent = base ? `Ticket ${ticket.toLocaleString('en-US')} ₸ · Discount −${discount.toLocaleString('en-US')} ₸ · Extras ${extras.toLocaleString('en-US')} ₸` : 'Select a movie to see your total.';
    return sum;
  }
  fillAccount();
  const query = new URLSearchParams(location.search);
  if (sessions.some(option => option.dataset.movie === query.get('movie'))) movie.value = query.get('movie');
  updateShowtimes();
  const requestedSession = query.get('time') + ' ' + query.get('period');
  if (Array.from(showtime.options).some(option => option.value === requestedSession)) showtime.value = requestedSession;
  if (query.get('tier') === 'vip') field('tierVip').checked = true;
  discountBox.checked = query.get('student') === '1';
  updateDiscount();
  total();

  form.addEventListener('change', event => {
    if (event.target === movie) updateShowtimes();
    updateDiscount();
    total();
  });

  function resetBooking() {
    form.reset();
    fillAccount();
    updateShowtimes();
    updateDiscount();
    total();
    CinemaForms.clear(form);
  }

  const rules = {
    fullname: CinemaForms.rules.name,
    email: CinemaAuth.checkAccountEmail,
    phone: CinemaForms.rules.phone,
    movie: value => prices[value] ? '' : 'Choose a movie.',
    sessionTime: value => sessions.some(option => option.dataset.movie === movie.value && option.value === value) ? '' : 'Choose a showtime.',
    termsCheck: (value, element) => element.checked ? '' : 'Please confirm that you understand this is a demo.'
  };
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (pending) return;
    const user = CinemaAuth.currentUser();
    if (!user) { field('bookingAccess').hidden = false; field('bookingAccess').scrollIntoView({ block: 'center' }); return; }
    if (!CinemaForms.check(form, rules)) return;
    const record = {
      code: 'CINEMA-' + Date.now().toString(36).toUpperCase(),
      email: user.email,
      movie: field('movie').selectedOptions[0].textContent.split(' - ')[0],
      time: showtime.value.split(' ')[0],
      showtimeLabel: showtime.selectedOptions[0].textContent,
      note: field('comment').value.trim(),
      tier: form.querySelector('[name="seatingTier"]:checked').value,
      total: total(),
      createdAt: new Date().toISOString()
    };
    pending = true;
    const controls = [...form.querySelectorAll('input, select, textarea, button')];
    controls.forEach(control => control.disabled = true);
    form.setAttribute('aria-busy', 'true');
    const button = form.querySelector('[type="submit"]');
    button.innerHTML = '<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Please wait...';
    setTimeout(() => {
      let bookings = CinemaStore.read('cinema-bookings', []);
      if (!Array.isArray(bookings)) bookings = [];
      const sameUser = CinemaAuth.currentUser()?.email === user.email;
      const saved = sameUser && CinemaStore.write('cinema-bookings', [...bookings, record]);
      const status = field('bookingStatus');
      status.replaceChildren();
      status.className = saved ? 'alert alert-success' : 'alert alert-danger';
      if (saved) {
        const text = document.createElement('p');
        text.textContent = `Demo reservation saved: ${record.movie}, ${record.time}. Reference: ${record.code}`;
        const copy = document.createElement('button');
        copy.type = 'button'; copy.className = 'btn btn-sm btn-outline-success copy-button me-2';
        copy.dataset.copy = record.code; copy.textContent = 'Copy code';
        const profile = document.createElement('a'); profile.href = 'profile.html'; profile.textContent = 'View in Profile';
        status.append(text, copy, profile);
        $('#siteToast').stop(true, true).text('Demo reservation saved.').fadeIn(180).delay(2500).fadeOut(350);
      } else status.textContent = sameUser ? 'Unable to save. Enable browser storage and try again.' : 'Your session changed. Please sign in and try again.';
      controls.forEach(control => control.disabled = false);
      if (saved) resetBooking();
      else updateDiscount();
      button.textContent = 'Confirm Reservation'; form.removeAttribute('aria-busy'); pending = false;
      status.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 1000);
  });
  field('resetBookingBtn').addEventListener('click', () => {
    resetBooking();
    field('bookingStatus').replaceChildren(); field('bookingStatus').className = '';
  });
});

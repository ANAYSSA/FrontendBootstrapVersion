document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('booking-form');
  if (!form) return;
  const field = id => document.getElementById(id);
  const prices = { odyssey: 2800, dune3: 2600, spiderman: 2800, fall2: 2400, backrooms: 2200, inception: 2500, interstellar: 3200, avatar: 3000, batman: 2800 };
  const times = ['12:00', '12:15', '14:30', '15:30', '17:15', '18:00', '18:45', '20:00', '21:30', '23:00', '23:55'];
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
    const discount = field('studentDiscountCheck').checked ? Math.round(ticket * 0.25) : 0;
    const extras = base && field('comboPopcorn').checked ? 1500 : 0;
    const sum = ticket - discount + extras;
    field('bookingTotal').textContent = sum.toLocaleString('en-US') + ' ₸';
    field('bookingBreakdown').textContent = base ? `Ticket ${ticket.toLocaleString('en-US')} ₸ · Discount −${discount.toLocaleString('en-US')} ₸ · Extras ${extras.toLocaleString('en-US')} ₸` : 'Select a movie to see your total.';
    return sum;
  }
  fillAccount();
  const query = new URLSearchParams(location.search);
  if (prices[query.get('movie')]) field('movie').value = query.get('movie');
  if (times.includes(query.get('time'))) field('sessionTime').value = query.get('time');
  if (query.get('tier') === 'vip') field('tierVip').checked = true;
  if (query.get('student') === '1') field('studentDiscountCheck').checked = true;
  total();
  form.addEventListener('change', total);
  const rules = {
    fullname: CinemaForms.rules.name,
    email: CinemaForms.rules.email,
    phone: CinemaForms.rules.phone,
    movie: value => prices[value] ? '' : 'Choose a movie.',
    sessionTime: value => times.includes(value) ? '' : 'Choose a showtime.',
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
      time: field('sessionTime').value,
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
        form.reset(); fillAccount(); total();
        CinemaForms.clear(form);
        $('#siteToast').stop(true, true).text('Demo reservation saved.').fadeIn(180).delay(2500).fadeOut(350);
      } else status.textContent = sameUser ? 'Unable to save. Enable browser storage and try again.' : 'Your session changed. Please sign in and try again.';
      controls.forEach(control => control.disabled = false);
      button.textContent = 'Confirm Reservation'; form.removeAttribute('aria-busy'); pending = false;
      status.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 1000);
  });
  field('resetBookingBtn').addEventListener('click', () => {
    form.reset(); fillAccount(); total();
    CinemaForms.clear(form);
    field('bookingStatus').replaceChildren(); field('bookingStatus').className = '';
  });
});

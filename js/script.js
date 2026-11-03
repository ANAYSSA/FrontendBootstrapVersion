$(document).ready(function () {
  console.log('jQuery is ready!');

  let toastTimer;
  function notify(message) {
    clearTimeout(toastTimer);
    $('#siteToast').stop(true, true).text(message).fadeIn(180);
    toastTimer = setTimeout(() => $('#siteToast').fadeOut(350), 3000);
  }

  function highlight(element, query) {
    const original = $(element).data('original') || element.textContent;
    $(element).data('original', original).empty();
    if (!query) return $(element).text(original);
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(escaped, 'gi');
    let start = 0;
    for (const match of original.matchAll(pattern)) {
      element.append(document.createTextNode(original.slice(start, match.index)));
      element.append($('<mark>').text(match[0])[0]);
      start = match.index + match[0].length;
    }
    element.append(document.createTextNode(original.slice(start)));
  }

  const cards = $('.movie-card-item');
  const titles = cards.map(function () { return $(this).find('.card-title').text(); }).get();
  let format = 'all';
  let suggestionIndex = -1;
  function filterMovies() {
    const query = String($('#movieSearch').val() || '').trim();
    const matches = cards.filter(function () {
      return (format === 'all' || this.dataset.category === format) &&
        $(this).text().toLowerCase().includes(query.toLowerCase());
    });
    cards.hide();
    matches.show();
    $('#noMovies').prop('hidden', matches.length > 0);
    $('#searchCount').text(`${matches.length} movie${matches.length === 1 ? '' : 's'} found`);
    cards.find('.card-title, .card-text').each(function () { highlight(this, query); });
    revealImages();
  }
  function closeSuggestions() {
    $('#movieSuggestions').prop('hidden', true);
    $('#movieSearch').attr('aria-expanded', 'false').removeAttr('aria-activedescendant');
    suggestionIndex = -1;
  }
  $('#movieSearch').on('input', function () {
    filterMovies();
    const query = this.value.trim().toLowerCase();
    const list = $('#movieSuggestions').empty();
    suggestionIndex = -1;
    titles.filter(title => query && title.toLowerCase().includes(query)).forEach((title, i) => {
      $('<li>').append($('<button>', {
        type: 'button', role: 'option', id: `suggestion-${i}`, text: title,
        'aria-selected': 'false', tabindex: '-1'
      })).appendTo(list);
    });
    list.prop('hidden', !list.children().length);
    $(this).attr('aria-expanded', String(!!list.children().length)).removeAttr('aria-activedescendant');
  }).on('keydown', function (event) {
    const options = $('#movieSuggestions button');
    if (event.key === 'Escape') { event.preventDefault(); closeSuggestions(); }
    if ($('#movieSuggestions').prop('hidden') || !options.length) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      suggestionIndex = (suggestionIndex + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
      options.removeClass('selected').attr('aria-selected', 'false');
      options.eq(suggestionIndex).addClass('selected').attr('aria-selected', 'true');
      $(this).attr('aria-activedescendant', options[suggestionIndex].id);
    }
    if (event.key === 'Enter' && suggestionIndex >= 0) {
      event.preventDefault();
      options.eq(suggestionIndex).trigger('click');
    }
  });
  $('#movieSuggestions').on('click', 'button', function () {
    $('#movieSearch').val($(this).text()).trigger('focus');
    closeSuggestions();
    filterMovies();
  });
  $(document).on('click', function (event) {
    if (!$(event.target).closest('.movie-search').length) closeSuggestions();
  });
  $('.format-filter-btn').on('click', function () {
    switch (this.dataset.filter) {
      case 'imax': format = 'imax'; break;
      case 'dolby': format = 'dolby'; break;
      case 'standard': format = 'standard'; break;
      default: format = 'all';
    }
    $('.format-filter-btn').removeClass('btn-warning active').addClass('btn-outline-secondary').attr('aria-pressed', 'false');
    $(this).addClass('btn-warning active').removeClass('btn-outline-secondary').attr('aria-pressed', 'true');
    closeSuggestions();
    filterMovies();
  });

  $('#faqSearch').on('input', function () {
    const query = this.value.trim();
    let count = 0;
    $('.cinema-accordion-item').each(function () {
      const match = $(this).text().toLowerCase().includes(query.toLowerCase());
      $(this).toggle(match);
      if (match) count++;
      $(this).find('.cinema-accordion-header > span:first-child, .cinema-accordion-body-inner').each(function () {
        highlight(this, query);
      });
      if (query && match && !$(this).hasClass('active')) $(this).find('.cinema-accordion-header').trigger('click');
      const body = $(this).find('.cinema-accordion-body')[0];
      if ($(this).hasClass('active')) body.style.maxHeight = body.scrollHeight + 'px';
    });
    $('#faqCount').text(query ? `${count} matching answer${count === 1 ? '' : 's'}` : '');
  });

  function updateProgress() {
    const distance = document.documentElement.scrollHeight - window.innerHeight;
    const progress = distance > 0 ? Math.min(100, Math.max(0, window.scrollY / distance * 100)) : 100;
    $('#scrollProgress').css('width', progress + '%').attr('aria-valuenow', Math.round(progress));
  }
  function animateCounters() {
    $('.counter:not(.counted)').each(function () {
      if (this.getBoundingClientRect().top >= window.innerHeight) return;
      $(this).addClass('counted');
      const element = this;
      $({ count: 0 }).animate({ count: Number(this.dataset.count) }, {
        duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1200,
        step: function (value) { $(element).text(Math.floor(value)); },
        complete: function () { $(element).text(element.dataset.count); }
      });
    });
  }
  function revealImages() {
    $('img[data-src]').filter(':visible').each(function () {
      const rect = this.getBoundingClientRect();
      if (rect.top < window.innerHeight + 100 && rect.bottom > -100) {
        $(this).attr('src', $(this).attr('data-src')).removeAttr('data-src').addClass('loaded');
      }
    });
  }
  $(window).on('scroll resize', function () {
    updateProgress();
    animateCounters();
    revealImages();
  }).on('load', function () { updateProgress(); revealImages(); });
  updateProgress();
  animateCounters();
  revealImages();

  const movie = new URLSearchParams(window.location.search).get('movie');
  if (movie && $('#movie option').filter(function () { return this.value === movie; }).length) $('#movie').val(movie);

  function validForm(form) {
    $(form).find('[required]').each(function () {
      if (this.type === 'email') this.value = this.value.trim();
      let valid = this.checkValidity();
      if (this.id === 'fullname' || this.id === 'regName') valid = this.value.trim().length >= 3;
      if (this.id === 'regPassword') valid = this.value.length >= 8;
      if (this.id === 'regConfirmPassword') valid = !!this.value && this.value === $('#regPassword').val();
      $(this).toggleClass('is-invalid', !valid).toggleClass('is-valid', valid);
      if (this.id.startsWith('reg')) {
        $(this).siblings('.invalid-feedback').text(this.type === 'checkbox' ? 'Please accept the terms.' : 'Please check this field.');
      }
    });
    const invalid = $(form).find('.is-invalid');
    if (invalid.length) invalid.first().trigger('focus');
    return !invalid.length;
  }
  function simulateSubmit(data, callback) {
    setTimeout(() => callback(data), 1400);
  }
  $('#booking-form, #clubRegistrationForm').on('submit', function (event) {
    event.preventDefault();
    const form = this;
    if ($(form).data('pending') || !validForm(form)) return;
    const button = $(form).find('[type="submit"]');
    const label = button.html();
    const booking = form.id === 'booking-form';
    const data = { name: $(booking ? '#fullname' : '#regName').val().trim() };
    $(form).data('pending', true).attr('aria-busy', 'true');
    $(form).find('input, select, textarea, button').prop('disabled', true);
    button.html('<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Please wait...');
    simulateSubmit(data, function (result) {
      $(form).find('input, select, textarea, button').prop('disabled', false);
      button.html(label);
      $(form).data('pending', false).removeAttr('aria-busy');
      form.reset();
      $(form).find('.is-valid, .is-invalid').removeClass('is-valid is-invalid');
      if (booking) {
        $('#bookingSuccessAlert').remove();
        const code = 'CINEMA-' + Math.floor(1000 + Math.random() * 9000);
        const alert = $('<div>', { id: 'bookingSuccessAlert', class: 'alert alert-success mt-3', role: 'status' });
        alert.append($('<strong>').text(`Demo reservation saved for ${result.name}. `));
        alert.append($('<span>', { id: 'bookingCode', text: code }));
        alert.append(' ', $('<button>', { type: 'button', class: 'btn btn-sm btn-outline-success copy-button', 'data-copy': code, text: 'Copy code' }));
        $(form).prepend(alert);
        notify('Demo reservation saved.');
      } else {
        $('#formSuccessAlert').removeClass('d-none').text(`Thank you, ${result.name}! Your demo registration is complete.`);
        notify('Demo VIP registration complete.');
      }
    });
  }).on('input change', '[required]', function () {
    $(this).removeClass('is-invalid is-valid');
  });
  $('#resetBookingBtn').on('click', function () {
    const form = $('#booking-form')[0];
    form.reset();
    $(form).find('.is-valid, .is-invalid').removeClass('is-valid is-invalid');
    $('#bookingSuccessAlert').remove();
    notify('Reservation form reset.');
  });

  $(document).on('click', '.copy-button', async function () {
    const button = $(this);
    if (button.hasClass('copied')) return;
    const text = this.dataset.copy;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const field = $('<textarea>').val(text).css({ position: 'fixed', opacity: 0 }).appendTo('body');
        field[0].select();
        const copied = document.execCommand('copy');
        field.remove();
        if (!copied) throw new Error('Copy unavailable');
        this.focus();
      }
      const label = button.text();
      button.text('✓ Copied').attr('title', 'Copied to clipboard!').attr('aria-label', 'Copied to clipboard!').addClass('copied');
      notify('Copied to clipboard!');
      setTimeout(() => button.text(label).removeAttr('title aria-label').removeClass('copied'), 2200);
    } catch {
      notify('Copy unavailable. Please select and copy the text.');
    }
  });
});

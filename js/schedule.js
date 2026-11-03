$(document).ready(function () {
  let period = 'all';
  let hall = 'all';
  const rows = $('.schedule-row');

  function filterSchedule() {
    let matches = 0;
    rows.each(function () {
      const row = $(this);
      const visible = (hall === 'all' || row.attr('data-hall') === hall) &&
        (period === 'all' || row.attr('data-days').split(' ').includes(period));
      row.toggle(visible);
      if (visible) matches++;
    });
    $('#scheduleEmpty').prop('hidden', matches > 0);
    $(window).trigger('scroll');
  }

  $('[data-schedule-period]').on('click', function () {
    period = $(this).attr('data-schedule-period');
    $('[data-schedule-period]').removeClass('btn-warning active text-white')
      .addClass('btn-outline-secondary text-light').attr('aria-pressed', 'false');
    $(this).removeClass('btn-outline-secondary text-light')
      .addClass('btn-warning active text-white').attr('aria-pressed', 'true');
    filterSchedule();
  });

  $('[data-schedule-hall]').on('click', function () {
    hall = $(this).attr('data-schedule-hall');
    $('[data-schedule-hall]').removeClass('active text-warning')
      .addClass('text-light').attr('aria-pressed', 'false');
    $(this).removeClass('text-light').addClass('active text-warning').attr('aria-pressed', 'true');
    filterSchedule();
  });
});

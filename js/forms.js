(() => {
  const rulesByForm = new WeakMap();

  function showError(field, error) {
    const id = field.id + 'Error';
    let feedback = document.getElementById(id);
    if (!feedback) {
      feedback = document.createElement('div');
      feedback.id = id;
      feedback.className = 'invalid-feedback';
      (field.closest('.input-group') || field).insertAdjacentElement('afterend', feedback);
    }
    feedback.textContent = error;
    feedback.classList.toggle('d-block', !!error);
    feedback.hidden = !error;
    field.classList.toggle('is-invalid', !!error);
    field.setAttribute('aria-invalid', String(!!error));
    const descriptions = new Set((field.getAttribute('aria-describedby') || '').split(' ').filter(Boolean));
    descriptions.add(id);
    field.setAttribute('aria-describedby', [...descriptions].join(' '));
  }

  function validate(form, rules, focus) {
    let firstInvalid;
    for (const [id, rule] of Object.entries(rules)) {
      const field = document.getElementById(id);
      if (!field || !form.contains(field)) continue;
      const error = rule(field.value, field) || '';
      showError(field, error);
      if (error && !firstInvalid) firstInvalid = field;
    }
    if (focus) firstInvalid?.focus();
    return !firstInvalid;
  }

  function clear(form) {
    form.querySelectorAll('.is-invalid, .is-valid').forEach(field => field.classList.remove('is-invalid', 'is-valid'));
    form.querySelectorAll('[aria-invalid]').forEach(field => field.setAttribute('aria-invalid', 'false'));
    form.querySelectorAll('.invalid-feedback').forEach(feedback => {
      feedback.textContent = '';
      feedback.classList.remove('d-block');
      feedback.hidden = true;
    });
    form.dataset.validated = '';
  }

  const rules = {
    name(value) {
      return value.trim().length >= 3 ? '' : 'Enter your full name using at least 3 characters.';
    },
    email(value) {
      return /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(value.trim()) && !value.includes('..')
        ? '' : 'Enter a valid email address, for example name@example.com.';
    },
    phone(value) {
      const digits = value.replace(/\D/g, '');
      return /^\+?[\d ()-]+$/.test(value.trim()) && digits.length >= 10 && digits.length <= 15
        ? '' : 'Enter a phone number with 10-15 digits. Spaces, brackets and an initial + are allowed.';
    },
    password(value) {
      return value.length >= 8 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value) && /[^a-z0-9\s]/i.test(value)
        ? '' : 'Use at least 8 characters with an uppercase letter, a lowercase letter, a number and a symbol.';
    }
  };

  window.CinemaForms = {
    rules,
    clear,
    check(form, fieldRules) {
      if (!rulesByForm.has(form)) {
        const recheck = () => {
          if (form.dataset.validated) validate(form, rulesByForm.get(form), false);
        };
        form.addEventListener('input', recheck);
        form.addEventListener('change', recheck);
        form.addEventListener('reset', () => clear(form));
      }
      rulesByForm.set(form, fieldRules);
      form.dataset.validated = 'true';
      return validate(form, fieldRules, true);
    }
  };
})();

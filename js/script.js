document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form_data');
  if (!form) return;

  const destination = form.querySelector('#destination');
  const checkbox = form.querySelector('#formAgreement');
  const required = form.querySelectorAll('._req');

  // Сообщения пользователю
  let messageEl = document.querySelector('.message');
  if (!messageEl) {
    messageEl = document.createElement('div');
    messageEl.className = 'message';
    messageEl.style.display = 'none';
    form.parentElement.appendChild(messageEl);
  }

  const showMessage = (text, isError = false) => {
    messageEl.textContent = text;
    messageEl.style.display = 'block';
    messageEl.style.opacity = '1';
    messageEl.style.color = isError ? '#ffb3b3' : '#c7ffbf';

    clearTimeout(showMessage._t);
    showMessage._t = setTimeout(() => {
      messageEl.style.opacity = '0';
      setTimeout(() => (messageEl.style.display = 'none'), 400);
    }, 6000);
  };

  const addError = (el) => el?.classList?.add('_error');
  const removeError = (el) => el?.classList?.remove('_error');

  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim());

  const validate = () => {
    let ok = true;

    // очистка ошибок
    required.forEach(removeError);
    destination && removeError(destination);
    checkbox?.closest('.checkbox')?.classList.remove('_error');

    // обязательные поля (кроме checkbox)
    required.forEach((input) => {
      if (input.type === 'checkbox') return;
      const val = String(input.value ?? '').trim();
      if (!val) {
        addError(input);
        ok = false;
      }
      if (input.classList.contains('_email') && val && !isValidEmail(val)) {
        addError(input);
        ok = false;
      }
    });

    // destination
    if (destination) {
      const val = String(destination.value || '').trim();
      if (!val || val === '--') {
        addError(destination);
        ok = false;
      }
    }

    // agreement
    if (checkbox && !checkbox.checked) {
      checkbox.closest('.checkbox')?.classList.add('_error');
      ok = false;
    }

    // Если выбрали INÉ — нужна "Správa pre vodiča"
    if (destination && destination.value === 'INÉ') {
      const txt = String(form.querySelector('#text')?.value || '').trim();
      if (!txt) {
        addError(form.querySelector('#text'));
        ok = false;
      }
    }

    return ok;
  };

  // убирать красную подсветку при вводе
  form.addEventListener('input', (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    removeError(t);
    if (t.id === 'formAgreement') t.closest('.checkbox')?.classList.remove('_error');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validate()) {
      showMessage('Skontrolujte prosím povinné polia (označené *).', true);
      return;
    }

    // анти-даблклик
    const btn = form.querySelector('button[type="submit"]');
    btn && (btn.disabled = true);

    // оверлей (у тебя есть CSS для _sending)
    form.classList.add('_sending');

    try {
      const data = new FormData(form);

      const resp = await fetch(form.action, {
        method: 'POST',
        body: data,
        headers: {
          Accept: 'application/json', // важно для JSON-ответа
        },
      });

      const result = await resp.json().catch(() => null);

      if (resp.ok) {
        if (resp.ok) {
          window.location.href = "success.html";
          return;
        }
      } else {
        // Частые кейсы: лимит/спам/валидация на стороне Formspree
        const errText =
          result?.errors?.[0]?.message ||
          (resp.status === 429 ? 'Príliš veľa odoslaní. Skúste to prosím neskôr.' : null) ||
          'Chyba pri odosielaní. Skúste to prosím neskôr.';
        showMessage(errText, true);
      }
    } catch (err) {
      console.error(err);
      showMessage('Chyba pripojenia. Skontrolujte internet a skúste znova.', true);
    } finally {
      form.classList.remove('_sending');
      btn && (btn.disabled = false);
    }
  });
});

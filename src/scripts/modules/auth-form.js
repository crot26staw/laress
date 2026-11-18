// Формы входа, регистрации и восстановления пароля (login.html, register.html, forgot-password.html, reset-password.html).
// Проверка на клиенте: пустые обязательные поля, формат e-mail, совпадение паролей ([data-password-repeat]),
// согласие на обработку данных. Ошибки сервера (номер уже зарегистрирован, пользователь не найден, неверный пароль)
// выводит тема WordPress через параметр error партиалов text-field / password-field — они снимаются при вводе.
// До WordPress отправка имитируется: [data-auth-success="<id окна>"] — открыть окно, [data-auth-redirect="<url>"] — перейти.
// В теме обработчик отправки оставляем только для проверки, а саму форму отправляем на сервер.
//
// Окно-уведомление на любой странице открывается по ссылке ?notice=<id> (например, «Аккаунт успешно создан»
// на главной после регистрации), параметр затем убирается из адреса.

const MESSAGES = {
  required: 'Заполните поле',
  email: 'Введите корректный e-mail',
  mismatch: 'Пароли не совпадают',
};

function showError(input, message) {
  const field = input.closest('.form-field');
  field.classList.add('form-field--invalid');
  input.setAttribute('aria-invalid', 'true');
  if (!message) return;

  let error = field.querySelector('.form-field__error');
  if (!error) {
    error = document.createElement('p');
    error.className = 'form-field__error';
    error.id = `${input.id}-error`;
    field.append(error);
  }
  error.textContent = message;
  input.setAttribute('aria-describedby', error.id);
}

function clearError(input) {
  const field = input.closest('.form-field');
  field.classList.remove('form-field--invalid');
  field.querySelector('.form-field__error')?.remove();
  input.removeAttribute('aria-invalid');
  input.removeAttribute('aria-describedby');
}

function setConsentError(checkbox, invalid) {
  checkbox.closest('.checkbox').classList.toggle('checkbox--invalid', invalid);
  checkbox.toggleAttribute('aria-invalid', invalid);
}

function validate(form) {
  const inputs = [...form.querySelectorAll('.form-field .field__input')];
  inputs.forEach(clearError);

  const invalid = [];

  inputs.forEach((input) => {
    if (!input.value.trim()) {
      showError(input, MESSAGES.required);
      invalid.push(input);
    } else if (input.type === 'email' && !input.validity.valid) {
      showError(input, MESSAGES.email);
      invalid.push(input);
    }
  });

  // Пароли не совпадают (966:49706): рамка у обоих полей, подпись — под повтором
  const repeat = form.querySelector('[data-password-repeat]');
  const password = repeat && form.querySelector(`#${repeat.dataset.passwordRepeat}`);
  if (password?.value && repeat.value && password.value !== repeat.value) {
    showError(password);
    showError(repeat, MESSAGES.mismatch);
    invalid.push(password, repeat);
  }

  const consent = form.querySelector('[data-consent]');
  if (consent) {
    setConsentError(consent, !consent.checked);
    if (!consent.checked) invalid.push(consent);
  }

  return invalid;
}

function openNoticeFromUrl() {
  const url = new URL(window.location.href);
  const id = url.searchParams.get('notice');
  if (!id) return;

  const dialog = document.getElementById(id);
  if (dialog?.matches('dialog[data-notice]')) dialog.showModal();

  url.searchParams.delete('notice');
  window.history.replaceState(null, '', url);
}

export function initAuthForms() {
  openNoticeFromUrl();

  document.querySelectorAll('[data-auth-form]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const invalid = validate(form);
      if (invalid.length) {
        invalid[0].focus();
        return;
      }

      // Имитация успешной отправки
      const { authSuccess, authRedirect } = form.dataset;
      if (authRedirect) window.location.assign(authRedirect);
      else if (authSuccess) {
        form.reset();
        document.getElementById(authSuccess)?.showModal();
      }
    });

    // Ошибка снимается, как только поле исправляют
    form.addEventListener('input', ({ target }) => {
      if (target.matches('.form-field .field__input')) {
        clearError(target);
        const pair = target.matches('[data-password-repeat]')
          ? form.querySelector(`#${target.dataset.passwordRepeat}`)
          : form.querySelector(`[data-password-repeat="${target.id}"]`);
        if (pair) clearError(pair);
      }
    });

    form.addEventListener('change', ({ target }) => {
      if (target.matches('[data-consent]') && target.checked) setConsentError(target, false);
    });
  });
}

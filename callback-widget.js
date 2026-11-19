(function () {
  'use strict';

  var FORM_ENDPOINT = 'https://api.web3forms.com/submit';
  var FORM_ACCESS_KEY = '71a531dc-7019-45c3-81f1-18b081eaa3f4';
  var AUTO_OPEN_DELAY = 18000;
  var AUTO_OPEN_DEPTH = 0.32;
  var storageKeys = {
    autoShown: 'uai_callback_auto_shown',
    dismissed: 'uai_callback_dismissed',
    requested: 'uai_callback_requested'
  };

  function readSession(key) {
    try {
      return window.sessionStorage.getItem(key) === 'true';
    } catch (error) {
      return false;
    }
  }

  function writeSession(key) {
    try {
      window.sessionStorage.setItem(key, 'true');
    } catch (error) {
      // The widget still works when session storage is unavailable.
    }
  }

  function track(eventName, parameters) {
    if (typeof window.gtag !== 'function') return;

    window.gtag('event', eventName, Object.assign({
      cta_location: 'floating_callback',
      lead_type: 'callback_request'
    }, parameters || {}));
  }

  function formatPhone(value) {
    var digits = String(value || '').replace(/\D/g, '').slice(0, 13);
    var country = '';

    if (digits.indexOf('55') === 0 && digits.length > 11) {
      country = '+55 ';
      digits = digits.slice(2);
    }

    if (digits.length <= 2) return country + (digits ? '(' + digits : '');

    var areaCode = digits.slice(0, 2);
    var number = digits.slice(2);
    var prefixLength = number.length > 8 ? 5 : 4;
    var prefix = number.slice(0, prefixLength);
    var suffix = number.slice(prefixLength, prefixLength + 4);

    return country + '(' + areaCode + ') ' + prefix + (suffix ? '-' + suffix : '');
  }

  function phoneIsValid(value) {
    var digits = String(value || '').replace(/\D/g, '');
    if (digits.indexOf('55') === 0 && digits.length > 11) digits = digits.slice(2);
    return digits.length === 10 || digits.length === 11;
  }

  function createWidget() {
    var wrapper = document.createElement('aside');
    wrapper.className = 'callback-widget';
    wrapper.setAttribute('data-callback-widget', '');
    wrapper.setAttribute('aria-label', 'Solicitar uma ligação da UAI Tracker');
    wrapper.innerHTML = [
      '<button class="callback-toggle" type="button" aria-expanded="false" aria-controls="callback-panel">',
      '  <span class="callback-toggle-icon" aria-hidden="true">',
      '    <svg class="callback-icon" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.68 2.8a2 2 0 0 1-.45 2.11L8.07 9.9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.32 1.84.55 2.8.68A2 2 0 0 1 22 16.92z"></path></svg>',
      '  </span>',
      '  <span class="callback-toggle-copy"><strong>Ligamos para você</strong><small>Sem custo de chamada</small></span>',
      '</button>',
      '<section class="callback-panel" id="callback-panel" role="dialog" aria-modal="false" aria-labelledby="callback-title" aria-describedby="callback-description" hidden>',
      '  <button class="callback-close" type="button" aria-label="Fechar pedido de ligação">',
      '    <svg class="callback-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>',
      '  </button>',
      '  <span class="callback-kicker">Ligação por nossa conta</span>',
      '  <h2 id="callback-title">Prefere falar por telefone?</h2>',
      '  <p id="callback-description">Deixe seus dados e nossa equipe entra em contato para entender o que você precisa.</p>',
      '  <form class="callback-form" novalidate>',
      '    <div class="callback-field">',
      '      <label for="callback-name">Seu nome</label>',
      '      <input id="callback-name" name="name" type="text" autocomplete="name" maxlength="80" placeholder="Como podemos chamar você?" required>',
      '      <span class="callback-error" data-error-for="name"></span>',
      '    </div>',
      '    <div class="callback-field">',
      '      <label for="callback-phone">Seu telefone</label>',
      '      <input id="callback-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="20" placeholder="(34) 99999-9999" required>',
      '      <span class="callback-error" data-error-for="phone"></span>',
      '    </div>',
      '    <label class="callback-consent">',
      '      <input name="consent" type="checkbox" required>',
      '      <span>Concordo com o uso do meu nome e telefone exclusivamente para este contato.</span>',
      '    </label>',
      '    <span class="callback-error" data-error-for="consent"></span>',
      '    <div class="callback-honey" aria-hidden="true">',
      '      <label for="callback-company">Não preencha este campo</label>',
      '      <input id="callback-company" name="botcheck" type="text" tabindex="-1" autocomplete="off">',
      '    </div>',
      '    <button class="callback-submit" type="submit">',
      '      <svg class="callback-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.68 2.8a2 2 0 0 1-.45 2.11L8.07 9.9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.32 1.84.55 2.8.68A2 2 0 0 1 22 16.92z"></path></svg>',
      '      Pedir para ligarem',
      '    </button>',
      '    <p class="callback-status" role="status" aria-live="polite"></p>',
      '    <p class="callback-note">Seus dados serão usados somente para que a equipe comercial entre em contato.</p>',
      '  </form>',
      '</section>'
    ].join('');

    document.body.appendChild(wrapper);
    return wrapper;
  }

  function initialize() {
    if (document.querySelector('[data-callback-widget]')) return;

    var widget = createWidget();
    var toggle = widget.querySelector('.callback-toggle');
    var panel = widget.querySelector('.callback-panel');
    var closeButton = widget.querySelector('.callback-close');
    var form = widget.querySelector('.callback-form');
    var nameInput = widget.querySelector('[name="name"]');
    var phoneInput = widget.querySelector('[name="phone"]');
    var consentInput = widget.querySelector('[name="consent"]');
    var honeyInput = widget.querySelector('[name="botcheck"]');
    var submitButton = widget.querySelector('.callback-submit');
    var status = widget.querySelector('.callback-status');
    var closeTimer = 0;
    var formStarted = false;
    var autoShown = readSession(storageKeys.autoShown);
    var dismissed = readSession(storageKeys.dismissed);
    var requested = readSession(storageKeys.requested);

    function setError(field, message) {
      var error = widget.querySelector('[data-error-for="' + field + '"]');
      var input = form.elements[field];
      if (error) error.textContent = message || '';
      if (input) input.setAttribute('aria-invalid', String(Boolean(message)));
    }

    function clearErrors() {
      setError('name', '');
      setError('phone', '');
      setError('consent', '');
      status.textContent = '';
    }

    function openWidget(options) {
      var settings = options || {};
      window.clearTimeout(closeTimer);
      panel.hidden = false;
      window.requestAnimationFrame(function () {
        widget.classList.add('is-open');
      });
      toggle.setAttribute('aria-expanded', 'true');
      panel.setAttribute('aria-hidden', 'false');
      track('callback_widget_open', {
        open_source: settings.source || 'manual'
      });
      if (settings.focus) nameInput.focus();
    }

    function closeWidget(returnFocus) {
      widget.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      panel.setAttribute('aria-hidden', 'true');
      closeTimer = window.setTimeout(function () {
        panel.hidden = true;
      }, 260);
      if (returnFocus) toggle.focus();
    }

    function autoOpen(source) {
      if (autoShown || dismissed || requested || widget.classList.contains('is-open')) return;
      autoShown = true;
      writeSession(storageKeys.autoShown);
      openWidget({ source: source, focus: false });
    }

    toggle.addEventListener('click', function () {
      openWidget({ source: 'floating_button', focus: true });
    });

    closeButton.addEventListener('click', function () {
      dismissed = true;
      writeSession(storageKeys.dismissed);
      closeWidget(true);
      track('callback_widget_close');
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && widget.classList.contains('is-open')) {
        dismissed = true;
        writeSession(storageKeys.dismissed);
        closeWidget(true);
      }
    });

    form.addEventListener('focusin', function () {
      if (formStarted) return;
      formStarted = true;
      track('callback_form_start');
    });

    phoneInput.addEventListener('input', function () {
      var cursorAtEnd = phoneInput.selectionStart === phoneInput.value.length;
      phoneInput.value = formatPhone(phoneInput.value);
      if (cursorAtEnd) phoneInput.setSelectionRange(phoneInput.value.length, phoneInput.value.length);
      setError('phone', '');
    });

    nameInput.addEventListener('input', function () { setError('name', ''); });
    consentInput.addEventListener('change', function () { setError('consent', ''); });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      clearErrors();

      var name = nameInput.value.replace(/\s+/g, ' ').trim();
      var phone = phoneInput.value.trim();
      var valid = true;

      if (name.length < 2) {
        setError('name', 'Informe seu nome.');
        valid = false;
      }
      if (!phoneIsValid(phone)) {
        setError('phone', 'Informe um telefone com DDD.');
        valid = false;
      }
      if (!consentInput.checked) {
        setError('consent', 'Confirme o envio dos dados para continuar.');
        valid = false;
      }

      if (!valid) {
        var firstInvalid = form.querySelector('[aria-invalid="true"]');
        if (firstInvalid && typeof firstInvalid.focus === 'function') firstInvalid.focus();
        track('callback_form_error');
        return;
      }

      if (honeyInput.value) return;

      submitButton.disabled = true;
      submitButton.setAttribute('aria-busy', 'true');
      submitButton.textContent = 'Enviando pedido...';
      status.textContent = '';

      var payload = new FormData();
      payload.append('access_key', FORM_ACCESS_KEY);
      payload.append('subject', 'Novo pedido de ligação - UAI Tracker');
      payload.append('from_name', 'UAI Tracker - Site');
      payload.append('Nome', name);
      payload.append('Telefone', phone);
      payload.append('Solicitacao', 'Pedido de ligação pelo site');
      payload.append('Pagina', window.location.href);
      payload.append('botcheck', honeyInput.value);

      fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: {
          'Accept': 'application/json'
        },
        body: payload
      })
        .then(function (response) {
          if (!response.ok) throw new Error('Form submission failed');
          return response.json();
        })
        .then(function (result) {
          if (!result || result.success !== true) throw new Error('Form submission rejected');
          requested = true;
          writeSession(storageKeys.requested);
          form.classList.add('is-submitted');
          form.reset();
          status.textContent = 'Pedido recebido. Nossa equipe entrará em contato pelo telefone informado.';
          submitButton.textContent = 'Pedido enviado';
          submitButton.removeAttribute('aria-busy');
          track('callback_request', {
            contact_method: 'email_form'
          });
          track('generate_lead', {
            lead_source: 'callback_email',
            contact_method: 'callback'
          });
        })
        .catch(function () {
          submitButton.disabled = false;
          submitButton.removeAttribute('aria-busy');
          submitButton.textContent = 'Tentar novamente';
          status.textContent = 'Não foi possível enviar agora. Verifique sua conexão e tente novamente.';
          track('callback_form_error', {
            error_type: 'submission'
          });
        });
    });

    var autoTimer = window.setTimeout(function () {
      autoOpen('engaged_time');
    }, AUTO_OPEN_DELAY);

    window.addEventListener('scroll', function () {
      if (autoShown || dismissed || requested) return;
      var scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      if (window.scrollY / scrollable >= AUTO_OPEN_DEPTH) {
        window.clearTimeout(autoTimer);
        autoOpen('scroll_depth');
      }
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();

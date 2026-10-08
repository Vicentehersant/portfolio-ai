/**
 * Portfolio AI — drop-in chat widget (vanilla JS, no dependencies).
 * Configure with data-* attributes on the <script> tag:
 *   data-endpoint   API URL (default "/api/chat")
 *   data-title      Panel title (default "Ask my AI")
 *   data-subtitle   Small line under the title
 *   data-launcher   Launcher button label (default "Ask my AI")
 *   data-greeting   First AI message
 *   data-chips      Starter questions separated by "|"
 *   data-theme      "light" (default) or "auto" (follows prefers-color-scheme)
 */
(function () {
  'use strict';
  var script = document.currentScript || document.querySelector('script[src*="portfolio-ai"]');
  var ds = (script && script.dataset) || {};
  var cfg = {
    endpoint: ds.endpoint || '/api/chat',
    title: ds.title || 'Ask my AI',
    subtitle: ds.subtitle || 'Answers from my portfolio, CV and projects',
    launcher: ds.launcher || 'Ask my AI',
    greeting: ds.greeting || 'Hi! Ask me anything about my work, skills or availability.',
    chips: (ds.chips || 'What do you specialise in?|Show me your best project|Are you available?')
      .split('|').map(function (s) { return s.trim(); }).filter(Boolean),
    theme: ds.theme || 'light'
  };

  var history = [];
  var sessionId = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(36);
  var busy = false;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  // Escape first, then linkify plain URLs (absolute or bare domain/path).
  function linkify(raw) {
    var esc = raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return esc.replace(/(https?:\/\/[^\s<]+|\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}\/[^\s<]*)/gi, function (url) {
      var m = url.match(/[.,;:!?)]+$/);
      var trail = m ? m[0] : '';
      var core = trail ? url.slice(0, -trail.length) : url;
      var href = /^https?:/i.test(core) ? core : 'https://' + core;
      return '<a href="' + href + '" target="_blank" rel="noopener noreferrer">' + core + '</a>' + trail;
    });
  }

  function build() {
    var root = el('div', 'pai-root');
    root.setAttribute('data-theme', cfg.theme);

    var launcher = el('button', 'pai-launcher', cfg.launcher);
    launcher.type = 'button';
    launcher.setAttribute('aria-expanded', 'false');
    launcher.setAttribute('aria-controls', 'pai-panel');

    var panel = el('section', 'pai-panel');
    panel.id = 'pai-panel';
    panel.hidden = true;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', cfg.title);

    var header = el('div', 'pai-header');
    var hText = el('div');
    hText.appendChild(el('p', 'pai-title', cfg.title));
    hText.appendChild(el('p', 'pai-subtitle', cfg.subtitle));
    var close = el('button', 'pai-close', '×');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close chat');
    header.appendChild(hText);
    header.appendChild(close);

    var thread = el('div', 'pai-thread');
    thread.setAttribute('role', 'log');
    thread.setAttribute('aria-live', 'polite');

    var form = el('form', 'pai-form');
    var label = el('label', 'pai-sr', 'Your question');
    label.htmlFor = 'pai-input';
    var input = el('textarea', 'pai-input');
    input.id = 'pai-input';
    input.rows = 1;
    input.maxLength = 500;
    input.placeholder = 'Ask a question…';
    var send = el('button', 'pai-send', 'Send');
    send.type = 'submit';
    form.appendChild(label);
    form.appendChild(input);
    form.appendChild(send);

    var foot = el('p', 'pai-footnote', 'AI answers can be imperfect. Conversations may be logged to improve answers.');

    panel.appendChild(header);
    panel.appendChild(thread);
    panel.appendChild(form);
    panel.appendChild(foot);
    root.appendChild(launcher);
    root.appendChild(panel);
    document.body.appendChild(root);

    function addMsg(role, text, isError) {
      var m = el('div', 'pai-msg pai-msg--' + role + (isError ? ' pai-msg--error' : ''));
      if (role === 'ai' && !isError) m.innerHTML = linkify(text); else m.textContent = text;
      thread.appendChild(m);
      thread.scrollTop = thread.scrollHeight;
      return m;
    }

    function showChips(list) {
      var old = thread.querySelector('.pai-chips');
      if (old) old.remove();
      if (!list || !list.length) return;
      var wrap = el('div', 'pai-chips');
      list.forEach(function (q) {
        var c = el('button', 'pai-chip', q);
        c.type = 'button';
        c.addEventListener('click', function () { ask(q); });
        wrap.appendChild(c);
      });
      thread.appendChild(wrap);
      thread.scrollTop = thread.scrollHeight;
    }

    function ask(q) {
      q = (q || '').trim();
      if (!q || busy) return;
      busy = true;
      send.disabled = true;
      showChips(null);
      addMsg('user', q);
      input.value = '';
      input.style.height = '';
      var pending = addMsg('ai', 'Thinking…');
      pending.classList.add('pai-thinking');

      fetch(cfg.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q, history: history.slice(-6), sessionId: sessionId })
      })
        .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || 'Request failed'); return d; }); })
        .then(function (d) {
          pending.remove();
          history.push({ role: 'user', content: q }, { role: 'assistant', content: d.reply });
          addMsg('ai', d.reply);
          if (d.contact && script && script.dataset.contactUrl) {
            var a = el('a', 'pai-contact', 'Other ways to reach me');
            a.href = script.dataset.contactUrl;
            thread.appendChild(a);
          }
          showChips(d.suggestions);
        })
        .catch(function (err) {
          pending.remove();
          addMsg('ai', err.message || 'Something went wrong. Please try again.', true);
        })
        .then(function () { busy = false; send.disabled = false; input.focus(); });
    }

    function open() {
      panel.hidden = false;
      launcher.setAttribute('aria-expanded', 'true');
      if (!thread.childElementCount) { addMsg('ai', cfg.greeting); showChips(cfg.chips); }
      input.focus();
    }
    function shut() {
      panel.hidden = true;
      launcher.setAttribute('aria-expanded', 'false');
      launcher.focus();
    }

    launcher.addEventListener('click', open);
    close.addEventListener('click', shut);
    panel.addEventListener('keydown', function (e) { if (e.key === 'Escape') shut(); });
    form.addEventListener('submit', function (e) { e.preventDefault(); ask(input.value); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(input.value); }
    });
    input.addEventListener('input', function () {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    });

    // Any element with [data-pai-open] opens the chat (e.g. a hero button).
    document.querySelectorAll('[data-pai-open]').forEach(function (n) { n.addEventListener('click', open); });
    window.PortfolioAI = { open: open, close: shut, ask: function (q) { open(); ask(q); } };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();

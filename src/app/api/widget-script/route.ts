import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const script = String.raw`
(function () {
  const currentScript = document.currentScript instanceof HTMLScriptElement ? document.currentScript : null;
  const scriptUrl = new URL(currentScript && currentScript.src ? currentScript.src : window.location.href);
  const dataset = currentScript ? currentScript.dataset : {};
  const apiOrigin = scriptUrl.origin;
  const businessSlug = dataset.businessSlug || scriptUrl.searchParams.get('businessSlug');
  const widgetSlug = dataset.widgetSlug || scriptUrl.searchParams.get('widgetSlug');
  const position = (dataset.position || 'bottom-right').toLowerCase();
  const theme = (dataset.theme || 'light').toLowerCase();
  const primaryColor = dataset.color || '#0f766e';
  const secondaryColor = dataset.secondaryColor || '#14b8a6';
  const greetingOverride = dataset.greeting || '';

  if (!businessSlug) {
    console.warn('Clara widget requires a businessSlug parameter.');
    return;
  }

  const safePosition = ['bottom-right', 'bottom-left', 'top-right', 'top-left'].includes(position) ? position : 'bottom-right';
  const safeTheme = theme === 'dark' ? 'dark' : 'light';

  const styles = document.createElement('style');
  styles.textContent = [
    '.clara-widget-root{position:fixed;z-index:2147483647;font-family:Inter,system-ui,sans-serif;pointer-events:none;}',
    '.clara-widget-root *{box-sizing:border-box;}',
    '.clara-widget-launcher{pointer-events:auto;width:64px;height:64px;border:none;border-radius:9999px;display:grid;place-items:center;color:#fff;cursor:pointer;transition:transform .18s ease,box-shadow .18s ease;background:linear-gradient(135deg,var(--clara-primary),var(--clara-secondary));box-shadow:0 18px 40px rgba(15,118,110,.32);}',
    '.clara-widget-launcher:hover{transform:translateY(-1px);box-shadow:0 22px 48px rgba(15,118,110,.4);}',
    '.clara-widget-launcher svg{width:24px;height:24px;display:block;}',
    '.clara-widget-panel{pointer-events:auto;position:absolute;width:min(360px,calc(100vw - 32px));border-radius:28px;overflow:hidden;border:1px solid var(--clara-border);box-shadow:0 30px 80px rgba(15,23,42,.24);backdrop-filter:blur(16px);}',
    '.clara-widget-panel[hidden]{display:none;}',
    '.clara-widget-panel-header{padding:18px 20px;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;background:linear-gradient(135deg,var(--clara-primary),var(--clara-secondary));color:#fff;}',
    '.clara-widget-panel-title{margin:0;font-size:16px;font-weight:700;line-height:1.2;}',
    '.clara-widget-panel-subtitle{margin:6px 0 0;font-size:12px;opacity:.88;line-height:1.45;}',
    '.clara-widget-close{border:none;background:rgba(255,255,255,.14);color:#fff;width:30px;height:30px;border-radius:9999px;cursor:pointer;font-size:18px;line-height:1;display:grid;place-items:center;}',
    '.clara-widget-body{background:var(--clara-surface);padding:16px;display:grid;gap:12px;}',
    '.clara-widget-lede{border:1px solid var(--clara-border);background:var(--clara-lede);border-radius:22px;padding:14px 16px;}',
    '.clara-widget-lede h4{margin:0 0 6px;font-size:14px;font-weight:700;color:var(--clara-text-strong);}',
    '.clara-widget-lede p{margin:0;font-size:13px;line-height:1.55;color:var(--clara-text-muted);}',
    '.clara-widget-actions{display:grid;gap:10px;}',
    '.clara-widget-action{width:100%;border:1px solid var(--clara-border);border-radius:18px;padding:13px 14px;text-align:left;background:var(--clara-card);cursor:pointer;transition:transform .18s ease,background .18s ease,border-color .18s ease;}',
    '.clara-widget-action:hover{transform:translateY(-1px);border-color:rgba(15,118,110,.3);background:var(--clara-card-hover);}',
    '.clara-widget-action strong{display:block;font-size:14px;line-height:1.3;color:var(--clara-text-strong);margin-bottom:4px;}',
    '.clara-widget-action span{display:block;font-size:12px;line-height:1.45;color:var(--clara-text-muted);}',
    '.clara-widget-chat{border:1px solid var(--clara-border);border-radius:20px;padding:14px;background:var(--clara-card);display:none;gap:10px;}',
    '.clara-widget-chat.is-open{display:grid;}',
    '.clara-widget-input{width:100%;border:1px solid var(--clara-border);border-radius:14px;padding:11px 12px;font-size:14px;outline:none;background:var(--clara-input);color:var(--clara-text-strong);}',
    '.clara-widget-input::placeholder{color:var(--clara-placeholder);}',
    '.clara-widget-send{border:none;border-radius:14px;padding:11px 14px;background:linear-gradient(135deg,var(--clara-primary),var(--clara-secondary));color:#fff;font-weight:700;cursor:pointer;}',
    '.clara-widget-footer{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:11px;line-height:1.4;color:var(--clara-text-muted);padding-top:2px;}',
    '.clara-widget-pill{display:inline-flex;align-items:center;gap:6px;border-radius:9999px;padding:6px 10px;font-size:11px;font-weight:700;background:var(--clara-pill);color:var(--clara-text-strong);}',
    '.clara-widget-pill i{width:8px;height:8px;border-radius:9999px;background:var(--clara-secondary);display:inline-block;}',
    '.clara-widget-position-bottom-right{right:20px;bottom:20px;}',
    '.clara-widget-position-bottom-right .clara-widget-panel{right:0;bottom:86px;}',
    '.clara-widget-position-bottom-left{left:20px;bottom:20px;}',
    '.clara-widget-position-bottom-left .clara-widget-panel{left:0;bottom:86px;}',
    '.clara-widget-position-top-right{right:20px;top:20px;}',
    '.clara-widget-position-top-right .clara-widget-panel{right:0;top:86px;}',
    '.clara-widget-position-top-left{left:20px;top:20px;}',
    '.clara-widget-position-top-left .clara-widget-panel{left:0;top:86px;}',
    '.clara-widget-root[data-theme="dark"]{--clara-surface:rgba(15,23,42,.96);--clara-card:rgba(255,255,255,.03);--clara-card-hover:rgba(255,255,255,.06);--clara-border:rgba(255,255,255,.08);--clara-text-strong:#f8fafc;--clara-text-muted:rgba(226,232,240,.78);--clara-input:rgba(255,255,255,.03);--clara-placeholder:rgba(226,232,240,.45);--clara-pill:rgba(255,255,255,.06);--clara-lede:rgba(255,255,255,.04);}',
    '.clara-widget-root[data-theme="light"]{--clara-surface:#ffffff;--clara-card:#ffffff;--clara-card-hover:#f8fafc;--clara-border:rgba(15,23,42,.08);--clara-text-strong:#0f172a;--clara-text-muted:#64748b;--clara-input:#ffffff;--clara-placeholder:#94a3b8;--clara-pill:rgba(15,118,110,.08);--clara-lede:rgba(15,118,110,.04);}'
  ].join('');
  document.head.appendChild(styles);

  const root = document.createElement('div');
  root.className = 'clara-widget-root clara-widget-position-' + safePosition;
  root.setAttribute('data-theme', safeTheme);
  root.style.setProperty('--clara-primary', primaryColor);
  root.style.setProperty('--clara-secondary', secondaryColor);

  root.innerHTML = [
    '<button type="button" class="clara-widget-launcher" aria-label="Open Clara assistant">',
    '  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 12a6 6 0 1 1 12 0c0 3.3-2.3 6.1-5.4 6.9L12 21l-.6-2.1A7 7 0 0 1 6 12Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    '</button>',
    '<div class="clara-widget-panel" hidden aria-hidden="true">',
    '  <div class="clara-widget-panel-header">',
    '    <div>',
    '      <p class="clara-widget-panel-title">Clara</p>',
    '      <p class="clara-widget-panel-subtitle">Loading booking assistant...</p>',
    '    </div>',
    '    <button type="button" class="clara-widget-close" aria-label="Close widget">&times;</button>',
    '  </div>',
    '  <div class="clara-widget-body">',
    '    <div class="clara-widget-lede">',
    '      <div class="clara-widget-pill"><i></i>AI reception</div>',
    '      <h4 data-widget-title>Welcome</h4>',
    '      <p data-widget-greeting>Loading...</p>',
    '    </div>',
    '    <div class="clara-widget-actions">',
    '      <button type="button" class="clara-widget-action" data-action="book">',
    '        <strong>Book an appointment</strong>',
    '        <span>Open the scheduling portal with the selected services.</span>',
    '      </button>',
    '      <button type="button" class="clara-widget-action" data-action="chat">',
    '        <strong>Chat with the assistant</strong>',
    '        <span>Send a quick message before starting the visit flow.</span>',
    '      </button>',
    '      <button type="button" class="clara-widget-action" data-action="callback">',
    '        <strong>Request a callback</strong>',
    '        <span>Leave your details for follow-up by our team.</span>',
    '      </button>',
    '    </div>',
    '    <div class="clara-widget-chat" data-chatbox>',
    '      <input class="clara-widget-input" type="text" placeholder="Type a message..." />',
    '      <button type="button" class="clara-widget-send">Send</button>',
    '    </div>',
    '    <div class="clara-widget-footer">',
    '      <span data-widget-source>Connected to your business website</span>',
    '      <span>Powered by Clara</span>',
    '    </div>',
    '  </div>',
    '</div>',
  ].join('');
  document.body.appendChild(root);

  const launcher = root.querySelector('.clara-widget-launcher');
  const panel = root.querySelector('.clara-widget-panel');
  const closeButton = root.querySelector('.clara-widget-close');
  const subtitle = root.querySelector('.clara-widget-panel-subtitle');
  const title = root.querySelector('[data-widget-title]');
  const greeting = root.querySelector('[data-widget-greeting]');
  const sourceLabel = root.querySelector('[data-widget-source]');
  const chatBox = root.querySelector('[data-chatbox]');
  const chatInput = root.querySelector('.clara-widget-input');
  const sendButton = root.querySelector('.clara-widget-send');
  const bookButton = root.querySelector('[data-action="book"]');
  const chatButton = root.querySelector('[data-action="chat"]');
  const callbackButton = root.querySelector('[data-action="callback"]');
  const bookingUrl = apiOrigin + '/portal?businessSlug=' + encodeURIComponent(businessSlug);

  function setPanelOpen(open) {
    if (panel) panel.hidden = !open;
    if (launcher) launcher.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (panel) panel.setAttribute('aria-hidden', open ? 'false' : 'true');
  }

  function updateCopy(widget) {
    const widgetName = widget && widget.name ? widget.name : 'Clara';
    const agentName = widget && widget.agentName ? widget.agentName : widgetName;
    const resolvedGreeting = greetingOverride || (widget && widget.greetingMessage) || ('Hello from ' + agentName + '. How can we help today?');

    if (title) title.textContent = widgetName;
    if (greeting) greeting.textContent = resolvedGreeting;
    if (sourceLabel) sourceLabel.textContent = (widget && widget.businessName ? widget.businessName : businessSlug) + ' • ' + (widget && widget.agentName ? widget.agentName : 'AI assistant');
    if (subtitle) subtitle.textContent = resolvedGreeting;
    root.setAttribute('data-theme', (widget && widget.theme ? widget.theme : safeTheme) === 'dark' ? 'dark' : 'light');
    root.style.setProperty('--clara-primary', (widget && widget.primaryColor) || primaryColor);
    root.style.setProperty('--clara-secondary', (widget && widget.secondaryColor) || secondaryColor);

    const launcherBackground = 'linear-gradient(135deg, ' + ((widget && widget.primaryColor) || primaryColor) + ', ' + ((widget && widget.secondaryColor) || secondaryColor) + ')';
    if (launcher) launcher.style.background = launcherBackground;
  }

  launcher && launcher.addEventListener('click', function () {
    setPanelOpen(!(panel && !panel.hidden));
  });

  closeButton && closeButton.addEventListener('click', function () {
    setPanelOpen(false);
  });

  bookButton && bookButton.addEventListener('click', function () {
    window.open(bookingUrl, '_blank', 'noopener,noreferrer');
  });

  chatButton && chatButton.addEventListener('click', function () {
    if (chatBox) chatBox.classList.toggle('is-open');
    if (chatInput) chatInput.focus();
  });

  callbackButton && callbackButton.addEventListener('click', function () {
    window.open(bookingUrl + '#callback', '_blank', 'noopener,noreferrer');
  });

  function sendChat() {
    const value = chatInput && chatInput.value ? chatInput.value.trim() : '';
    if (!value) return;
    window.open(bookingUrl + '#chat=' + encodeURIComponent(value), '_blank', 'noopener,noreferrer');
  }

  sendButton && sendButton.addEventListener('click', sendChat);
  chatInput && chatInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      sendChat();
    }
  });

  fetch(apiOrigin + '/api/widget/config?businessSlug=' + encodeURIComponent(businessSlug) + (widgetSlug ? '&widgetSlug=' + encodeURIComponent(widgetSlug) : ''))
    .then(function (response) {
      return response.ok ? response.json() : null;
    })
    .then(function (payload) {
      const widget = payload && (payload.widget || payload.config || payload);
      updateCopy(widget);
    })
    .catch(function () {
      updateCopy(null);
    });

  updateCopy(null);
})();
`;
  return new NextResponse(script, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=60',
    },
  })
}

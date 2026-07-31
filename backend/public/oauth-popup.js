;(function () {
  function requestClose() {
    try { window.close() } catch (e) {}
    if (window.opener) {
      try { window.opener.postMessage({ type: 'social-oauth-request-close', ts: Date.now() }, '*') } catch (e) {}
    }
    setTimeout(function () {
      if (window.closed) return
      var btn = document.getElementById('oauth-close-btn')
      var hint = document.getElementById('oauth-close-hint')
      if (btn) btn.textContent = 'Return to Settings'
      if (hint) hint.textContent = 'You can close this tab manually, or click the button to ask the main window to close it.'
    }, 200)
  }

  var script = document.currentScript
  var payload = null
  try { payload = JSON.parse(script.getAttribute('data-payload')) } catch (e) {}

  if (payload) {
    try { localStorage.setItem('social-oauth-result', JSON.stringify(payload)) } catch (e) {}
    if (window.opener) { try { window.opener.postMessage(payload, '*') } catch (e) {} }
    setTimeout(requestClose, 400)
  }

  var btn = document.getElementById('oauth-close-btn')
  if (btn) btn.addEventListener('click', requestClose)
})()

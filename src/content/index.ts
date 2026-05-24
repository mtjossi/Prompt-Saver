chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'PING') {
    sendResponse({ pong: true });
    return true;
  }
  if (message.type === 'INJECT') {
    injectIntoPage(message.text);
    sendResponse({ success: true });
    return true;
  }
  if (message.type === 'GET_SELECTION') {
    sendResponse({ text: window.getSelection()?.toString() || '' });
    return true;
  }
});

function injectIntoPage(text: string): void {
  const el = document.activeElement;
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    el.value = el.value.slice(0, start) + text + el.value.slice(end);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

import { Prompt, PromptChain } from '../lib/types';

const INJECT_PROMPT = 'INJECT_PROMPT';
const SAVE_SELECTION = 'SAVE_SELECTION';
const CONTEXT_COPY = 'CONTEXT_COPY';
const CONTEXT_INJECT = 'CONTEXT_INJECT';
const RUN_CHAIN = 'RUN_CHAIN';
const REBUILD_MENUS = 'REBUILD_MENUS';

const MENU_PARENT = 'prompt-saver-parent';
const MENU_SAVE_SEL = 'ps-save-selection';
const MENU_COPY_PARENT = 'ps-copy-parent';
const MENU_INJECT_PARENT = 'ps-inject-parent';

let cachedPrompts: Prompt[] = [];

buildContextMenus();

chrome.runtime.onInstalled.addListener(() => {
  buildContextMenus();
});

chrome.runtime.onStartup.addListener(() => {
  buildContextMenus();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === INJECT_PROMPT) {
    injectPrompt(message.text)
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: String(err) }));
    return true;
  }
  if (message.type === SAVE_SELECTION) {
    saveSelectionPrompt(message.text).then(() => sendResponse({ success: true }));
    return true;
  }
  if (message.type === RUN_CHAIN) {
    runChain(message.chainId)
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: String(err) }));
    return true;
  }
  if (message.type === REBUILD_MENUS) {
    buildContextMenus();
    sendResponse({ success: true });
    return true;
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return;

  if (info.menuItemId === MENU_SAVE_SEL) {
    saveSelectionPrompt(info.selectionText || '');
    return;
  }

  if (String(info.menuItemId).startsWith(CONTEXT_COPY)) {
    const promptId = String(info.menuItemId).replace(CONTEXT_COPY + '-', '');
    const prompt = cachedPrompts.find((p) => p.id === promptId);
    if (prompt) {
      incrementAndCopy(prompt);
    }
    return;
  }

  if (String(info.menuItemId).startsWith(CONTEXT_INJECT)) {
    const promptId = String(info.menuItemId).replace(CONTEXT_INJECT + '-', '');
    const prompt = cachedPrompts.find((p) => p.id === promptId);
    if (prompt) {
      injectPromptInTab(prompt.content, tab.id).then(() => {
        chrome.storage.local.get('prompts').then((result) => {
          const prompts = (result.prompts as Prompt[]) || [];
          const updated = prompts.map((p) =>
            p.id === prompt.id ? { ...p, usageCount: p.usageCount + 1 } : p
          );
          chrome.storage.local.set({ prompts: updated });
        });
      });
    }
  }
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.prompts) {
    buildContextMenus();
  }
});

function buildContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_PARENT,
      title: 'Prompt Saver',
      contexts: ['all'],
    });

    chrome.contextMenus.create({
      id: MENU_SAVE_SEL,
      parentId: MENU_PARENT,
      title: 'Save selection as prompt',
      contexts: ['selection'],
    });

    chrome.storage.local.get('prompts').then((result) => {
      const prompts = (result.prompts as Prompt[]) || [];
      const sorted = prompts.sort((a, b) => b.usageCount - a.usageCount).slice(0, 10);
      cachedPrompts = sorted;

      if (sorted.length > 0) {
        chrome.contextMenus.create({
          id: MENU_COPY_PARENT,
          parentId: MENU_PARENT,
          title: 'Copy to clipboard',
          contexts: ['all'],
        });

        for (const p of sorted) {
          chrome.contextMenus.create({
            id: CONTEXT_COPY + '-' + p.id,
            parentId: MENU_COPY_PARENT,
            title: p.title.length > 40 ? p.title.slice(0, 37) + '...' : p.title,
            contexts: ['all'],
          });
        }

        chrome.contextMenus.create({
          id: MENU_INJECT_PARENT,
          parentId: MENU_PARENT,
          title: 'Inject into page',
          contexts: ['editable'],
        });

        for (const p of sorted) {
          chrome.contextMenus.create({
            id: CONTEXT_INJECT + '-' + p.id,
            parentId: MENU_INJECT_PARENT,
            title: p.title.length > 40 ? p.title.slice(0, 37) + '...' : p.title,
            contexts: ['editable'],
          });
        }
      }
    });
  });
}

async function saveSelectionPrompt(text: string) {
  const result = await chrome.storage.local.get('prompts');
  const prompts = (result.prompts as Prompt[]) || [];
  const newPrompt: Prompt = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 9),
    title: text.slice(0, 60),
    content: text,
    projectId: '',
    tags: ['quick-save'],
    sortOrder: prompts.length,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    usageCount: 0,
  };
  prompts.push(newPrompt);
  await chrome.storage.local.set({ prompts });
}

async function injectPrompt(text: string): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.id) throw new Error('No active tab');
  await injectPromptInTab(text, tab.id);
}

async function injectPromptInTab(text: string, tabId: number): Promise<void> {
  try {
    await chrome.tabs.sendMessage(tabId, { type: 'INJECT', text });
  } catch {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: injectIntoPage,
      args: [text],
    });
  }
}

function injectIntoPage(text: string): void {
  const el = document.activeElement;
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    el.value = el.value.slice(0, start) + text + el.value.slice(end);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

async function runChain(chainId: string) {
  const chainResult = await chrome.storage.local.get('chains');
  const chains = (chainResult.chains as PromptChain[]) || [];
  const chain = chains.find((c) => c.id === chainId);
  if (!chain) throw new Error('Chain not found');

  const promptResult = await chrome.storage.local.get('prompts');
  const prompts = (promptResult.prompts as Prompt[]) || [];
  const promptMap = new Map(prompts.map((p) => [p.id, p]));

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.id) throw new Error('No active tab');

  for (const pid of chain.promptIds) {
    const prompt = promptMap.get(pid);
    if (!prompt) continue;
    await injectPromptInTab(prompt.content, tab.id);
    await new Promise((r) => setTimeout(r, 500));
  }
}

async function incrementAndCopy(prompt: Prompt) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.id) return;
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (text: string) => navigator.clipboard.writeText(text),
    args: [prompt.content],
  });
  const result = await chrome.storage.local.get('prompts');
  const prompts = (result.prompts as Prompt[]) || [];
  const updated = prompts.map((p) =>
    p.id === prompt.id ? { ...p, usageCount: p.usageCount + 1 } : p
  );
  await chrome.storage.local.set({ prompts: updated });
}

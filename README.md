# Prompt Saver

A simple Chrome extension for saving, organizing, and injecting your most-used AI prompts.

## Features

- **Save prompts** with title, content, project, and tags
- **Filter** by project, tags, or full-text search
- **Copy** a prompt to clipboard or **inject** it directly into the active page
- **Organize** prompts with projects, tags, and drag-to-reorder sorting
- **Bulk actions:** select multiple prompts to delete or export
- **Prompt chains:** define sequences of prompts that fire in order
- **Context menu integration:** right-click selected text to save as prompt, or right-click anywhere to copy/inject your top prompts
- **Import/Export:** JSON backup or Markdown documentation

## Development

```bash
npm install
npm run dev        # start dev server with HMR
npm run build      # production build to dist/
npm run typecheck  # TypeScript type checking
```

## Loading in Chrome

1. Run `npm run build` (or `npm run dev` for development)
2. Open `chrome://extensions`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select the `dist/` folder

## Tech Stack

- React 18 + TypeScript
- Vite + @crxjs/vite-plugin
- Chrome Extension Manifest V3

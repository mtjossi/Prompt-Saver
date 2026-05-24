import { useRef } from 'react';
import { Prompt, Project, PromptChain } from '../../lib/types';
import { getAppData } from '../../lib/storage';

interface SettingsModalProps {
  onImport: (prompts: Prompt[], projects: Project[], chains?: PromptChain[]) => Promise<void>;
  prompts: Prompt[];
  projects: Project[];
  chains: PromptChain[];
  onClose: () => void;
}

export default function SettingsModal({ onImport, prompts, projects, chains, onClose }: SettingsModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleExportJson() {
    const data = await getAppData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `prompt-saver-backup-${dateStamp()}.json`);
  }

  function handleExportMarkdown() {
    let md = '# Prompt Saver - Full Export\n\n';
    md += `Exported: ${new Date().toLocaleString()}\n`;
    md += `Total: ${prompts.length} prompts, ${projects.length} projects, ${chains.length} chains\n\n`;

    if (chains.length > 0) {
      md += '## Chains\n\n';
      for (const c of chains) {
        const chainPrompts = c.promptIds
          .map((pid) => prompts.find((p) => p.id === pid))
          .filter(Boolean) as Prompt[];
        md += `- **${c.name}**: ${chainPrompts.map((p) => p.title).join(' → ')}\n`;
      }
      md += '\n---\n\n';
    }

    const projectMap = new Map(projects.map((p) => [p.id, p]));
    const byProject = new Map<string, Prompt[]>();
    for (const p of prompts) {
      const key = p.projectId || '__none__';
      if (!byProject.has(key)) byProject.set(key, []);
      byProject.get(key)!.push(p);
    }

    for (const [projectId, projPrompts] of byProject) {
      const project = projectMap.get(projectId);
      md += project ? `## ${project.name}\n\n` : '## Uncategorized\n\n';
      for (const p of projPrompts) {
        md += `### ${p.title}\n\n`;
        if (p.tags.length) md += `**Tags:** ${p.tags.map((t) => `#${t}`).join(' ')}  \n`;
        md += `**Used:** ${p.usageCount} times\n\n`;
        md += '```\n' + p.content + '\n```\n\n';
        md += '---\n\n';
      }
    }

    const blob = new Blob([md], { type: 'text/markdown' });
    downloadBlob(blob, `prompt-saver-${dateStamp()}.md`);
  }

  async function handleImport() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (data.prompts && data.projects) {
        await onImport(data.prompts, data.projects, data.chains);
      }
    } catch {
      alert('Invalid backup file.');
    }
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function dateStamp() {
    return new Date().toISOString().slice(0, 10);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Settings</h2>
          <button className="icon-btn" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="settings-section">
          <h3>Import / Export</h3>
          <p className="settings-desc">
            Export your prompts, projects, and chains as JSON or Markdown.
          </p>
          <div className="settings-actions" style={{ flexWrap: 'wrap' }}>
            <button className="btn secondary small" onClick={handleExportJson}>
              Export JSON
            </button>
            <button className="btn secondary small" onClick={handleExportMarkdown}>
              Export Markdown
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImport}
            />
            <button className="btn secondary small" onClick={() => fileRef.current?.click()}>
              Import JSON
            </button>
          </div>
        </div>
        <div className="settings-section">
          <h3>Stats</h3>
          <p className="settings-desc">
            {prompts.length} prompts across {projects.length} projects. {chains.length} chains.
          </p>
        </div>
      </div>
    </div>
  );
}

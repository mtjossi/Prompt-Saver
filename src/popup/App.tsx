import { useState, useMemo, useRef, DragEvent } from 'react';
import { usePrompts } from './hooks/usePrompts';
import { useProjects } from './hooks/useProjects';
import { useChains } from './hooks/useChains';
import SearchBar from './components/SearchBar';
import PromptCard from './components/PromptCard';
import PromptForm from './components/PromptForm';
import ProjectManager from './components/ProjectManager';
import ChainManager from './components/ChainManager';
import SettingsModal from './components/SettingsModal';
import { Prompt } from '../lib/types';

export default function App() {
  const { prompts, loading, addPrompt, updatePrompt, deletePrompt, incrementUsage, reorderPrompts, importPrompts } = usePrompts();
  const { projects, addProject, deleteProject, importProjects } = useProjects();
  const { chains, addChain, deleteChain, importChains } = useChains();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showProjectMgr, setShowProjectMgr] = useState(false);
  const [showChainMgr, setShowChainMgr] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const projectMap = useMemo(
    () => Object.fromEntries(projects.map((p) => [p.id, p])),
    [projects]
  );

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    prompts.forEach((p) => p.tags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [prompts]);

  const filteredPrompts = useMemo(() => {
    let result = prompts;
    if (selectedProjectId) {
      result = result.filter((p) => p.projectId === selectedProjectId);
    }
    if (selectedTags.length > 0) {
      result = result.filter((p) => selectedTags.every((t) => p.tags.includes(t)));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q)
      );
    }
    return result;
  }, [prompts, selectedProjectId, selectedTags, searchQuery]);

  async function handleCopy(prompt: Prompt) {
    await navigator.clipboard.writeText(prompt.content);
    await incrementUsage(prompt.id);
  }

  async function handleInject(prompt: Prompt) {
    await incrementUsage(prompt.id);
    chrome.runtime.sendMessage({ type: 'INJECT_PROMPT', text: prompt.content });
    window.close();
  }

  async function handleDelete(promptId: string) {
    await deletePrompt(promptId);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(promptId);
      return next;
    });
  }

  function handleEdit(prompt: Prompt) {
    setEditingPrompt(prompt);
    setShowForm(true);
  }

  function handleFormClose() {
    setShowForm(false);
    setEditingPrompt(null);
  }

  async function handleFormSubmit(data: { title: string; content: string; projectId: string; tags: string[] }) {
    if (editingPrompt) {
      await updatePrompt(editingPrompt.id, data);
    } else {
      await addPrompt(data);
    }
    handleFormClose();
  }

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function toggleSelect(promptId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(promptId)) next.delete(promptId);
      else next.add(promptId);
      return next;
    });
  }

  async function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    const updated = prompts.filter((p) => !ids.includes(p.id));
    await reorderPrompts(updated.map((p, i) => ({ ...p, sortOrder: i })));
    setSelectedIds(new Set());
    setBulkMode(false);
  }

  function handleBulkExportJson() {
    const data = {
      prompts: prompts.filter((p) => selectedIds.has(p.id)),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-saver-selection-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleBulkExportMd() {
    const selected = prompts.filter((p) => selectedIds.has(p.id));
    let md = '# Prompt Saver - Export\n\n';
    md += `Exported: ${new Date().toLocaleString()}\n\n`;
    for (const p of selected) {
      const project = projectMap[p.projectId];
      md += `## ${p.title}\n\n`;
      if (project) md += `**Project:** ${project.name}  \n`;
      if (p.tags.length) md += `**Tags:** ${p.tags.map((t) => `#${t}`).join(' ')}  \n`;
      md += `**Used:** ${p.usageCount} times\n\n`;
      md += '```\n' + p.content + '\n```\n\n';
      md += '---\n\n';
    }
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-saver-selection-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setSelectedIds(new Set());
    setBulkMode(false);
  }

  function handleDragStart(index: number) {
    dragItem.current = index;
  }

  function handleDragEnter(index: number) {
    dragOverItem.current = index;
  }

  function handleDragEnd() {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const from = dragItem.current;
    const to = dragOverItem.current;
    if (from === to) return;
    const copy = [...filteredPrompts];
    const [moved] = copy.splice(from, 1);
    copy.splice(to, 0, moved);
    reorderPrompts(copy.map((p, i) => ({ ...p, sortOrder: i })));
    dragItem.current = null;
    dragOverItem.current = null;
  }

  async function handleRunChain(chainId: string) {
    chrome.runtime.sendMessage({ type: 'RUN_CHAIN', chainId });
    window.close();
  }

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="app">
      <header className="app-header">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        <button
          className={`icon-btn ${bulkMode ? 'active-icon' : ''}`}
          onClick={() => { setBulkMode(!bulkMode); setSelectedIds(new Set()); }}
          title="Toggle bulk mode"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 11V6a3 3 0 1 1 6 0v5M9 11h6M9 11l-2 7h10l-2-7" />
          </svg>
        </button>
        <button className="icon-btn" onClick={() => setShowChainMgr(true)} title="Prompt Chains">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </button>
        <button className="icon-btn" onClick={() => setShowSettings(true)} title="Settings">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        </button>
      </header>

      {bulkMode && (
        <div className="bulk-bar">
          <span className="bulk-count">{selectedIds.size} selected</span>
          <button className="btn secondary small" onClick={handleBulkDelete} disabled={selectedIds.size === 0}>
            Delete
          </button>
          <button className="btn secondary small" onClick={handleBulkExportJson} disabled={selectedIds.size === 0}>
            Export JSON
          </button>
          <button className="btn secondary small" onClick={handleBulkExportMd} disabled={selectedIds.size === 0}>
            Export Markdown
          </button>
        </div>
      )}

      <div className="projects-bar">
        <div className="chips">
          <button
            className={`chip ${selectedProjectId === null ? 'active' : ''}`}
            onClick={() => setSelectedProjectId(null)}
          >
            All
          </button>
          {projects.map((proj) => (
            <button
              key={proj.id}
              className={`chip ${selectedProjectId === proj.id ? 'active' : ''}`}
              onClick={() => setSelectedProjectId(proj.id === selectedProjectId ? null : proj.id)}
              style={{ borderColor: proj.color }}
            >
              <span className="project-dot" style={{ backgroundColor: proj.color }} />
              {proj.name}
            </button>
          ))}
          <button className="chip add-chip" onClick={() => setShowProjectMgr(true)}>
            + Manage
          </button>
        </div>
      </div>

      {allTags.length > 0 && (
        <div className="tags-bar">
          <div className="chips">
            {allTags.map((tag) => (
              <button
                key={tag}
                className={`chip tag-chip ${selectedTags.includes(tag) ? 'active' : ''}`}
                onClick={() => toggleTag(tag)}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="prompts-list">
        {filteredPrompts.length === 0 && (
          <div className="empty-state">
            {prompts.length === 0
              ? 'No prompts yet. Click "+ New Prompt" to get started.'
              : 'No prompts match your filters.'}
          </div>
        )}
        {filteredPrompts.map((prompt, index) => (
          <div
            key={prompt.id}
            draggable={!bulkMode}
            onDragStart={() => handleDragStart(index)}
            onDragEnter={() => handleDragEnter(index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e: DragEvent) => e.preventDefault()}
          >
            <PromptCard
              prompt={prompt}
              project={projectMap[prompt.projectId] || null}
              bulkMode={bulkMode}
              isSelected={selectedIds.has(prompt.id)}
              onToggleSelect={() => toggleSelect(prompt.id)}
              onCopy={() => handleCopy(prompt)}
              onInject={() => handleInject(prompt)}
              onEdit={() => handleEdit(prompt)}
              onDelete={() => handleDelete(prompt.id)}
            />
          </div>
        ))}
      </div>

      <footer className="app-footer">
        <button className="btn primary full-width" onClick={() => setShowForm(true)}>
          + New Prompt
        </button>
      </footer>

      {showForm && (
        <PromptForm
          prompt={editingPrompt}
          projects={projects}
          allTags={allTags}
          onSubmit={handleFormSubmit}
          onClose={handleFormClose}
        />
      )}

      {showProjectMgr && (
        <ProjectManager
          projects={projects}
          onAdd={addProject}
          onDelete={deleteProject}
          onClose={() => setShowProjectMgr(false)}
        />
      )}

      {showChainMgr && (
        <ChainManager
          chains={chains}
          prompts={prompts}
          onAdd={addChain}
          onDelete={deleteChain}
          onRun={handleRunChain}
          onClose={() => setShowChainMgr(false)}
        />
      )}

      {showSettings && (
        <SettingsModal
          onImport={async (promptsData, projectsData, chainsData) => {
            await importProjects(projectsData);
            await importPrompts(promptsData);
            if (chainsData) await importChains(chainsData);
          }}
          prompts={prompts}
          projects={projects}
          chains={chains}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Prompt, Project } from '../../lib/types';

interface PromptFormProps {
  prompt: Prompt | null;
  projects: Project[];
  allTags: string[];
  onSubmit: (data: { title: string; content: string; projectId: string; tags: string[] }) => void;
  onClose: () => void;
}

export default function PromptForm({ prompt, projects, allTags, onSubmit, onClose }: PromptFormProps) {
  const [title, setTitle] = useState(prompt?.title || '');
  const [content, setContent] = useState(prompt?.content || '');
  const [projectId, setProjectId] = useState(prompt?.projectId || '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(prompt?.tags || []);

  useEffect(() => {
    if (prompt) {
      setTitle(prompt.title);
      setContent(prompt.content);
      setProjectId(prompt.projectId);
      setTags(prompt.tags);
    }
  }, [prompt]);

  function handleAddTag() {
    const tag = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput('');
  }

  function handleTagKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  }

  function handleRemoveTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onSubmit({ title: title.trim(), content, projectId, tags });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{prompt ? 'Edit Prompt' : 'New Prompt'}</h2>
          <button className="icon-btn" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Code Review Assistant"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Prompt Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your prompt here..."
              rows={6}
            />
          </div>
          <div className="form-group">
            <label>Project</label>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Tags</label>
            <div className="tag-input-row">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Add a tag and press Enter"
                list="tag-suggestions"
              />
              <datalist id="tag-suggestions">
                {allTags.filter((t) => !tags.includes(t)).map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
              <button type="button" className="btn secondary small" onClick={handleAddTag}>
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="tag-pills">
                {tags.map((tag) => (
                  <span key={tag} className="tag-pill">
                    #{tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)}>&times;</button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="form-actions">
            <button type="button" className="btn secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn primary">
              {prompt ? 'Save Changes' : 'Create Prompt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

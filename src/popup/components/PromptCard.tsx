import { Prompt, Project } from '../../lib/types';

interface PromptCardProps {
  prompt: Prompt;
  project: Project | null;
  bulkMode: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  onCopy: () => void;
  onInject: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function PromptCard({
  prompt,
  project,
  bulkMode,
  isSelected,
  onToggleSelect,
  onCopy,
  onInject,
  onEdit,
  onDelete,
}: PromptCardProps) {
  return (
    <div className={`prompt-card ${isSelected ? 'selected' : ''}`}>
      <div className="prompt-card-header">
        <div className="prompt-card-title-row">
          {bulkMode ? (
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={onToggleSelect}
              />
              <span className="checkbox-box" />
            </label>
          ) : (
            <span className="drag-handle" title="Drag to reorder">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="6" r="1" />
                <circle cx="15" cy="6" r="1" />
                <circle cx="9" cy="12" r="1" />
                <circle cx="15" cy="12" r="1" />
                <circle cx="9" cy="18" r="1" />
                <circle cx="15" cy="18" r="1" />
              </svg>
            </span>
          )}
          {project && (
            <span className="project-dot" style={{ backgroundColor: project.color }} />
          )}
          <h3 className="prompt-title">{prompt.title}</h3>
          <span className="usage-count">{prompt.usageCount}</span>
        </div>
        {!bulkMode && (
          <div className="prompt-card-actions">
            <button className="icon-btn" onClick={onCopy} title="Copy to clipboard">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>
            <button className="icon-btn" onClick={onInject} title="Inject into page">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 10 20 15 15 20" />
                <path d="M4 4v7a4 4 0 0 0 4 4h12" />
              </svg>
            </button>
            <button className="icon-btn" onClick={onEdit} title="Edit prompt">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              </svg>
            </button>
            <button className="icon-btn danger" onClick={onDelete} title="Delete prompt">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </button>
          </div>
        )}
      </div>
      {prompt.tags.length > 0 && (
        <div className="prompt-tags">
          {prompt.tags.map((tag) => (
            <span key={tag} className="prompt-tag">#{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}

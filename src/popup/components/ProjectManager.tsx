import { useState } from 'react';
import { Project } from '../../lib/types';

interface ProjectManagerProps {
  projects: Project[];
  onAdd: (name: string) => Promise<Project>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}

export default function ProjectManager({ projects, onAdd, onDelete, onClose }: ProjectManagerProps) {
  const [name, setName] = useState('');

  async function handleAdd() {
    if (name.trim()) {
      await onAdd(name.trim());
      setName('');
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Manage Projects</h2>
          <button className="icon-btn" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="tag-input-row">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="New project name"
          />
          <button className="btn primary small" onClick={handleAdd}>Add</button>
        </div>
        <ul className="project-list">
          {projects.length === 0 && (
            <li className="project-empty">No projects yet.</li>
          )}
          {projects.map((proj) => (
            <li key={proj.id} className="project-list-item">
              <span className="project-dot" style={{ backgroundColor: proj.color }} />
              <span className="project-name">{proj.name}</span>
              <button
                className="icon-btn danger"
                onClick={() => onDelete(proj.id)}
                title="Delete project"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

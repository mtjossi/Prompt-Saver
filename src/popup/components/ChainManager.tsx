import { useState, useMemo } from 'react';
import { PromptChain, Prompt } from '../../lib/types';

interface ChainManagerProps {
  chains: PromptChain[];
  prompts: Prompt[];
  onAdd: (name: string, promptIds: string[]) => Promise<PromptChain>;
  onDelete: (id: string) => Promise<void>;
  onRun: (chainId: string) => void;
  onClose: () => void;
}

export default function ChainManager({ chains, prompts, onAdd, onDelete, onRun, onClose }: ChainManagerProps) {
  const [name, setName] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const sortedPrompts = useMemo(() => {
    return [...prompts].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [prompts]);

  async function handleAdd() {
    if (name.trim() && selectedIds.length > 0) {
      await onAdd(name.trim(), selectedIds);
      setName('');
      setSelectedIds([]);
    }
  }

  function togglePromptId(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal chain-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Prompt Chains</h2>
          <button className="icon-btn" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="form-group">
          <label>New Chain</label>
          <div className="tag-input-row">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Chain name"
            />
            <button className="btn primary small" onClick={handleAdd}>Create</button>
          </div>
          <div className="chain-select-section">
            <p className="settings-desc" style={{ marginTop: 8 }}>Select prompts (in order):</p>
            <div className="chain-prompt-list">
              {sortedPrompts.map((p) => (
                <label key={p.id} className="chain-prompt-item">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(p.id)}
                    onChange={() => togglePromptId(p.id)}
                  />
                  <span>{p.title}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {chains.length > 0 && (
          <div className="chain-list-section">
            <h3>Existing Chains</h3>
            {chains.map((chain) => {
              const chainPrompts = chain.promptIds
                .map((pid) => prompts.find((p) => p.id === pid))
                .filter(Boolean) as Prompt[];
              return (
                <div key={chain.id} className="chain-card">
                  <div className="chain-card-info">
                    <strong>{chain.name}</strong>
                    <span className="chain-steps">
                      {chainPrompts.map((p) => p.title).join(' → ')}
                    </span>
                  </div>
                  <div className="chain-card-actions">
                    <button className="btn secondary small" onClick={() => onRun(chain.id)}>
                      Run
                    </button>
                    <button className="icon-btn danger" onClick={() => onDelete(chain.id)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

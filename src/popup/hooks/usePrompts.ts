import { useState, useEffect, useCallback } from 'react';
import { Prompt } from '../../lib/types';
import { getPrompts, savePrompts, generateId } from '../../lib/storage';

export function usePrompts() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPrompts().then((data) => {
      setPrompts(data);
      setLoading(false);
    });
  }, []);

  const reload = useCallback(async () => {
    const data = await getPrompts();
    setPrompts(data);
  }, []);

  const addPrompt = useCallback(
    async (data: Omit<Prompt, 'id' | 'sortOrder' | 'createdAt' | 'updatedAt' | 'usageCount'>) => {
      const now = Date.now();
      const newPrompt: Prompt = {
        ...data,
        id: generateId(),
        sortOrder: prompts.length,
        createdAt: now,
        updatedAt: now,
        usageCount: 0,
      };
      const updated = [...prompts, newPrompt];
      await savePrompts(updated);
      setPrompts(updated);
      return newPrompt;
    },
    [prompts]
  );

  const updatePrompt = useCallback(
    async (id: string, data: Partial<Prompt>) => {
      const updated = prompts.map((p) =>
        p.id === id ? { ...p, ...data, updatedAt: Date.now() } : p
      );
      await savePrompts(updated);
      setPrompts(updated);
    },
    [prompts]
  );

  const deletePrompt = useCallback(
    async (id: string) => {
      const updated = prompts.filter((p) => p.id !== id);
      await savePrompts(updated);
      setPrompts(updated);
    },
    [prompts]
  );

  const incrementUsage = useCallback(
    async (id: string) => {
      const prompt = prompts.find((p) => p.id === id);
      if (prompt) {
        await updatePrompt(id, { usageCount: prompt.usageCount + 1 });
      }
    },
    [prompts, updatePrompt]
  );

  const reorderPrompts = useCallback(
    async (reordered: Prompt[]) => {
      const updated = reordered.map((p, i) => ({ ...p, sortOrder: i }));
      await savePrompts(updated);
      setPrompts(updated);
    },
    []
  );

  const importPrompts = useCallback(
    async (newPrompts: Prompt[]) => {
      await savePrompts(newPrompts);
      setPrompts(newPrompts);
    },
    []
  );

  return {
    prompts,
    loading,
    reload,
    addPrompt,
    updatePrompt,
    deletePrompt,
    incrementUsage,
    reorderPrompts,
    importPrompts,
  };
}

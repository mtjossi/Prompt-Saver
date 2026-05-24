import { useState, useEffect, useCallback } from 'react';
import { PromptChain } from '../../lib/types';
import { getChains, saveChains, generateId } from '../../lib/storage';

export function useChains() {
  const [chains, setChains] = useState<PromptChain[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getChains().then((data) => {
      setChains(data);
      setLoading(false);
    });
  }, []);

  const addChain = useCallback(
    async (name: string, promptIds: string[]) => {
      const newChain: PromptChain = {
        id: generateId(),
        name,
        promptIds,
        createdAt: Date.now(),
      };
      const updated = [...chains, newChain];
      await saveChains(updated);
      setChains(updated);
      return newChain;
    },
    [chains]
  );

  const updateChain = useCallback(
    async (id: string, data: Partial<PromptChain>) => {
      const updated = chains.map((c) => (c.id === id ? { ...c, ...data } : c));
      await saveChains(updated);
      setChains(updated);
    },
    [chains]
  );

  const deleteChain = useCallback(
    async (id: string) => {
      const updated = chains.filter((c) => c.id !== id);
      await saveChains(updated);
      setChains(updated);
    },
    [chains]
  );

  const importChains = useCallback(async (newChains: PromptChain[]) => {
    await saveChains(newChains);
    setChains(newChains);
  }, []);

  return { chains, loading, addChain, updateChain, deleteChain, importChains };
}

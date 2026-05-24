import { AppData, Prompt, Project, PromptChain } from './types';

const PROMPTS_KEY = 'prompts';
const PROJECTS_KEY = 'projects';
const CHAINS_KEY = 'chains';

export async function getPrompts(): Promise<Prompt[]> {
  const result = await chrome.storage.local.get(PROMPTS_KEY);
  const prompts = (result[PROMPTS_KEY] as Prompt[]) || [];
  return prompts.sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getProjects(): Promise<Project[]> {
  const result = await chrome.storage.local.get(PROJECTS_KEY);
  return (result[PROJECTS_KEY] as Project[]) || [];
}

export async function savePrompts(prompts: Prompt[]): Promise<void> {
  await chrome.storage.local.set({ [PROMPTS_KEY]: prompts });
}

export async function saveProjects(projects: Project[]): Promise<void> {
  await chrome.storage.local.set({ [PROJECTS_KEY]: projects });
}

export async function getChains(): Promise<PromptChain[]> {
  const result = await chrome.storage.local.get(CHAINS_KEY);
  return (result[CHAINS_KEY] as PromptChain[]) || [];
}

export async function saveChains(chains: PromptChain[]): Promise<void> {
  await chrome.storage.local.set({ [CHAINS_KEY]: chains });
}

export async function getAppData(): Promise<AppData> {
  const result = await chrome.storage.local.get([PROMPTS_KEY, PROJECTS_KEY, CHAINS_KEY]);
  return {
    prompts: ((result[PROMPTS_KEY] as Prompt[]) || []).sort((a, b) => a.sortOrder - b.sortOrder),
    projects: (result[PROJECTS_KEY] as Project[]) || [],
    chains: (result[CHAINS_KEY] as PromptChain[]) || [],
  };
}

export async function importAppData(data: AppData): Promise<void> {
  await chrome.storage.local.set({
    [PROMPTS_KEY]: data.prompts,
    [PROJECTS_KEY]: data.projects,
    [CHAINS_KEY]: data.chains || [],
  });
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

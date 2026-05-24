export interface Project {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

export interface Prompt {
  id: string;
  title: string;
  content: string;
  projectId: string;
  tags: string[];
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
  usageCount: number;
}

export interface PromptChain {
  id: string;
  name: string;
  promptIds: string[];
  createdAt: number;
}

export interface AppData {
  prompts: Prompt[];
  projects: Project[];
  chains: PromptChain[];
}

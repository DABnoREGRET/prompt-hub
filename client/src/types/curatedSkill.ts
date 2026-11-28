export interface CuratedSkillItem {
  id: number;
  title: string;
  slug: string;
  harness: string;
  category: string;
  description: string;
  repoUrl: string;
  docsUrl: string;
  installCommand: string;
  skillMdContent: string;
  tags: string[];
  isFeatured: boolean;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCuratedSkillPayload {
  title: string;
  harness: string;
  category: string;
  description: string;
  repoUrl: string;
  docsUrl: string;
  installCommand: string;
  skillMdContent: string;
  tags: string[];
  isFeatured: boolean;
}

export type UpdateCuratedSkillPayload = Partial<CreateCuratedSkillPayload>;

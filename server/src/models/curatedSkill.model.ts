import { getDb, QueryResultRow } from '../db/client.js';
import type { ListCuratedSkillsQuery } from '../validators/curatedSkill.schema.js';

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

export interface CuratedSkillRow extends QueryResultRow {
  id: number;
  title: string;
  slug: string;
  harness: string;
  category: string;
  description: string;
  repo_url: string;
  docs_url: string;
  install_command: string;
  skill_md_content: string;
  tags: string;
  is_featured: boolean;
  created_by: number | null;
  created_at: string | Date;
  updated_at: string | Date;
}

export function mapCuratedSkillRow(row: CuratedSkillRow): CuratedSkillItem {
  const tags = String(row.tags || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    id: Number(row.id),
    title: String(row.title),
    slug: String(row.slug),
    harness: String(row.harness),
    category: String(row.category),
    description: String(row.description ?? ''),
    repoUrl: String(row.repo_url),
    docsUrl: String(row.docs_url ?? ''),
    installCommand: String(row.install_command ?? ''),
    skillMdContent: String(row.skill_md_content),
    tags,
    isFeatured: Boolean(row.is_featured),
    createdBy: row.created_by === null ? null : Number(row.created_by),
    createdAt:
      row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updatedAt:
      row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  };
}

export async function listCuratedSkills(
  filters: ListCuratedSkillsQuery = {},
): Promise<CuratedSkillItem[]> {
  const db = await getDb();
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.q) {
    params.push(`%${filters.q}%`);
    const p = `$${params.length}`;
    conditions.push(`(
      title ILIKE ${p}
      OR description ILIKE ${p}
      OR harness ILIKE ${p}
      OR category ILIKE ${p}
      OR tags ILIKE ${p}
      OR skill_md_content ILIKE ${p}
    )`);
  }

  if (filters.harness) {
    params.push(`%${filters.harness}%`);
    conditions.push(`harness ILIKE $${params.length}`);
  }

  if (filters.category) {
    params.push(`%${filters.category}%`);
    conditions.push(`category ILIKE $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const res = await db.query<CuratedSkillRow>(
    `SELECT * FROM curated_skills
     ${whereClause}
     ORDER BY is_featured DESC, id ASC`,
    params,
  );
  return res.rows.map(mapCuratedSkillRow);
}

export async function findCuratedSkillById(id: number): Promise<CuratedSkillItem | null> {
  const db = await getDb();
  const res = await db.query<CuratedSkillRow>(
    'SELECT * FROM curated_skills WHERE id = $1',
    [id],
  );
  return res.rows[0] ? mapCuratedSkillRow(res.rows[0]) : null;
}

export async function findCuratedSkillBySlug(slug: string): Promise<CuratedSkillItem | null> {
  const db = await getDb();
  const res = await db.query<CuratedSkillRow>(
    'SELECT * FROM curated_skills WHERE slug = $1',
    [slug],
  );
  return res.rows[0] ? mapCuratedSkillRow(res.rows[0]) : null;
}

export async function insertCuratedSkill(input: {
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
  createdBy: number;
}): Promise<CuratedSkillItem> {
  const db = await getDb();
  const res = await db.query<CuratedSkillRow>(
    `INSERT INTO curated_skills (
       title, slug, harness, category, description, repo_url, docs_url,
       install_command, skill_md_content, tags, is_featured, created_by
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      input.title,
      input.slug,
      input.harness,
      input.category,
      input.description,
      input.repoUrl,
      input.docsUrl,
      input.installCommand,
      input.skillMdContent,
      input.tags.join(','),
      input.isFeatured,
      input.createdBy,
    ],
  );
  return mapCuratedSkillRow(res.rows[0]);
}

export async function updateCuratedSkillById(
  id: number,
  input: {
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
  },
): Promise<CuratedSkillItem | null> {
  const db = await getDb();
  const res = await db.query<CuratedSkillRow>(
    `UPDATE curated_skills
     SET title = $1,
         slug = $2,
         harness = $3,
         category = $4,
         description = $5,
         repo_url = $6,
         docs_url = $7,
         install_command = $8,
         skill_md_content = $9,
         tags = $10,
         is_featured = $11,
         updated_at = NOW()
     WHERE id = $12
     RETURNING *`,
    [
      input.title,
      input.slug,
      input.harness,
      input.category,
      input.description,
      input.repoUrl,
      input.docsUrl,
      input.installCommand,
      input.skillMdContent,
      input.tags.join(','),
      input.isFeatured,
      id,
    ],
  );
  return res.rows[0] ? mapCuratedSkillRow(res.rows[0]) : null;
}

export async function deleteCuratedSkillById(id: number): Promise<boolean> {
  const db = await getDb();
  const res = await db.query<{ id: number }>(
    'DELETE FROM curated_skills WHERE id = $1 RETURNING id',
    [id],
  );
  return res.rows.length > 0;
}

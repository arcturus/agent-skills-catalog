/**
 * Parse SKILL.md content and extract required/optional metadata.
 * Expects YAML frontmatter with name, description, and optional fields.
 */
export interface SkillMetadata {
  name: string;
  description: string;
  license?: string;
  compatibility?: string;
  metadata?: string;
  disableModelInvocation?: boolean;
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---/;

function parseFrontmatter(text: string): Record<string, string> {
  const match = text.match(FRONTMATTER_RE);
  if (!match) return {};
  const block = match[1];
  const result: Record<string, string> = {};
  for (const line of block.split(/\r?\n/)) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    const key = line.slice(0, colonIndex).trim().toLowerCase().replace(/-/g, '_');
    const value = line.slice(colonIndex + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && value) result[key] = value;
  }
  return result;
}

export function parseSkillMd(content: string): SkillMetadata | null {
  const fm = parseFrontmatter(content);
  const name = fm.name?.trim();
  const description = fm.description?.trim();
  if (!name || !description) return null;

  const disableModelInvocation =
    fm.disable_model_invocation === 'true' || fm.disable_model_invocation === '1';

  return {
    name,
    description,
    license: fm.license || undefined,
    compatibility: fm.compatibility || undefined,
    metadata: fm.metadata || undefined,
    disableModelInvocation: disableModelInvocation || undefined,
  };
}

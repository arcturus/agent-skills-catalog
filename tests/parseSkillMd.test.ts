import { parseSkillMd } from '../src/parseSkillMd';

describe('parseSkillMd', () => {
  it('parses frontmatter with name and description', () => {
    const content = `---
name: my-skill
description: A test skill
---
# Body`;
    const result = parseSkillMd(content);
    expect(result).toEqual({
      name: 'my-skill',
      description: 'A test skill',
    });
  });

  it('returns null when name or description is missing', () => {
    expect(parseSkillMd('---\ndescription: only desc\n---')).toBeNull();
    expect(parseSkillMd('---\nname: only-name\n---')).toBeNull();
    expect(parseSkillMd('no frontmatter')).toBeNull();
  });

  it('parses optional fields', () => {
    const content = `---
name: x
description: y
license: MIT
disable-model-invocation: true
---`;
    const result = parseSkillMd(content);
    expect(result?.license).toBe('MIT');
    expect(result?.disableModelInvocation).toBe(true);
  });
});

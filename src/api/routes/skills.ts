/**
 * REST routes: list, search, download skills.
 */
import { Router, Request, Response } from 'express';
import AdmZip from 'adm-zip';
import { listSkills, searchSkills, getSkillById } from '../../db';
import { logger } from '../../restLogger';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  try {
    const skills = listSkills();
    res.json({ skills, count: skills.length });
  } catch (err) {
    logger.error({ err }, 'List skills failed');
    res.status(500).json({ error: 'Failed to list skills' });
  }
});

router.get('/search', (req: Request, res: Response) => {
  const q = (req.query.q as string) ?? '';
  try {
    const skills = searchSkills(q);
    res.json({ skills, count: skills.length, q });
  } catch (err) {
    logger.error({ err, q }, 'Search skills failed');
    res.status(500).json({ error: 'Failed to search skills' });
  }
});

router.get('/:id/download', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Invalid skill id' });
  }
  const skill = getSkillById(id);
  if (!skill) {
    return res.status(404).json({ error: 'Skill not found' });
  }
  try {
    const zip = new AdmZip();
    zip.addFile('SKILL.md', Buffer.from(skill.raw_content ?? '', 'utf-8'));
    const zipBuffer = zip.toBuffer();
    const filename = `skill-${skill.name.replace(/[^a-z0-9-_]/gi, '-')}-${id}.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(zipBuffer);
  } catch (err) {
    logger.error({ err, id }, 'Download skill failed');
    res.status(500).json({ error: 'Failed to create download' });
  }
});

export default router;

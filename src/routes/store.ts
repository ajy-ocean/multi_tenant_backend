import { Router } from 'express';
import { prisma } from '../db';
import { authenticate } from '../middleware/auth';

const router = Router();

// Get the authenticated user's store
router.get('/', authenticate as any, async (req: any, res: any) => {
  try {
    const store = await prisma.store.findUnique({
      where: { ownerId: req.user!.id },
    });
    res.json({ store });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching store' });
  }
});

// Create or update store for the authenticated user
router.post('/', authenticate as any, async (req: any, res: any) => {
  const { name, slug, primaryColor, logoUrl, tagline } = req.body;
  const ownerId = req.user!.id;

  try {
    // Check if slug is taken by another store
    const existingSlug = await prisma.store.findUnique({ where: { slug } });
    if (existingSlug && existingSlug.ownerId !== ownerId) {
      return res.status(400).json({ error: 'Slug is already taken' });
    }

    const store = await prisma.store.upsert({
      where: { ownerId },
      update: { name, slug, primaryColor, logoUrl, tagline },
      create: { name, slug, primaryColor, logoUrl, tagline, ownerId },
    });

    res.json({ store });
  } catch (error) {
    res.status(500).json({ error: 'Error saving store' });
  }
});

// Public: Get store details by slug
router.get('/:slug/public', async (req: any, res: any) => {
  const { slug } = req.params;
  try {
    const store = await prisma.store.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        primaryColor: true,
        logoUrl: true,
        tagline: true,
      }
    });

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    res.json({ store });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching store' });
  }
});

export default router;

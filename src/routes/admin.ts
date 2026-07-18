import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Platform Admin: Get all orders across all tenants
router.get('/orders', authenticate as any, requireAdmin as any, async (req: any, res: any) => {
  try {
    const orders = await prisma.order.findMany({
      include: { 
        items: true,
        store: {
          select: { name: true, slug: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching platform orders' });
  }
});

// Platform Admin: Get all stores
router.get('/stores', authenticate as any, requireAdmin as any, async (req: any, res: any) => {
  try {
    const stores = await prisma.store.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        owner: {
          select: { email: true }
        }
      }
    });
    // Transform to flatten owner email for client convenience
    const transformed = stores.map((store: any) => ({
      ...store,
      ownerEmail: store.owner?.email || null,
      // Remove nested owner object to keep payload simple
      owner: undefined
    }));
    res.json({ stores: transformed });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching platform stores' });
  }
});
// Platform Admin: Update a store
router.put(
  '/stores/:id',
  authenticate as any,
  requireAdmin as any,
  async (req: any, res: any) => {
    const { id } = req.params;
    const { name, slug, primaryColor, logoUrl, tagline } = req.body;
    try {
      const updated = await prisma.store.update({
        where: { id },
        data: { name, slug, primaryColor, logoUrl, tagline },
        include: { owner: { select: { email: true } } },
      });
      const transformed = {
        ...updated,
        ownerEmail: updated.owner?.email || null,
        owner: undefined,
      };
      res.json({ store: transformed });
    } catch (error) {
      res.status(500).json({ error: 'Error updating store' });
    }
  }
);

// Platform Admin: Delete a store
router.delete(
  '/stores/:id',
  authenticate as any,
  requireAdmin as any,
  async (req: any, res: any) => {
    const { id } = req.params;
    try {
      await prisma.store.delete({ where: { id } });
      res.json({ message: 'Store deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Error deleting store' });
    }
  }
);

export default router;

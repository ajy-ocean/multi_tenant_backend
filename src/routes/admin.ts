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
      orderBy: { createdAt: 'desc' }
    });
    res.json({ stores });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching platform stores' });
  }
});

export default router;

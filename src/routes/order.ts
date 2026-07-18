import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, requireStore } from '../middleware/auth';

const router = Router();

// Get orders for the authenticated owner's store
router.get('/', authenticate as any, requireStore as any, async (req: any, res: any) => {
  try {
    const orders = await prisma.order.findMany({
      where: { storeId: req.user!.storeId },
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching orders' });
  }
});

// Public: Checkout (Create order)
router.post('/checkout/:slug', async (req: any, res: any) => {
  const { slug } = req.params;
  const { shopperName, shopperEmail, items } = req.body;
  
  if (!items || !items.length) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  try {
    const store = await prisma.store.findUnique({ where: { slug } });
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Calculate total and prepare items
    let totalAmount = 0;
    const orderItemsData = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product || product.storeId !== store.id) {
        return res.status(400).json({ error: `Invalid product: ${item.productId}` });
      }

      totalAmount += product.price * item.quantity;
      
      orderItemsData.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price
      });
    }

    const order = await prisma.order.create({
      data: {
        shopperName,
        shopperEmail,
        totalAmount,
        storeId: store.id,
        items: {
          create: orderItemsData
        }
      },
      include: { items: true }
    });

    res.status(201).json({ order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error processing checkout' });
  }
});

export default router;

import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, requireStore } from '../middleware/auth';

const router = Router();

// Get products for the authenticated owner's store
router.get('/', authenticate as any, requireStore as any, async (req: any, res: any) => {
  try {
    const products = await prisma.product.findMany({
      where: { storeId: req.user!.storeId },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ products });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching products' });
  }
});

// Create a product
router.post('/', authenticate as any, requireStore as any, async (req: any, res: any) => {
  const { name, description, price, imageUrl, stock, category } = req.body;
  
  if (!name || price === undefined || price < 0) {
    return res.status(400).json({ error: 'Invalid product data' });
  }

  try {
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        imageUrl,
        stock: parseInt(stock) || 0,
        category,
        storeId: req.user!.storeId!
      }
    });
    res.status(201).json({ product });
  } catch (error) {
    res.status(500).json({ error: 'Error creating product' });
  }
});

// Update a product
router.put('/:id', authenticate as any, requireStore as any, async (req: any, res: any) => {
  const { id } = req.params;
  const { name, description, price, imageUrl, stock, category } = req.body;

  try {
    // Ensure the product belongs to this store
    const existing = await prisma.product.findFirst({
      where: { id, storeId: req.user!.storeId! }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        price: price !== undefined ? parseFloat(price) : undefined,
        imageUrl,
        stock: stock !== undefined ? parseInt(stock) : undefined,
        category,
      }
    });
    res.json({ product });
  } catch (error) {
    res.status(500).json({ error: 'Error updating product' });
  }
});

// Delete a product
router.delete('/:id', authenticate as any, requireStore as any, async (req: any, res: any) => {
  const { id } = req.params;

  try {
    const existing = await prisma.product.findFirst({
      where: { id, storeId: req.user!.storeId! }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await prisma.product.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting product' });
  }
});

// Public: Get products for a store by slug
router.get('/public/:slug', async (req: any, res: any) => {
  const { slug } = req.params;
  
  try {
    const store = await prisma.store.findUnique({ where: { slug } });
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const products = await prisma.product.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ products });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching products' });
  }
});

export default router;

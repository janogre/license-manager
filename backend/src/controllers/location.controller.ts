import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all locations
export const getLocations = async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '1000', search } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (search) {
      where.name = {
        contains: search as string,
        mode: 'insensitive',
      };
    }

    const [locations, total] = await Promise.all([
      prisma.location.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { assets: true },
          },
        },
      }),
      prisma.location.count({ where }),
    ]);

    res.json({
      locations,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
};

// Get single location
export const getLocation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const location = await prisma.location.findUnique({
      where: { id },
      include: {
        assets: {
          include: {
            model: true,
          },
        },
        _count: {
          select: { assets: true },
        },
      },
    });

    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    res.json(location);
  } catch (error) {
    console.error('Error fetching location:', error);
    res.status(500).json({ error: 'Failed to fetch location' });
  }
};

// Create location
export const createLocation = async (req: Request, res: Response) => {
  try {
    const { name, description, isActive = true } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const location = await prisma.location.create({
      data: {
        name,
        description,
        isActive,
      },
    });

    res.status(201).json(location);
  } catch (error: any) {
    console.error('Error creating location:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'A location with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to create location' });
  }
};

// Update location
export const updateLocation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    const location = await prisma.location.update({
      where: { id },
      data: {
        name,
        description,
        isActive,
      },
    });

    res.json(location);
  } catch (error: any) {
    console.error('Error updating location:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Location not found' });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'A location with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to update location' });
  }
};

// Delete location
export const deleteLocation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if location has assets
    const location = await prisma.location.findUnique({
      where: { id },
      include: {
        _count: {
          select: { assets: true },
        },
      },
    });

    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    if (location._count.assets > 0) {
      return res.status(400).json({
        error: `Cannot delete location with ${location._count.assets} assigned assets`,
      });
    }

    await prisma.location.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting location:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Location not found' });
    }
    res.status(500).json({ error: 'Failed to delete location' });
  }
};

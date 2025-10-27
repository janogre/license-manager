import { Request, Response } from 'express';
import { prisma } from '../index';

export const getLicenses = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50, search, licenseType } = req.query;

    const where: any = { isActive: true };

    if (search) {
      where.OR = [
        { licenseKey: { contains: search as string, mode: 'insensitive' } },
        { softwareProduct: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (licenseType) {
      where.licenseType = licenseType;
    }

    const [licenses, total] = await Promise.all([
      prisma.license.findMany({
        where,
        include: {
          assets: {
            include: {
              asset: {
                include: {
                  model: true,
                },
              },
            },
          },
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.license.count({ where }),
    ]);

    res.json({
      licenses,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch licenses', details: error.message });
  }
};

export const getLicenseById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const license = await prisma.license.findUnique({
      where: { id },
      include: {
        assets: {
          include: {
            asset: {
              include: {
                model: true,
              },
            },
          },
        },
      },
    });

    if (!license) {
      return res.status(404).json({ error: 'License not found' });
    }

    res.json({ license });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch license', details: error.message });
  }
};

export const createLicense = async (req: Request, res: Response) => {
  try {
    const license = await prisma.license.create({
      data: {
        ...req.body,
        purchaseDate: req.body.purchaseDate ? new Date(req.body.purchaseDate) : null,
        expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : null,
      },
    });

    res.status(201).json({ license });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create license', details: error.message });
  }
};

export const updateLicense = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    if (data.purchaseDate) {
      data.purchaseDate = new Date(data.purchaseDate);
    }

    if (data.expiryDate) {
      data.expiryDate = new Date(data.expiryDate);
    }

    const license = await prisma.license.update({
      where: { id },
      data,
    });

    res.json({ license });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update license', details: error.message });
  }
};

export const deleteLicense = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.license.delete({ where: { id } });

    res.json({ message: 'License deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete license', details: error.message });
  }
};

export const assignLicenseToAsset = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { assetId } = req.body;

    const mapping = await prisma.assetLicenseMapping.create({
      data: {
        licenseId: id,
        assetId,
      },
      include: {
        asset: {
          include: {
            model: true,
          },
        },
        license: true,
      },
    });

    res.status(201).json({ mapping });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to assign license', details: error.message });
  }
};

export const unassignLicenseFromAsset = async (req: Request, res: Response) => {
  try {
    const { id, assetId } = req.params;

    await prisma.assetLicenseMapping.deleteMany({
      where: {
        licenseId: id,
        assetId,
      },
    });

    res.json({ message: 'License unassigned successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to unassign license', details: error.message });
  }
};

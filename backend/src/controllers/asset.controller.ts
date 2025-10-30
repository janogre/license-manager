import { Request, Response } from 'express';
import { prisma } from '../index';
import { billingService } from '../services/billingService';

export const getAssets = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50, search, status, modelId, location } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { serialNumber: { contains: search as string, mode: 'insensitive' } },
        { hostname: { contains: search as string, mode: 'insensitive' } },
        { assetTag: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (modelId) {
      where.modelId = modelId;
    }

    if (location) {
      where.location = { contains: location as string, mode: 'insensitive' };
    }

    const [assets, total] = await Promise.all([
      prisma.hardwareAsset.findMany({
        where,
        include: {
          model: true,
          licenses: {
            include: {
              license: true,
            },
          },
          contracts: {
            include: {
              contract: true,
            },
          },
          billingMappings: {
            where: { isActive: true },
            include: {
              billingGroup: true,
            },
          },
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.hardwareAsset.count({ where }),
    ]);

    res.json({
      assets,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch assets', details: error.message });
  }
};

export const getAssetById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const asset = await prisma.hardwareAsset.findUnique({
      where: { id },
      include: {
        model: true,
        licenses: {
          include: {
            license: true,
          },
        },
        contracts: {
          include: {
            contract: true,
          },
        },
        billingMappings: {
          where: { isActive: true },
          include: {
            billingGroup: true,
          },
        },
      },
    });

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.json({ asset });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch asset', details: error.message });
  }
};

export const createAsset = async (req: Request, res: Response) => {
  try {
    const {
      modelId,
      serialNumber,
      assetTag,
      hostname,
      purchaseDate,
      purchasePrice,
      location,
      rackPosition,
      status,
      owner,
      notes,
    } = req.body;

    const asset = await prisma.hardwareAsset.create({
      data: {
        modelId,
        serialNumber,
        assetTag,
        hostname,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        purchasePrice,
        location,
        rackPosition,
        status,
        owner,
        notes,
      },
      include: {
        model: true,
      },
    });

    // Auto-assign new asset to billing group if status is ACTIVE
    if (status === 'ACTIVE' || (!status && asset.status === 'ACTIVE')) {
      try {
        await billingService.autoAssignAsset(asset.id);
        console.log(`Auto-assigned asset ${asset.id} to billing group`);
      } catch (autoAssignError) {
        // Log the error but don't fail the asset creation
        console.warn(`Failed to auto-assign asset ${asset.id} to billing group:`, autoAssignError);
      }
    }

    res.status(201).json({ asset });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create asset', details: error.message });
  }
};

export const updateAsset = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    if (data.purchaseDate) {
      data.purchaseDate = new Date(data.purchaseDate);
    }

    const asset = await prisma.hardwareAsset.update({
      where: { id },
      data,
      include: {
        model: true,
      },
    });

    res.json({ asset });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update asset', details: error.message });
  }
};

export const deleteAsset = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.hardwareAsset.delete({ where: { id } });

    res.json({ message: 'Asset deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete asset', details: error.message });
  }
};

export const getAssetLicenses = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const licenses = await prisma.assetLicenseMapping.findMany({
      where: { assetId: id },
      include: {
        license: true,
      },
    });

    res.json({ licenses });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch asset licenses', details: error.message });
  }
};

export const getAssetContracts = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const contracts = await prisma.assetContractMapping.findMany({
      where: { assetId: id },
      include: {
        contract: true,
      },
    });

    res.json({ contracts });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch asset contracts', details: error.message });
  }
};

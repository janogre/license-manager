import { Request, Response } from 'express';
import { prisma } from '../index';

export const getModels = async (req: Request, res: Response) => {
  try {
    const { search, modelType, isActive } = req.query;

    const where: any = {};

    if (search) {
      where.modelName = { contains: search as string, mode: 'insensitive' };
    }

    if (modelType) {
      where.modelType = modelType;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const models = await prisma.hardwareModel.findMany({
      where,
      include: {
        _count: {
          select: { assets: true },
        },
      },
      orderBy: { modelName: 'asc' },
    });

    res.json({ models });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch models', details: error.message });
  }
};

export const getModelById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const model = await prisma.hardwareModel.findUnique({
      where: { id },
      include: {
        assets: {
          include: {
            contracts: {
              include: {
                contract: true,
              },
            },
          },
        },
      },
    });

    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }

    res.json({ model });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch model', details: error.message });
  }
};

export const createModel = async (req: Request, res: Response) => {
  try {
    const model = await prisma.hardwareModel.create({
      data: {
        ...req.body,
        eolDate: req.body.eolDate ? new Date(req.body.eolDate) : null,
        eosDate: req.body.eosDate ? new Date(req.body.eosDate) : null,
        eolAnnouncedAt: req.body.eolAnnouncedAt ? new Date(req.body.eolAnnouncedAt) : null,
      },
    });

    res.status(201).json({ model });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create model', details: error.message });
  }
};

export const updateModel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    if (data.eolDate) {
      data.eolDate = new Date(data.eolDate);
    }

    if (data.eosDate) {
      data.eosDate = new Date(data.eosDate);
    }

    if (data.eolAnnouncedAt) {
      data.eolAnnouncedAt = new Date(data.eolAnnouncedAt);
    }

    const model = await prisma.hardwareModel.update({
      where: { id },
      data,
    });

    res.json({ model });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update model', details: error.message });
  }
};

export const deleteModel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if model has assets
    const assetCount = await prisma.hardwareAsset.count({
      where: { modelId: id },
    });

    if (assetCount > 0) {
      return res.status(400).json({
        error: 'Cannot delete model with existing assets',
        assetCount,
      });
    }

    await prisma.hardwareModel.delete({ where: { id } });

    res.json({ message: 'Model deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete model', details: error.message });
  }
};

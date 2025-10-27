import { Request, Response } from 'express';
import { prisma } from '../index';

export const getContracts = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50, search, contractType, isActive } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { contractNumber: { contains: search as string, mode: 'insensitive' } },
        { vendor: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (contractType) {
      where.contractType = contractType;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [contracts, total] = await Promise.all([
      prisma.maintenanceContract.findMany({
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
        orderBy: { endDate: 'asc' },
      }),
      prisma.maintenanceContract.count({ where }),
    ]);

    res.json({
      contracts,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch contracts', details: error.message });
  }
};

export const getContractById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const contract = await prisma.maintenanceContract.findUnique({
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

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    res.json({ contract });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch contract', details: error.message });
  }
};

export const createContract = async (req: Request, res: Response) => {
  try {
    const contract = await prisma.maintenanceContract.create({
      data: {
        ...req.body,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
        renewalDate: req.body.renewalDate ? new Date(req.body.renewalDate) : null,
      },
    });

    res.status(201).json({ contract });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create contract', details: error.message });
  }
};

export const updateContract = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    if (data.startDate) {
      data.startDate = new Date(data.startDate);
    }

    if (data.endDate) {
      data.endDate = new Date(data.endDate);
    }

    if (data.renewalDate) {
      data.renewalDate = new Date(data.renewalDate);
    }

    const contract = await prisma.maintenanceContract.update({
      where: { id },
      data,
    });

    res.json({ contract });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update contract', details: error.message });
  }
};

export const deleteContract = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.maintenanceContract.delete({ where: { id } });

    res.json({ message: 'Contract deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete contract', details: error.message });
  }
};

export const getExpiringContracts = async (req: Request, res: Response) => {
  try {
    const { days = 90 } = req.query;

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + Number(days));

    const contracts = await prisma.maintenanceContract.findMany({
      where: {
        isActive: true,
        endDate: {
          lte: futureDate,
          gte: new Date(),
        },
      },
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
      orderBy: { endDate: 'asc' },
    });

    res.json({ contracts });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch expiring contracts', details: error.message });
  }
};

export const assignContractToAsset = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { assetId, coverageStart, coverageEnd } = req.body;

    const mapping = await prisma.assetContractMapping.create({
      data: {
        contractId: id,
        assetId,
        coverageStart: new Date(coverageStart),
        coverageEnd: new Date(coverageEnd),
      },
      include: {
        asset: {
          include: {
            model: true,
          },
        },
        contract: true,
      },
    });

    res.status(201).json({ mapping });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to assign contract', details: error.message });
  }
};

export const unassignContractFromAsset = async (req: Request, res: Response) => {
  try {
    const { id, assetId } = req.params;

    await prisma.assetContractMapping.deleteMany({
      where: {
        contractId: id,
        assetId,
      },
    });

    res.json({ message: 'Contract unassigned successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to unassign contract', details: error.message });
  }
};

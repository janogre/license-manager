import { Request, Response } from 'express';
import { prisma } from '../index';

export const getInstallBaseReport = async (req: Request, res: Response) => {
  try {
    const assets = await prisma.hardwareAsset.findMany({
      include: {
        model: true,
        contracts: {
          include: {
            contract: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const report = assets.map(asset => ({
      serialNumber: asset.serialNumber,
      hostname: asset.hostname,
      model: asset.model.modelName,
      modelType: asset.model.modelType,
      location: asset.location,
      status: asset.status,
      hasActiveContract: asset.contracts.some(c => c.contract.isActive),
      contractCount: asset.contracts.length,
      purchaseDate: asset.purchaseDate,
    }));

    res.json({ report });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to generate install base report', details: error.message });
  }
};

export const getCoverageGapReport = async (req: Request, res: Response) => {
  try {
    const assetsWithoutContracts = await prisma.hardwareAsset.findMany({
      where: {
        contracts: {
          none: {},
        },
        status: {
          in: ['ACTIVE', 'SPARE'],
        },
      },
      include: {
        model: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const report = assetsWithoutContracts.map(asset => ({
      serialNumber: asset.serialNumber,
      hostname: asset.hostname,
      model: asset.model.modelName,
      modelType: asset.model.modelType,
      location: asset.location,
      status: asset.status,
      purchaseDate: asset.purchaseDate,
      purchasePrice: asset.purchasePrice,
    }));

    res.json({
      report,
      summary: {
        totalAssets: assetsWithoutContracts.length,
        totalValue: assetsWithoutContracts.reduce(
          (sum, asset) => sum + (asset.purchasePrice?.toNumber() || 0),
          0
        ),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to generate coverage gap report', details: error.message });
  }
};

export const getCostReport = async (req: Request, res: Response) => {
  try {
    const { year } = req.query;

    const contracts = await prisma.maintenanceContract.findMany({
      where: {
        isActive: true,
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
    });

    const licenses = await prisma.license.findMany({
      where: {
        isActive: true,
      },
    });

    const totalContractCost = contracts.reduce(
      (sum, contract) => sum + (contract.annualCost?.toNumber() || 0),
      0
    );

    const totalLicenseCost = licenses.reduce(
      (sum, license) => sum + (license.cost?.toNumber() || 0),
      0
    );

    const report = {
      contracts: contracts.map(c => ({
        contractNumber: c.contractNumber,
        vendor: c.vendor,
        contractType: c.contractType,
        annualCost: c.annualCost,
        startDate: c.startDate,
        endDate: c.endDate,
        assetCount: c.assets.length,
      })),
      licenses: licenses.map(l => ({
        softwareProduct: l.softwareProduct,
        licenseType: l.licenseType,
        quantity: l.quantity,
        cost: l.cost,
        expiryDate: l.expiryDate,
      })),
      summary: {
        totalContractCost,
        totalLicenseCost,
        totalCost: totalContractCost + totalLicenseCost,
        contractCount: contracts.length,
        licenseCount: licenses.length,
      },
    };

    res.json({ report });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to generate cost report', details: error.message });
  }
};

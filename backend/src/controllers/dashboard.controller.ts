import { Request, Response } from 'express';
import { prisma } from '../index';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // Total assets
    const totalAssets = await prisma.hardwareAsset.count();

    // Assets without contracts
    const assetsWithoutContracts = await prisma.hardwareAsset.count({
      where: {
        contracts: {
          none: {},
        },
      },
    });

    // Active contracts
    const activeContracts = await prisma.maintenanceContract.count({
      where: { isActive: true },
    });

    // Contracts expiring in 90 days
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

    const expiringContracts = await prisma.maintenanceContract.count({
      where: {
        isActive: true,
        endDate: {
          lte: ninetyDaysFromNow,
          gte: new Date(),
        },
      },
    });

    // Total licenses
    const totalLicenses = await prisma.license.count({
      where: { isActive: true },
    });

    // Total annual contract cost
    const contracts = await prisma.maintenanceContract.findMany({
      where: { isActive: true },
      select: { annualCost: true },
    });

    const totalAnnualCost = contracts.reduce(
      (sum, contract) => sum + (contract.annualCost?.toNumber() || 0),
      0
    );

    // Assets by status
    const assetsByStatus = await prisma.hardwareAsset.groupBy({
      by: ['status'],
      _count: true,
    });

    // Recent sync activity
    const recentSyncs = await prisma.observiumSyncLog.findMany({
      take: 5,
      orderBy: { syncedAt: 'desc' },
      include: {
        asset: {
          select: {
            hostname: true,
            serialNumber: true,
          },
        },
      },
    });

    res.json({
      stats: {
        totalAssets,
        assetsWithoutContracts,
        activeContracts,
        expiringContracts,
        totalLicenses,
        totalAnnualCost,
      },
      assetsByStatus: assetsByStatus.map(item => ({
        status: item.status,
        count: item._count,
      })),
      recentSyncs,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to fetch dashboard stats',
      details: error.message,
    });
  }
};

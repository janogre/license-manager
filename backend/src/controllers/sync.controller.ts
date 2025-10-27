import { Request, Response } from 'express';
import { prisma } from '../index';
import { syncObserviumDevices } from '../services/observium.service';
import { logger } from '../utils/logger';

export const triggerObserviumSync = async (req: Request, res: Response) => {
  try {
    logger.info('Manual Observium sync triggered');

    const stats = await syncObserviumDevices();

    res.json({
      message: 'Observium sync completed',
      stats,
    });
  } catch (error: any) {
    logger.error('Manual Observium sync failed:', error);
    res.status(500).json({
      error: 'Failed to sync with Observium',
      details: error.message,
    });
  }
};

export const getSyncLogs = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50, syncType, syncStatus } = req.query;

    const where: any = {};

    if (syncType) {
      where.syncType = syncType;
    }

    if (syncStatus) {
      where.syncStatus = syncStatus;
    }

    const [logs, total] = await Promise.all([
      prisma.observiumSyncLog.findMany({
        where,
        include: {
          asset: {
            include: {
              model: true,
            },
          },
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { syncedAt: 'desc' },
      }),
      prisma.observiumSyncLog.count({ where }),
    ]);

    res.json({
      logs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to fetch sync logs',
      details: error.message,
    });
  }
};

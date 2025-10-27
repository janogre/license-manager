import { Request, Response } from 'express';
import {
  getNetboxSites,
  getNetboxLocations,
  getNetboxRacks,
  getNetboxRackElevation,
  syncNetboxData,
} from '../services/netbox.service';
import { logger } from '../utils/logger';

export const getSites = async (req: Request, res: Response) => {
  try {
    const sites = await getNetboxSites();
    res.json({ sites });
  } catch (error: any) {
    logger.error('Failed to get sites:', error);
    res.status(500).json({
      error: 'Failed to fetch sites from Netbox',
      details: error.message,
    });
  }
};

export const getLocations = async (req: Request, res: Response) => {
  try {
    const { site } = req.query;
    const locations = await getNetboxLocations(site as string | undefined);
    res.json({ locations });
  } catch (error: any) {
    logger.error('Failed to get locations:', error);
    res.status(500).json({
      error: 'Failed to fetch locations from Netbox',
      details: error.message,
    });
  }
};

export const getRacks = async (req: Request, res: Response) => {
  try {
    const { site, location_id } = req.query;
    const racks = await getNetboxRacks(
      site as string | undefined,
      location_id ? parseInt(location_id as string) : undefined
    );
    res.json({ racks });
  } catch (error: any) {
    logger.error('Failed to get racks:', error);
    res.status(500).json({
      error: 'Failed to fetch racks from Netbox',
      details: error.message,
    });
  }
};

export const getRackElevation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const elevation = await getNetboxRackElevation(parseInt(id));

    if (!elevation) {
      return res.status(404).json({ error: 'Rack not found' });
    }

    res.json({ elevation });
  } catch (error: any) {
    logger.error('Failed to get rack elevation:', error);
    res.status(500).json({
      error: 'Failed to fetch rack elevation from Netbox',
      details: error.message,
    });
  }
};

export const syncNetbox = async (req: Request, res: Response) => {
  try {
    logger.info('Manual Netbox sync triggered');
    const stats = await syncNetboxData();
    res.json({
      message: 'Netbox sync completed',
      stats,
    });
  } catch (error: any) {
    logger.error('Manual Netbox sync failed:', error);
    res.status(500).json({
      error: 'Failed to sync with Netbox',
      details: error.message,
    });
  }
};

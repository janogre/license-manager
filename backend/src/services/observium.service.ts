import axios from 'axios';
import { prisma } from '../index';
import { logger } from '../utils/logger';
import { ModelType, AssetStatus } from '@prisma/client';

interface ObserviumDevice {
  device_id: number;
  hostname: string;
  sysName?: string;
  hardware?: string;
  serial?: string;
  version?: string;
  location?: string;
  status: number;
  disabled: number;
}

interface ObserviumInventoryItem {
  entPhysicalSerialNum?: string;
  entPhysicalModelName?: string;
  entPhysicalName?: string;
  entPhysicalDescr?: string;
}

export class ObserviumService {
  private baseUrl: string;
  private username: string;
  private password: string;
  private enabled: boolean;

  constructor() {
    this.baseUrl = process.env.OBSERVIUM_URL || '';
    this.username = process.env.OBSERVIUM_USERNAME || '';
    this.password = process.env.OBSERVIUM_PASSWORD || '';
    this.enabled = process.env.OBSERVIUM_ENABLED === 'true';
  }

  private getAuthHeader() {
    return {
      auth: {
        username: this.username,
        password: this.password,
      },
    };
  }

  /**
   * Fetch all devices from Observium
   */
  async fetchDevices(): Promise<ObserviumDevice[]> {
    if (!this.enabled) {
      logger.warn('Observium integration is disabled');
      return [];
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/api.php`,
        {
          params: {
            module: 'devices',
          },
          ...this.getAuthHeader(),
          timeout: 30000,
        }
      );

      return response.data.devices || [];
    } catch (error: any) {
      logger.error('Failed to fetch devices from Observium:', error.message);
      throw new Error(`Observium API error: ${error.message}`);
    }
  }

  /**
   * Fetch inventory for a specific device
   */
  async fetchDeviceInventory(deviceId: number): Promise<ObserviumInventoryItem[]> {
    if (!this.enabled) {
      return [];
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/api.php`,
        {
          params: {
            module: 'inventory',
            device: deviceId,
          },
          ...this.getAuthHeader(),
          timeout: 30000,
        }
      );

      return response.data.inventory || [];
    } catch (error: any) {
      logger.error(`Failed to fetch inventory for device ${deviceId}:`, error.message);
      return [];
    }
  }

  /**
   * Determine device model type based on hardware string
   */
  private determineModelType(hardware?: string): ModelType {
    if (!hardware) return ModelType.OTHER;

    const hw = hardware.toLowerCase();
    if (hw.includes('mx') || hw.includes('router')) return ModelType.ROUTER;
    if (hw.includes('ex') || hw.includes('switch')) return ModelType.SWITCH;
    if (hw.includes('srx') || hw.includes('firewall')) return ModelType.FIREWALL;
    if (hw.includes('ap')) return ModelType.WIRELESS_AP;
    if (hw.includes('controller')) return ModelType.CONTROLLER;

    return ModelType.OTHER;
  }

  /**
   * Filter Juniper devices
   */
  private isJuniperDevice(device: ObserviumDevice): boolean {
    const hardware = (device.hardware || '').toLowerCase();
    return hardware.includes('juniper') ||
           hardware.includes('junos') ||
           hardware.includes('mx') ||
           hardware.includes('ex') ||
           hardware.includes('srx');
  }

  /**
   * Sync devices from Observium to local database
   */
  async syncDevices(): Promise<{ created: number; updated: number; skipped: number; errors: number }> {
    const stats = { created: 0, updated: 0, skipped: 0, errors: 0 };

    try {
      logger.info('Fetching devices from Observium...');
      const devices = await this.fetchDevices();

      // Filter only Juniper devices
      const juniperDevices = devices.filter(d => this.isJuniperDevice(d));
      logger.info(`Found ${juniperDevices.length} Juniper devices out of ${devices.length} total devices`);

      for (const device of juniperDevices) {
        try {
          await this.syncSingleDevice(device, stats);
        } catch (error: any) {
          logger.error(`Error syncing device ${device.hostname}:`, error);
          stats.errors++;
        }
      }

      logger.info('Observium sync completed', stats);
      return stats;
    } catch (error: any) {
      logger.error('Observium sync failed:', error);
      throw error;
    }
  }

  /**
   * Sync a single device
   */
  private async syncSingleDevice(
    device: ObserviumDevice,
    stats: { created: number; updated: number; skipped: number }
  ): Promise<void> {
    // Skip disabled devices
    if (device.disabled === 1) {
      stats.skipped++;
      return;
    }

    // Try to get more detailed inventory
    const inventory = await this.fetchDeviceInventory(device.device_id);
    const serialNumber = device.serial || inventory[0]?.entPhysicalSerialNum;

    if (!serialNumber) {
      logger.warn(`Device ${device.hostname} has no serial number, skipping`);
      stats.skipped++;

      await prisma.observiumSyncLog.create({
        data: {
          observiumDeviceId: device.device_id,
          syncType: 'skip',
          syncStatus: 'success',
          errorMessage: 'No serial number found',
        },
      });
      return;
    }

    // Check if asset already exists
    const existingAsset = await prisma.hardwareAsset.findUnique({
      where: { serialNumber },
    });

    const modelName = device.hardware || 'Unknown Juniper Device';
    const modelType = this.determineModelType(device.hardware);

    // Ensure model exists
    let model = await prisma.hardwareModel.findUnique({
      where: { modelName },
    });

    if (!model) {
      model = await prisma.hardwareModel.create({
        data: {
          modelName,
          modelType,
          manufacturer: 'Juniper Networks',
        },
      });
    }

    if (existingAsset) {
      // Update existing asset
      await prisma.hardwareAsset.update({
        where: { id: existingAsset.id },
        data: {
          hostname: device.hostname,
          location: device.location,
          status: device.status === 1 ? AssetStatus.ACTIVE : AssetStatus.SPARE,
          observiumId: device.device_id,
          lastSyncAt: new Date(),
        },
      });

      await prisma.observiumSyncLog.create({
        data: {
          assetId: existingAsset.id,
          observiumDeviceId: device.device_id,
          syncType: 'update',
          syncStatus: 'success',
          changes: {
            hostname: device.hostname,
            location: device.location,
          },
        },
      });

      stats.updated++;
      logger.info(`Updated asset: ${device.hostname} (${serialNumber})`);
    } else {
      // Create new asset
      const newAsset = await prisma.hardwareAsset.create({
        data: {
          modelId: model.id,
          serialNumber,
          hostname: device.hostname,
          location: device.location,
          status: device.status === 1 ? AssetStatus.ACTIVE : AssetStatus.SPARE,
          observiumId: device.device_id,
          lastSyncAt: new Date(),
        },
      });

      await prisma.observiumSyncLog.create({
        data: {
          assetId: newAsset.id,
          observiumDeviceId: device.device_id,
          syncType: 'create',
          syncStatus: 'success',
          changes: {
            serialNumber,
            hostname: device.hostname,
          },
        },
      });

      stats.created++;
      logger.info(`Created new asset: ${device.hostname} (${serialNumber})`);
    }
  }
}

// Export singleton instance
const observiumService = new ObserviumService();

export const syncObserviumDevices = () => observiumService.syncDevices();
export const fetchObserviumDevices = () => observiumService.fetchDevices();

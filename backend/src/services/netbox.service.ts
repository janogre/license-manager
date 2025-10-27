import axios from 'axios';
import { prisma } from '../index';
import { logger } from '../utils/logger';

interface NetboxSite {
  id: number;
  name: string;
  slug: string;
  description?: string;
  status: {
    value: string;
    label: string;
  };
  region?: {
    id: number;
    name: string;
  };
  tenant?: {
    id: number;
    name: string;
  };
}

interface NetboxLocation {
  id: number;
  name: string;
  slug: string;
  site: {
    id: number;
    name: string;
    slug: string;
  };
  parent?: {
    id: number;
    name: string;
  };
  description?: string;
}

interface NetboxRack {
  id: number;
  name: string;
  site: {
    id: number;
    name: string;
    slug: string;
  };
  location?: {
    id: number;
    name: string;
  };
  status: {
    value: string;
    label: string;
  };
  u_height: number;
  desc_units: boolean;
  outer_width?: number;
  outer_depth?: number;
  outer_unit?: string;
}

interface NetboxDevice {
  id: number;
  name: string;
  device_type: {
    id: number;
    manufacturer: {
      name: string;
    };
    model: string;
  };
  device_role: {
    name: string;
  };
  site: {
    id: number;
    name: string;
    slug: string;
  };
  location?: {
    id: number;
    name: string;
  };
  rack?: {
    id: number;
    name: string;
  };
  position?: number;
  face?: {
    value: string;
    label: string;
  };
  status: {
    value: string;
    label: string;
  };
  serial?: string;
  asset_tag?: string;
}

interface RackElevation {
  id: number;
  name: string;
  height: number;
  units: RackUnit[];
}

interface RackUnit {
  id: number;
  name: string;
  position: number;
  device?: {
    id: number;
    name: string;
    display: string;
  };
  occupied: boolean;
}

export class NetboxService {
  private baseUrl: string;
  private apiToken: string;
  private enabled: boolean;

  constructor() {
    this.baseUrl = process.env.NETBOX_URL || '';
    this.apiToken = process.env.NETBOX_API_TOKEN || '';
    this.enabled = process.env.NETBOX_ENABLED === 'true';
  }

  private getHeaders() {
    return {
      'Authorization': `Token ${this.apiToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  /**
   * Fetch all sites from Netbox
   */
  async getSites(): Promise<NetboxSite[]> {
    if (!this.enabled) {
      logger.warn('Netbox integration is disabled');
      return [];
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/api/dcim/sites/`,
        {
          headers: this.getHeaders(),
          params: {
            limit: 0, // Get all results
          },
        }
      );

      return response.data.results || [];
    } catch (error: any) {
      logger.error('Failed to fetch sites from Netbox:', error.message);
      throw new Error(`Netbox API error: ${error.message}`);
    }
  }

  /**
   * Fetch locations for a specific site
   */
  async getLocations(siteSlug?: string): Promise<NetboxLocation[]> {
    if (!this.enabled) {
      return [];
    }

    try {
      const params: any = { limit: 0 };
      if (siteSlug) {
        params.site = siteSlug;
      }

      const response = await axios.get(
        `${this.baseUrl}/api/dcim/locations/`,
        {
          headers: this.getHeaders(),
          params,
        }
      );

      return response.data.results || [];
    } catch (error: any) {
      logger.error('Failed to fetch locations from Netbox:', error.message);
      return [];
    }
  }

  /**
   * Fetch racks from Netbox
   */
  async getRacks(siteSlug?: string, locationId?: number): Promise<NetboxRack[]> {
    if (!this.enabled) {
      return [];
    }

    try {
      const params: any = { limit: 0 };
      if (siteSlug) {
        params.site = siteSlug;
      }
      if (locationId) {
        params.location_id = locationId;
      }

      const response = await axios.get(
        `${this.baseUrl}/api/dcim/racks/`,
        {
          headers: this.getHeaders(),
          params,
        }
      );

      return response.data.results || [];
    } catch (error: any) {
      logger.error('Failed to fetch racks from Netbox:', error.message);
      return [];
    }
  }

  /**
   * Fetch rack elevation (visual representation)
   */
  async getRackElevation(rackId: number): Promise<RackElevation | null> {
    if (!this.enabled) {
      return null;
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/api/dcim/racks/${rackId}/elevation/`,
        {
          headers: this.getHeaders(),
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error(`Failed to fetch rack elevation for rack ${rackId}:`, error.message);
      return null;
    }
  }

  /**
   * Fetch devices from Netbox
   */
  async getDevices(siteSlug?: string, manufacturer?: string): Promise<NetboxDevice[]> {
    if (!this.enabled) {
      return [];
    }

    try {
      const params: any = { limit: 0 };
      if (siteSlug) {
        params.site = siteSlug;
      }
      if (manufacturer) {
        params.manufacturer = manufacturer;
      }

      const response = await axios.get(
        `${this.baseUrl}/api/dcim/devices/`,
        {
          headers: this.getHeaders(),
          params,
        }
      );

      return response.data.results || [];
    } catch (error: any) {
      logger.error('Failed to fetch devices from Netbox:', error.message);
      return [];
    }
  }

  /**
   * Get available rack units (empty positions)
   */
  async getAvailableRackUnits(rackId: number): Promise<number[]> {
    const elevation = await this.getRackElevation(rackId);
    if (!elevation) {
      return [];
    }

    return elevation.units
      .filter(unit => !unit.occupied)
      .map(unit => unit.position);
  }

  /**
   * Sync Netbox data to local database (cache)
   */
  async syncNetboxData(): Promise<{ sites: number; locations: number; racks: number }> {
    const stats = { sites: 0, locations: 0, racks: 0 };

    try {
      logger.info('Starting Netbox sync...');

      // Sync sites
      const sites = await this.getSites();
      stats.sites = sites.length;
      logger.info(`Fetched ${sites.length} sites from Netbox`);

      // Sync locations
      const locations = await this.getLocations();
      stats.locations = locations.length;
      logger.info(`Fetched ${locations.length} locations from Netbox`);

      // Sync racks
      const racks = await this.getRacks();
      stats.racks = racks.length;
      logger.info(`Fetched ${racks.length} racks from Netbox`);

      logger.info('Netbox sync completed', stats);
      return stats;
    } catch (error: any) {
      logger.error('Netbox sync failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
const netboxService = new NetboxService();

export const syncNetboxData = () => netboxService.syncNetboxData();
export const getNetboxSites = () => netboxService.getSites();
export const getNetboxLocations = (siteSlug?: string) => netboxService.getLocations(siteSlug);
export const getNetboxRacks = (siteSlug?: string, locationId?: number) =>
  netboxService.getRacks(siteSlug, locationId);
export const getNetboxRackElevation = (rackId: number) =>
  netboxService.getRackElevation(rackId);
export const getNetboxDevices = (siteSlug?: string) =>
  netboxService.getDevices(siteSlug, 'Juniper');

import XLSX from 'xlsx';
import { prisma } from '../index';
import path from 'path';

interface NLogicRow {
  __EMPTY: string;
  Varenummer: string;
  Modell: string;
  Serienummer: string;
  Produkttype: string;
  ANT: number;
  'Til dato': number;
  ' Juniper GPL USD ': number;
  Rabatt: number;
  'USD PRICE': number;
  'NOK PRICE': number;
  Lokasjon: string;
  Kommentar: string;
  'Erstatter S/N': string;
  RENEW: string;
  'RNW QTY': number;
  'RNW Interval': number;
  'Start Date': number;
  'RNW to': number;
  Days: number;
  ' Juniper RNW GPL ': number;
  'USD RNW PRICE': number;
  ' NOK RNW PRICE ': number;
}

interface ValidationResult {
  summary: {
    totalNLogic: number;
    totalNEAS: number;
    matched: number;
    onlyInNLogic: number;
    onlyInNEAS: number;
    differences: number;
    missingContracts: number;
    contractDateMismatches: number;
  };
  onlyInNLogic: NLogicAsset[];
  onlyInNEAS: NEASAsset[];
  differences: AssetDifference[];
  contractIssues: ContractIssue[];
}

interface NLogicAsset {
  contractNumber: string;
  serialNumber: string;
  model: string;
  partNumber: string;
  productType: string;
  location: string;
  renew: string;
  renewalPrice: number;
  startDate: Date | null;
  endDate: Date | null;
  comment: string;
}

interface NEASAsset {
  id: string;
  serialNumber: string;
  model: string;
  assetTag: string | null;
  hostname: string | null;
  location: string | null;
  status: string;
  purchaseDate: Date | null;
}

interface AssetDifference {
  serialNumber: string;
  nlogic: NLogicAsset;
  neas: NEASAsset;
  differences: {
    field: string;
    nlogicValue: any;
    neasValue: any;
  }[];
}

interface ContractIssue {
  serialNumber: string;
  assetId: string;
  model: string;
  issue: 'missing' | 'date_mismatch';
  nlogicEndDate: Date | null;
  nlogicRenewalPrice: number;
  currentContract?: {
    id: string;
    endDate: Date;
    annualCost: number | null;
  };
}

class ValidationService {
  /**
   * Parse nLogic Excel file and extract hardware assets
   */
  parseNLogicFile(filePath: string): NLogicAsset[] {
    const workbook = XLSX.readFile(filePath);
    const sheetName = 'nLogic 2025';

    if (!workbook.SheetNames.includes(sheetName)) {
      throw new Error(`Sheet "${sheetName}" not found in nLogic file`);
    }

    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json<NLogicRow>(sheet, { defval: '' });

    // Filter and transform data
    const assets: NLogicAsset[] = rawData
      .filter((row) => row.Serienummer && row.Serienummer.trim() !== '')
      .map((row) => ({
        contractNumber: String(row.Varenummer || '').trim(), // Contract name/number from column A
        serialNumber: String(row.Serienummer).trim(),
        model: String(row.Modell || '').trim(),
        partNumber: String(row.__EMPTY || '').trim(), // Part number from column B
        productType: String(row.Produkttype || '').toLowerCase(),
        location: String(row.Lokasjon || '').trim(),
        renew: String(row.RENEW || '').toUpperCase(),
        renewalPrice: Number(row[' NOK RNW PRICE ']) || 0,
        startDate: this.parseExcelDate(row['Start Date']),
        endDate: this.parseExcelDate(row['RNW to']),
        comment: String(row.Kommentar || '').trim(),
      }));

    return assets;
  }

  /**
   * Parse Excel date number to JavaScript Date
   */
  private parseExcelDate(excelDate: number | string): Date | null {
    if (!excelDate || excelDate === '') return null;

    const numDate = Number(excelDate);
    if (isNaN(numDate)) return null;

    // Excel dates are days since 1900-01-01 (with a leap year bug)
    const excelEpoch = new Date(1900, 0, 1);
    const date = new Date(excelEpoch.getTime() + (numDate - 2) * 24 * 60 * 60 * 1000);
    return date;
  }

  /**
   * Get all hardware assets and licenses from NEAS database
   */
  async getNEASAssets(): Promise<NEASAsset[]> {
    // Get hardware assets
    const assets = await prisma.hardwareAsset.findMany({
      include: {
        model: true,
        location: true,
      },
    });

    const hardwareAssets = assets.map((asset) => ({
      id: asset.id,
      serialNumber: asset.serialNumber,
      model: asset.model?.modelName || '',
      assetTag: asset.assetTag,
      hostname: asset.hostname,
      location: asset.location?.name || null,
      status: asset.status,
      purchaseDate: asset.purchaseDate,
    }));

    // Get licenses
    const licenses = await prisma.license.findMany();

    const licenseAssets = licenses.map((license) => ({
      id: license.id,
      serialNumber: license.licenseKey || '',
      model: license.softwareProduct,
      assetTag: null,
      hostname: null,
      location: null,
      status: license.isActive ? 'ACTIVE' : 'INACTIVE',
      purchaseDate: license.purchaseDate,
    })).filter(l => l.serialNumber); // Only include licenses with licenseKey

    // Combine both
    return [...hardwareAssets, ...licenseAssets];
  }

  /**
   * Compare nLogic data with NEAS data
   */
  async compareData(nlogicFilePath: string): Promise<ValidationResult> {
    // Parse nLogic file
    const nlogicAssets = this.parseNLogicFile(nlogicFilePath);

    // Get NEAS assets
    const neasAssets = await this.getNEASAssets();

    // Create maps for easy lookup
    const nlogicMap = new Map<string, NLogicAsset>();
    const neasMap = new Map<string, NEASAsset>();

    nlogicAssets.forEach((asset) => {
      nlogicMap.set(asset.serialNumber.toUpperCase(), asset);
    });

    neasAssets.forEach((asset) => {
      neasMap.set(asset.serialNumber.toUpperCase(), asset);
    });

    // Find matches and differences
    const matched: string[] = [];
    const differences: AssetDifference[] = [];
    const onlyInNLogic: NLogicAsset[] = [];
    const onlyInNEAS: NEASAsset[] = [];

    // Check nLogic assets
    nlogicAssets.forEach((nlogicAsset) => {
      const serialUpper = nlogicAsset.serialNumber.toUpperCase();
      const neasAsset = neasMap.get(serialUpper);

      if (neasAsset) {
        matched.push(serialUpper);

        // Check for differences
        const diffs: AssetDifference['differences'] = [];

        // Compare model
        if (nlogicAsset.model && neasAsset.model &&
            nlogicAsset.model.toLowerCase() !== neasAsset.model.toLowerCase()) {
          diffs.push({
            field: 'model',
            nlogicValue: nlogicAsset.model,
            neasValue: neasAsset.model,
          });
        }

        // Compare location (if nLogic has location data)
        if (nlogicAsset.location && neasAsset.location &&
            nlogicAsset.location.toLowerCase() !== neasAsset.location.toLowerCase()) {
          diffs.push({
            field: 'location',
            nlogicValue: nlogicAsset.location,
            neasValue: neasAsset.location,
          });
        }

        if (diffs.length > 0) {
          differences.push({
            serialNumber: nlogicAsset.serialNumber,
            nlogic: nlogicAsset,
            neas: neasAsset,
            differences: diffs,
          });
        }
      } else {
        onlyInNLogic.push(nlogicAsset);
      }
    });

    // Check NEAS assets that are not in nLogic
    neasAssets.forEach((neasAsset) => {
      const serialUpper = neasAsset.serialNumber.toUpperCase();
      if (!nlogicMap.has(serialUpper)) {
        onlyInNEAS.push(neasAsset);
      }
    });

    // Check maintenance contracts
    const contractIssues = await this.checkMaintenanceContracts(nlogicAssets, neasAssets);

    return {
      summary: {
        totalNLogic: nlogicAssets.length,
        totalNEAS: neasAssets.length,
        matched: matched.length - differences.length,
        onlyInNLogic: onlyInNLogic.length,
        onlyInNEAS: onlyInNEAS.length,
        differences: differences.length,
        missingContracts: contractIssues.filter(c => c.issue === 'missing').length,
        contractDateMismatches: contractIssues.filter(c => c.issue === 'date_mismatch').length,
      },
      onlyInNLogic,
      onlyInNEAS,
      differences,
      contractIssues,
    };
  }

  /**
   * Check maintenance contracts for matched assets
   */
  async checkMaintenanceContracts(
    nlogicAssets: NLogicAsset[],
    neasAssets: NEASAsset[]
  ): Promise<ContractIssue[]> {
    const issues: ContractIssue[] = [];

    // Create map of nLogic assets by serial number
    const nlogicMap = new Map<string, NLogicAsset>();
    nlogicAssets.forEach((asset) => {
      nlogicMap.set(asset.serialNumber.toUpperCase(), asset);
    });

    // For each NEAS asset that exists in nLogic, check contract
    for (const neasAsset of neasAssets) {
      const serialUpper = neasAsset.serialNumber.toUpperCase();
      const nlogicAsset = nlogicMap.get(serialUpper);

      if (!nlogicAsset || !nlogicAsset.endDate) {
        // Skip if not in nLogic or no end date in nLogic
        continue;
      }

      // Determine if this is a license or hardware based on product type
      // Check for both "lisens" (Norwegian) and "lic" (abbreviation used in nLogic)
      const productTypeLower = nlogicAsset.productType.toLowerCase();
      const isLicense = productTypeLower.includes('lisens') ||
                        productTypeLower.includes('lic/sub') ||
                        productTypeLower.startsWith('lic');

      // Get contracts for this asset (check both hardware and license mappings)
      let contracts: any[] = [];

      if (isLicense) {
        contracts = await prisma.licenseContractMapping.findMany({
          where: {
            licenseId: neasAsset.id,
            status: 'active',
          },
          include: {
            contract: true,
          },
          orderBy: {
            coverageEnd: 'desc',
          },
          take: 1,
        });
      } else {
        contracts = await prisma.assetContractMapping.findMany({
          where: {
            assetId: neasAsset.id,
            status: 'active',
          },
          include: {
            contract: true,
          },
          orderBy: {
            coverageEnd: 'desc',
          },
          take: 1,
        });
      }

      if (contracts.length === 0) {
        // Asset has no contract in NEAS
        issues.push({
          serialNumber: neasAsset.serialNumber,
          assetId: neasAsset.id,
          model: neasAsset.model,
          issue: 'missing',
          nlogicEndDate: nlogicAsset.endDate,
          nlogicRenewalPrice: nlogicAsset.renewalPrice,
        });
      } else {
        // Check if end date or cost matches
        const contract = contracts[0];
        const nlogicEndDate = nlogicAsset.endDate;
        const neasEndDate = new Date(contract.coverageEnd);

        // Compare dates (ignoring time)
        const nlogicDateStr = nlogicEndDate.toISOString().split('T')[0];
        const neasDateStr = neasEndDate.toISOString().split('T')[0];

        const dateMismatch = nlogicDateStr !== neasDateStr;

        // Get per-asset/license cost from the mapping (if exists), otherwise calculate from total
        const perAssetCost = isLicense
          ? (contract.licenseCost ? Number(contract.licenseCost) : (contract.contract.annualCost ? Number(contract.contract.annualCost) : 0))
          : (contract.assetCost ? Number(contract.assetCost) : (contract.contract.annualCost ? Number(contract.contract.annualCost) : 0));

        // Round both values to 2 decimal places to avoid floating point comparison issues
        const roundedPerAssetCost = Math.round(perAssetCost * 100) / 100;
        const roundedNlogicPrice = Math.round(nlogicAsset.renewalPrice * 100) / 100;

        // Compare per-asset cost with nLogic renewal price (allow 1 kr difference for rounding)
        const costMismatch = Math.abs(roundedPerAssetCost - roundedNlogicPrice) > 1;

        if (dateMismatch || costMismatch) {
          issues.push({
            serialNumber: neasAsset.serialNumber,
            assetId: neasAsset.id,
            model: neasAsset.model,
            issue: 'date_mismatch', // We keep the same issue type for now, but it covers both
            nlogicEndDate: nlogicAsset.endDate,
            nlogicRenewalPrice: nlogicAsset.renewalPrice,
            currentContract: {
              id: contract.contractId,
              endDate: neasEndDate,
              annualCost: perAssetCost, // Show per-asset cost, not total
            },
          });
        }
      }
    }

    return issues;
  }

  /**
   * Import an asset from nLogic into NEAS database
   */
  async importFromNLogic(serialNumber: string, nlogicFilePath: string): Promise<any> {
    const nlogicAssets = this.parseNLogicFile(nlogicFilePath);
    const asset = nlogicAssets.find(
      (a) => a.serialNumber.toUpperCase() === serialNumber.toUpperCase()
    );

    if (!asset) {
      throw new Error(`Asset with serial number ${serialNumber} not found in nLogic file`);
    }

    // Find or create model
    let model = await prisma.hardwareModel.findFirst({
      where: {
        modelName: {
          equals: asset.model,
          mode: 'insensitive',
        },
      },
    });

    if (!model) {
      // Create new model
      model = await prisma.hardwareModel.create({
        data: {
          manufacturer: 'Juniper Networks',
          modelName: asset.model,
          modelType: 'ROUTER', // Default, can be updated later
          isActive: true,
        },
      });
    }

    // Find or create location if specified
    let locationId: string | null = null;
    if (asset.location) {
      let location = await prisma.location.findFirst({
        where: {
          name: {
            equals: asset.location,
            mode: 'insensitive',
          },
        },
      });

      if (!location) {
        location = await prisma.location.create({
          data: {
            name: asset.location,
            isActive: true,
          },
        });
      }

      locationId = location.id;
    }

    // Create hardware asset
    const newAsset = await prisma.hardwareAsset.create({
      data: {
        modelId: model.id,
        serialNumber: asset.serialNumber,
        locationId,
        status: 'ACTIVE',
        notes: asset.comment || `Imported from nLogic on ${new Date().toLocaleDateString()}`,
      },
      include: {
        model: true,
        location: true,
      },
    });

    return newAsset;
  }

  /**
   * Update NEAS asset with data from nLogic
   */
  async updateFromNLogic(
    assetId: string,
    serialNumber: string,
    nlogicFilePath: string,
    fieldsToUpdate: string[]
  ): Promise<any> {
    const nlogicAssets = this.parseNLogicFile(nlogicFilePath);
    const nlogicAsset = nlogicAssets.find(
      (a) => a.serialNumber.toUpperCase() === serialNumber.toUpperCase()
    );

    if (!nlogicAsset) {
      throw new Error(`Asset with serial number ${serialNumber} not found in nLogic file`);
    }

    const updateData: any = {};

    // Update model if requested
    if (fieldsToUpdate.includes('model') && nlogicAsset.model) {
      let model = await prisma.hardwareModel.findFirst({
        where: {
          modelName: {
            equals: nlogicAsset.model,
            mode: 'insensitive',
          },
        },
      });

      if (!model) {
        model = await prisma.hardwareModel.create({
          data: {
            manufacturer: 'Juniper Networks',
            modelName: nlogicAsset.model,
            modelType: 'ROUTER',
            isActive: true,
          },
        });
      }

      updateData.modelId = model.id;
    }

    // Update location if requested
    if (fieldsToUpdate.includes('location') && nlogicAsset.location) {
      let location = await prisma.location.findFirst({
        where: {
          name: {
            equals: nlogicAsset.location,
            mode: 'insensitive',
          },
        },
      });

      if (!location) {
        location = await prisma.location.create({
          data: {
            name: nlogicAsset.location,
            isActive: true,
          },
        });
      }

      updateData.locationId = location.id;
    }

    // Update asset
    const updatedAsset = await prisma.hardwareAsset.update({
      where: { id: assetId },
      data: updateData,
      include: {
        model: true,
        location: true,
      },
    });

    return updatedAsset;
  }

  /**
   * Sync maintenance contract from nLogic for a specific asset
   */
  async syncContractFromNLogic(
    assetId: string,
    serialNumber: string,
    nlogicFilePath: string
  ): Promise<any> {
    const nlogicAssets = this.parseNLogicFile(nlogicFilePath);
    const nlogicAsset = nlogicAssets.find(
      (a) => a.serialNumber.toUpperCase() === serialNumber.toUpperCase()
    );

    if (!nlogicAsset) {
      throw new Error(`Asset with serial number ${serialNumber} not found in nLogic file`);
    }

    if (!nlogicAsset.endDate) {
      throw new Error(`No contract end date found for asset ${serialNumber} in nLogic file`);
    }

    // Determine if this is a license or hardware asset
    // Check for both "lisens" (Norwegian) and "lic" (abbreviation used in nLogic)
    const productTypeLower = nlogicAsset.productType.toLowerCase();
    const isLicense = productTypeLower.includes('lisens') ||
                      productTypeLower.includes('lic/sub') ||
                      productTypeLower.startsWith('lic');

    // Check if this is actually a license
    let existingMapping;
    if (isLicense) {
      existingMapping = await prisma.licenseContractMapping.findFirst({
        where: {
          licenseId: assetId,
          status: 'active',
        },
        include: {
          contract: true,
        },
        orderBy: {
          coverageEnd: 'desc',
        },
      });
    } else {
      existingMapping = await prisma.assetContractMapping.findFirst({
        where: {
          assetId: assetId,
          status: 'active',
        },
        include: {
          contract: true,
        },
        orderBy: {
          coverageEnd: 'desc',
        },
      });
    }

    if (existingMapping) {
      // Get all assets/licenses under this contract to calculate total cost
      const hardwareMappings = await prisma.assetContractMapping.findMany({
        where: {
          contractId: existingMapping.contractId,
          status: 'active',
        },
      });

      const licenseMappings = await prisma.licenseContractMapping.findMany({
        where: {
          contractId: existingMapping.contractId,
          status: 'active',
        },
      });

      // Calculate new total cost by summing all nLogic renewal prices
      let totalCost = 0;

      // Sum hardware assets
      for (const mapping of hardwareMappings) {
        const neasAssetForMapping = await prisma.hardwareAsset.findUnique({
          where: { id: mapping.assetId },
        });

        if (neasAssetForMapping) {
          const nlogicAssetForMapping = nlogicAssets.find(
            (a) => a.serialNumber.toUpperCase() === neasAssetForMapping.serialNumber.toUpperCase()
          );
          if (nlogicAssetForMapping && nlogicAssetForMapping.renewalPrice) {
            totalCost += nlogicAssetForMapping.renewalPrice;
          }
        }
      }

      // Sum licenses
      for (const mapping of licenseMappings) {
        const neasLicenseForMapping = await prisma.license.findUnique({
          where: { id: mapping.licenseId },
        });

        if (neasLicenseForMapping) {
          const nlogicAssetForMapping = nlogicAssets.find(
            (a) => a.serialNumber.toUpperCase() === (neasLicenseForMapping.licenseKey || '').toUpperCase()
          );
          if (nlogicAssetForMapping && nlogicAssetForMapping.renewalPrice) {
            totalCost += nlogicAssetForMapping.renewalPrice;
          }
        }
      }

      // Round to nearest whole number to avoid floating point precision issues
      totalCost = Math.round(totalCost);

      // Update existing contract with total cost
      const updatedContract = await prisma.maintenanceContract.update({
        where: { id: existingMapping.contractId },
        data: {
          annualCost: totalCost,
          endDate: nlogicAsset.endDate,
        },
      });

      // Update the mapping with coverage end date and per-asset/license cost
      if (isLicense) {
        await prisma.licenseContractMapping.update({
          where: { id: existingMapping.id },
          data: {
            coverageEnd: nlogicAsset.endDate,
            licenseCost: nlogicAsset.renewalPrice,
          },
        });
      } else {
        await prisma.assetContractMapping.update({
          where: { id: existingMapping.id },
          data: {
            coverageEnd: nlogicAsset.endDate,
            assetCost: nlogicAsset.renewalPrice,
          },
        });
      }

      return {
        action: 'updated',
        contract: updatedContract,
        totalCost,
        assetsInContract: hardwareMappings.length + licenseMappings.length,
      };
    } else {
      // Use contract number from nLogic file, or generate one if not available
      let contractNumber = nlogicAsset.contractNumber?.trim();

      if (!contractNumber) {
        // Generate a unique contract number if not provided
        // Format: AUTO-YYYYMMDD-XXXXX (where XXXXX is a random 5-digit number)
        const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const random = Math.floor(10000 + Math.random() * 90000);
        contractNumber = `AUTO-${timestamp}-${random}`;
      }

      // Check if a contract with this number already exists
      let existingContract = await prisma.maintenanceContract.findUnique({
        where: { contractNumber },
      });

      let newContract;
      if (existingContract) {
        // Contract exists, use it
        newContract = existingContract;
      } else {
        // Determine contract category based on product type
        // Check for both "lisens" (Norwegian) and "lic" (abbreviation used in nLogic)
        const productTypeLower = nlogicAsset.productType.toLowerCase();
        const category = (productTypeLower.includes('lisens') ||
                         productTypeLower.includes('lic/sub') ||
                         productTypeLower.startsWith('lic'))
          ? 'LICENSE'
          : 'HARDWARE';

        // Create new contract
        newContract = await prisma.maintenanceContract.create({
          data: {
            contractNumber,
            vendor: 'Juniper Networks',
            contractType: 'NLOGIC',
            category,
            startDate: nlogicAsset.startDate || new Date(),
            endDate: nlogicAsset.endDate,
            annualCost: nlogicAsset.renewalPrice,
            autoRenewal: false,
            isActive: true,
          },
        });
      }

      // Create asset-contract or license-contract mapping with per-asset cost
      let mapping;
      if (isLicense) {
        mapping = await prisma.licenseContractMapping.create({
          data: {
            licenseId: assetId,
            contractId: newContract.id,
            coverageStart: nlogicAsset.startDate || new Date(),
            coverageEnd: nlogicAsset.endDate,
            licenseCost: nlogicAsset.renewalPrice,
            status: 'active',
          },
        });
      } else {
        mapping = await prisma.assetContractMapping.create({
          data: {
            assetId: assetId,
            contractId: newContract.id,
            coverageStart: nlogicAsset.startDate || new Date(),
            coverageEnd: nlogicAsset.endDate,
            assetCost: nlogicAsset.renewalPrice,
            status: 'active',
          },
        });
      }

      // After creating the mapping, recalculate total contract cost
      // Get all active mappings for this contract (both hardware and license)
      const hardwareMappings = await prisma.assetContractMapping.findMany({
        where: {
          contractId: newContract.id,
          status: 'active',
        },
      });

      const licenseMappings = await prisma.licenseContractMapping.findMany({
        where: {
          contractId: newContract.id,
          status: 'active',
        },
      });

      // Calculate total cost by summing all asset/license costs
      let totalCost = 0;
      for (const contractMapping of hardwareMappings) {
        if (contractMapping.assetCost) {
          totalCost += Number(contractMapping.assetCost);
        }
      }
      for (const licenseMapping of licenseMappings) {
        if (licenseMapping.licenseCost) {
          totalCost += Number(licenseMapping.licenseCost);
        }
      }

      // Round to nearest whole number
      totalCost = Math.round(totalCost);

      // Update contract with correct total cost
      const updatedContract = await prisma.maintenanceContract.update({
        where: { id: newContract.id },
        data: {
          annualCost: totalCost,
        },
      });

      return {
        action: 'created',
        contract: updatedContract,
        mapping: mapping,
        totalCost,
        assetsInContract: hardwareMappings.length + licenseMappings.length,
      };
    }
  }
}

export const validationService = new ValidationService();

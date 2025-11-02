import { Request, Response } from 'express';
import { validationService } from '../services/validation.service';
import path from 'path';
import fs from 'fs';

/**
 * Upload nLogic file and store temporarily
 */
export const uploadFile = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const uploadedFilePath = req.file.path;

    // Store the file path in a temporary location or session
    // For simplicity, we'll return the path to be used in subsequent requests
    res.json({
      success: true,
      message: 'File uploaded successfully',
      filePath: uploadedFilePath,
      fileName: req.file.originalname,
    });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      error: 'Failed to upload file',
      details: error.message
    });
  }
};

/**
 * Compare NEAS data with nLogic data from uploaded file
 */
export const compareData = async (req: Request, res: Response) => {
  try {
    // Check if file was uploaded
    let nlogicFilePath: string;

    if (req.file) {
      // Use uploaded file
      nlogicFilePath = req.file.path;
    } else if (req.body.filePath) {
      // Use previously uploaded file path
      nlogicFilePath = req.body.filePath;
    } else {
      // Fallback to default file
      nlogicFilePath = path.join(__dirname, '../../data/20250318 nLogic - NEAS - Juniper Service Renewal hele 2025.xlsx');

      // Check if default file exists
      if (!fs.existsSync(nlogicFilePath)) {
        return res.status(400).json({
          error: 'No nLogic file found. Please upload a file first.',
        });
      }
    }

    const result = await validationService.compareData(nlogicFilePath);

    // Clean up temporary file if it was uploaded
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('Error deleting temporary file:', err);
      }
    }

    res.json(result);
  } catch (error: any) {
    console.error('Error comparing data:', error);

    // Clean up temporary file on error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('Error deleting temporary file:', err);
      }
    }

    res.status(500).json({
      error: 'Failed to compare data',
      details: error.message
    });
  }
};

/**
 * Import asset from nLogic into NEAS database
 */
export const importFromNLogic = async (req: Request, res: Response) => {
  try {
    const { serialNumber, filePath } = req.body;

    if (!serialNumber) {
      return res.status(400).json({ error: 'Serial number is required' });
    }

    let nlogicFilePath: string;

    if (req.file) {
      nlogicFilePath = req.file.path;
    } else if (filePath) {
      nlogicFilePath = filePath;
    } else {
      nlogicFilePath = path.join(__dirname, '../../data/20250318 nLogic - NEAS - Juniper Service Renewal hele 2025.xlsx');
    }

    const newAsset = await validationService.importFromNLogic(serialNumber, nlogicFilePath);

    // Clean up temporary file if uploaded
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('Error deleting temporary file:', err);
      }
    }

    res.json({
      success: true,
      message: 'Asset imported successfully',
      asset: newAsset
    });
  } catch (error: any) {
    console.error('Error importing asset:', error);

    // Clean up temporary file on error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('Error deleting temporary file:', err);
      }
    }

    res.status(500).json({
      error: 'Failed to import asset',
      details: error.message
    });
  }
};

/**
 * Update NEAS asset with data from nLogic
 */
export const updateFromNLogic = async (req: Request, res: Response) => {
  try {
    const { assetId, serialNumber, fieldsToUpdate, filePath } = req.body;

    if (!assetId || !serialNumber || !fieldsToUpdate || !Array.isArray(fieldsToUpdate)) {
      return res.status(400).json({
        error: 'Asset ID, serial number, and fields to update are required'
      });
    }

    let nlogicFilePath: string;

    if (req.file) {
      nlogicFilePath = req.file.path;
    } else if (filePath) {
      nlogicFilePath = filePath;
    } else {
      nlogicFilePath = path.join(__dirname, '../../data/20250318 nLogic - NEAS - Juniper Service Renewal hele 2025.xlsx');
    }

    const updatedAsset = await validationService.updateFromNLogic(
      assetId,
      serialNumber,
      nlogicFilePath,
      fieldsToUpdate
    );

    // Clean up temporary file if uploaded
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('Error deleting temporary file:', err);
      }
    }

    res.json({
      success: true,
      message: 'Asset updated successfully',
      asset: updatedAsset
    });
  } catch (error: any) {
    console.error('Error updating asset:', error);

    // Clean up temporary file on error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('Error deleting temporary file:', err);
      }
    }

    res.status(500).json({
      error: 'Failed to update asset',
      details: error.message
    });
  }
};

/**
 * Bulk import multiple assets from nLogic
 */
export const bulkImportFromNLogic = async (req: Request, res: Response) => {
  try {
    const { serialNumbers, filePath } = req.body;

    if (!serialNumbers || !Array.isArray(serialNumbers)) {
      return res.status(400).json({ error: 'Serial numbers array is required' });
    }

    let nlogicFilePath: string;

    if (req.file) {
      nlogicFilePath = req.file.path;
    } else if (filePath) {
      nlogicFilePath = filePath;
    } else {
      nlogicFilePath = path.join(__dirname, '../../data/20250318 nLogic - NEAS - Juniper Service Renewal hele 2025.xlsx');
    }

    const results = {
      imported: [] as any[],
      failed: [] as any[],
    };

    for (const serialNumber of serialNumbers) {
      try {
        const newAsset = await validationService.importFromNLogic(serialNumber, nlogicFilePath);
        results.imported.push({ serialNumber, asset: newAsset });
      } catch (error: any) {
        results.failed.push({ serialNumber, error: error.message });
      }
    }

    // Clean up temporary file if uploaded
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('Error deleting temporary file:', err);
      }
    }

    res.json({
      success: true,
      message: `Imported ${results.imported.length} of ${serialNumbers.length} assets`,
      results
    });
  } catch (error: any) {
    console.error('Error bulk importing assets:', error);

    // Clean up temporary file on error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('Error deleting temporary file:', err);
      }
    }

    res.status(500).json({
      error: 'Failed to bulk import assets',
      details: error.message
    });
  }
};

/**
 * Sync maintenance contract from nLogic for a specific asset
 */
export const syncContractFromNLogic = async (req: Request, res: Response) => {
  try {
    const { assetId, serialNumber, filePath } = req.body;

    if (!assetId || !serialNumber) {
      return res.status(400).json({
        error: 'Asset ID and serial number are required'
      });
    }

    let nlogicFilePath: string;

    if (req.file) {
      nlogicFilePath = req.file.path;
    } else if (filePath) {
      nlogicFilePath = filePath;
    } else {
      nlogicFilePath = path.join(__dirname, '../../data/20250318 nLogic - NEAS - Juniper Service Renewal hele 2025.xlsx');
    }

    const result = await validationService.syncContractFromNLogic(
      assetId,
      serialNumber,
      nlogicFilePath
    );

    // Clean up temporary file if uploaded
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('Error deleting temporary file:', err);
      }
    }

    res.json({
      success: true,
      message: 'Contract synced successfully',
      result
    });
  } catch (error: any) {
    console.error('Error syncing contract:', error);

    // Clean up temporary file on error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('Error deleting temporary file:', err);
      }
    }

    res.status(500).json({
      error: 'Failed to sync contract',
      details: error.message
    });
  }
};

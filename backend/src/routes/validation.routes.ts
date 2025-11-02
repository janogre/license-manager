import { Router } from 'express';
import multer from 'multer';
import * as validationController from '../controllers/validation.controller';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Accept Excel files only
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Upload nLogic file
router.post('/upload', upload.single('file'), validationController.uploadFile);

// Get validation/comparison results (accepts uploaded file or uses default)
router.post('/compare', upload.single('file'), validationController.compareData);

// Import single asset from nLogic
router.post('/import', upload.single('file'), validationController.importFromNLogic);

// Update NEAS asset with nLogic data
router.put('/update', upload.single('file'), validationController.updateFromNLogic);

// Bulk import multiple assets
router.post('/bulk-import', upload.single('file'), validationController.bulkImportFromNLogic);

// Sync maintenance contract from nLogic
router.post('/sync-contract', upload.single('file'), validationController.syncContractFromNLogic);

export default router;

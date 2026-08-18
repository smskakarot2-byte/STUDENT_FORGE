import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { config } from '../config/index.js';

// Ensure upload directory exists
if (!fs.existsSync(config.storagePath)) {
  fs.mkdirSync(config.storagePath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const date = new Date();
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    const uploadDir = path.join(config.storagePath, year, month);
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    const safeName = `${uniqueId}${ext}`;
    cb(null, safeName);
  },
});

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedMimes = config.allowedMimeTypes.filter(m => m.length > 0);
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.maxFileSize,
  },
});

export const getFilePath = (storedName: string, year: string, month: string): string => {
  return path.join(config.storagePath, year, month, storedName);
};

export const deleteFile = async (filePath: string): Promise<void> => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};

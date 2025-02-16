import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
const filesDir = path.join(uploadsDir, 'files');
const profilePicsDir = path.join(uploadsDir, 'profile-pictures');

// Create necessary directories
const createDirIfNotExists = async (dir) => {
    try {
        await fs.access(dir);
    } catch {
        await fs.mkdir(dir, { recursive: true });
    }
};

// Initialize directories
await createDirIfNotExists(uploadsDir);
await createDirIfNotExists(filesDir);
await createDirIfNotExists(profilePicsDir);

// Configure storage for regular files
const fileStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, filesDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// Configure storage for profile pictures
const profilePictureStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, profilePicsDir);
    },
    filename: function (req, file, cb) {
        // Use user ID in filename if available
        const userId = req.user ? req.user.id : 'unknown';
        cb(null, `profile-${userId}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

// File filter for regular files (PDF, DOCX, TXT)
const fileFilter = (req, file, cb) => {
    const allowedMimes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, DOCX, and TXT files are allowed.'));
    }
};

// File filter for profile pictures (images only)
const profilePictureFilter = (req, file, cb) => {
    const allowedMimes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WEBP images are allowed.'));
    }
};

// Export different upload configurations
export const upload = multer({ 
    storage: fileStorage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: fileFilter
});

export const uploadProfilePicture = multer({
    storage: profilePictureStorage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit for profile pictures
    },
    fileFilter: profilePictureFilter
});
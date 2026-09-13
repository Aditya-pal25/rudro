const router = require('express').Router();
const { protect, admin } = require('../middleware/auth');
const asyncHandler = require('express-async-handler');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ─── Public server URL ────────────────────────────────────────────────────────
// Uploaded images are served by the PUBLIC backend on port 5000.
// Admin API remains on port 5001.
const PUBLIC_SERVER_URL =
  process.env.PUBLIC_SERVER_URL || 'http://127.0.0.1:5000';

// ─── Choose storage: Cloudinary if configured, else local disk ───────────────
let upload, deleteImage;

const hasCloudinary =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

if (hasCloudinary) {
  // Cloudinary storage
  const { upload: cloudUpload, cloudinary } = require('../config/cloudinary');

  upload = cloudUpload;

  deleteImage = async (publicId) => {
    await cloudinary.uploader.destroy(publicId);
  };

  console.log('📦 Image storage: Cloudinary');
} else {
  // ─── Local disk storage ────────────────────────────────────────────────────
  const uploadDir = path.join(__dirname, '..', 'public', 'uploads');

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
      const unique =
        Date.now() + '-' + Math.round(Math.random() * 1e9);

      cb(
        null,
        'rudroham-' +
          unique +
          path.extname(file.originalname)
      );
    },
  });

  upload = multer({
    storage,

    limits: {
      fileSize: 5 * 1024 * 1024,
    },

    fileFilter: (req, file, cb) => {
      if (file.mimetype && file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files allowed'), false);
      }
    },
  });

  deleteImage = async (publicId) => {
    const filePath = path.join(uploadDir, publicId);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  };

  console.log('📦 Image storage: Local disk');
}

// ─── POST /admin-api/upload ──────────────────────────────────────────────────
router.post(
  '/',
  protect,
  admin,
  upload.array('images', 10),
  asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
      res.status(400);
      throw new Error('No files uploaded');
    }

    const images = req.files.map((file) => {
      if (hasCloudinary) {
        return {
          url: file.path,
          publicId: file.filename,
        };
      }

      // Local storage:
      // IMPORTANT:
      // Images are served by the public backend on port 5000,
      // NOT the admin API on port 5001.
      return {
        url: `${PUBLIC_SERVER_URL}/uploads/${file.filename}`,
        publicId: file.filename,
      };
    });

    res.json({
      success: true,
      images,
    });
  })
);

// ─── DELETE /admin-api/upload ────────────────────────────────────────────────
router.delete(
  '/',
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const { publicId } = req.body;

    if (publicId) {
      await deleteImage(publicId);
    }

    res.json({
      success: true,
    });
  })
);

module.exports = router;
const express = require('express');
const router = express.Router();
const multer = require('multer');
const streamifier = require('streamifier');
const cloudinary = require('../config/cloudinary');
const { protect } = require('../middleware/auth');

// Use memory storage so we can stream to cloudinary
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/zip',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  },
});

// Helper to upload to cloudinary via stream
const uploadToCloudinary = (buffer, options) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// @route   POST /api/upload
// @desc    Upload file or image to cloudinary
// @access  Private
router.post('/', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided',
      });
    }

    const isImage = req.file.mimetype.startsWith('image/');

    const options = {
      folder: 'chat-app',
      resource_type: isImage ? 'image' : 'raw',
      public_id: `${Date.now()}-${req.file.originalname.replace(/\s+/g, '-')}`,
    };

    const result = await uploadToCloudinary(req.file.buffer, options);

    res.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: isImage ? 'image' : 'file',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Upload failed',
    });
  }
});

module.exports = router;
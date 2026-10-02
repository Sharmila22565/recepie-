const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/upload
// @desc    Upload an image file
// @access  Private
router.post('/', protect, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload failed',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please select an image file to upload',
      });
    }

    // Return the relative URL to access the uploaded image
    const imageUrl = `/uploads/${req.file.filename}`;

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      imageUrl,
      filename: req.file.filename,
    });
  });
});

module.exports = router;

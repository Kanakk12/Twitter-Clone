const express = require('express');
const router = express.Router();
const multer = require('multer');

// Multer configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true);
    } else {
        cb(new Error('Only JPEG and PNG images are allowed'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 1 // 1 MB file size limit
    },
    fileFilter: fileFilter
});

// Example endpoint to handle file uploads
router.post('/upload', upload.single('image'), (req, res) => {
    // Check if file is provided
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // File uploaded successfully
    res.status(201).json({ message: 'File uploaded successfully', filePath: req.file.path });
});

module.exports = router;

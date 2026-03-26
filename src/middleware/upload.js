const multer = require('multer');
const fs = require('fs');
const path = require('path');

const uploadDir = path.join(__dirname, '../../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Override file.path to always be a relative URL so controllers work the same
// on all OS (Windows absolute paths would break image serving)
const normalizeFilePath = (req, res, next) => {
  const normalize = (file) => { file.path = `/uploads/${file.filename}`; };
  if (req.file) normalize(req.file);
  if (req.files) {
    if (Array.isArray(req.files)) req.files.forEach(normalize);
    else Object.values(req.files).flat().forEach(normalize);
  }
  next();
};

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 3 * 1024 * 1024 }
});

upload.normalize = normalizeFilePath;
module.exports = upload;

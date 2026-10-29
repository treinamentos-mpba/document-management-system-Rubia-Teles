const { Router } = require('express');
const multer = require('multer');
const { randomUUID } = require('node:crypto');
const documentController = require('../controllers/documentController');

const maxUploadBytes = Number(process.env.UPLOAD_MAX_BYTES || 10 * 1024 * 1024);
if (!Number.isSafeInteger(maxUploadBytes) || maxUploadBytes <= 0) {
  throw new Error('UPLOAD_MAX_BYTES deve ser um inteiro positivo.');
}

const upload = multer({
  storage: multer.diskStorage({
    destination: documentController.prepareStorage,
    filename(req, file, callback) {
      callback(null, randomUUID());
    },
  }),
  limits: { fileSize: maxUploadBytes, files: 1 },
});

const router = Router();
router.post('/upload', documentController.requireOwner, upload.single('file'), documentController.upload);
router.get('/documents', documentController.requireOwner, documentController.list);
router.get('/documents/:id/download', documentController.requireOwner, documentController.download);

module.exports = router;
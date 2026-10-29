const express = require('express');
const multer = require('multer');
const documentRoutes = require('./routes/documentRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(documentRoutes);

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);

  if (error instanceof multer.MulterError) {
    const tooLarge = error.code === 'LIMIT_FILE_SIZE';
    return res.status(tooLarge ? 413 : 400).json({
      error: {
        code: tooLarge ? 'FILE_TOO_LARGE' : 'INVALID_UPLOAD',
        message: tooLarge ? 'Arquivo acima do limite permitido.' : 'Upload inválido.',
      },
    });
  }

  if (['USER_REQUIRED', 'FILE_REQUIRED', 'DOCUMENT_NOT_FOUND'].includes(error.code)) {
    return res.status(error.status).json({
      error: { code: error.code, message: error.message },
    });
  }

  if (error.status === 400) {
    return res.status(400).json({
      error: { code: 'INVALID_REQUEST', message: 'Requisição inválida.' },
    });
  }

  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Erro interno ao processar o documento.' },
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;

const documentService = require('../services/documentService');

function prepareStorage(req, file, callback) {
  documentService.prepareStorage().then(
    (directory) => callback(null, directory),
    (error) => callback(error),
  );
}

function requireOwner(req, res, next) {
  const owner = req.get('X-User-Id')?.trim();
  if (!owner) {
    return next(Object.assign(new Error('Informe o usuário no cabeçalho X-User-Id.'), {
      code: 'USER_REQUIRED', status: 400,
    }));
  }
  res.locals.owner = owner;
  next();
}

function toMetadata(document) {
  const { storageName, ...metadata } = document;
  return metadata;
}

function upload(req, res, next) {
  if (!req.file) {
    return next(Object.assign(new Error('Envie um arquivo no campo file.'), {
      code: 'FILE_REQUIRED', status: 400,
    }));
  }

  const document = documentService.createDocument(req.file, res.locals.owner);
  res.status(201).json(toMetadata(document));
}

function list(req, res) {
  res.json(documentService.listDocuments(res.locals.owner).map(toMetadata));
}

function download(req, res, next) {
  const { document, filePath } = documentService.getDownload(req.params.id, res.locals.owner);
  res.download(filePath, document.originalName, (error) => {
    if (!error) return;
    if (error.code === 'ENOENT') {
      return next(Object.assign(new Error('Documento não encontrado.'), {
        code: 'DOCUMENT_NOT_FOUND', status: 404,
      }));
    }
    next(error);
  });
}

module.exports = { prepareStorage, requireOwner, upload, list, download };
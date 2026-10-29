const { randomUUID } = require('node:crypto');
const documentRepository = require('../repositories/documentRepository');

function prepareStorage() {
  return documentRepository.prepareStorage();
}

function createDocument(file, owner) {
  return documentRepository.save({
    id: randomUUID(),
    originalName: file.originalname,
    storageName: file.filename,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
    mimeType: file.mimetype,
  });
}

function listDocuments(owner) {
  return documentRepository.findByOwner(owner);
}

function getDownload(id, owner) {
  const document = documentRepository.findById(id);
  if (!document || document.owner !== owner) {
    throw Object.assign(new Error('Documento não encontrado.'), {
      code: 'DOCUMENT_NOT_FOUND', status: 404,
    });
  }

  return { document, filePath: documentRepository.getFilePath(document) };
}

module.exports = { prepareStorage, createDocument, listDocuments, getDownload };
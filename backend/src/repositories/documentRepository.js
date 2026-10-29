const path = require('node:path');
const { mkdir } = require('node:fs/promises');

const storageDirectory = path.resolve(
  process.env.STORAGE_DIR || path.join(__dirname, '../../storage'),
);
const documents = new Map();

async function prepareStorage() {
  await mkdir(storageDirectory, { recursive: true });
  return storageDirectory;
}

function save(document) {
  documents.set(document.id, document);
  return document;
}

function findByOwner(owner) {
  return [...documents.values()].filter((document) => document.owner === owner);
}

function findById(id) {
  return documents.get(id);
}

function getFilePath(document) {
  return path.join(storageDirectory, document.storageName);
}

module.exports = { prepareStorage, save, findByOwner, findById, getFilePath };
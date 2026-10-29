import { useEffect, useState } from 'react';
import { Files, RefreshCw, UserRound } from 'lucide-react';
import UploadComponent from './components/UploadComponent.jsx';
import DocumentList from './components/DocumentList.jsx';
import { listDocuments } from './services/api.js';
import './App.css';

export default function App() {
  const [owner, setOwner] = useState('demo');
  const [ownerInput, setOwnerInput] = useState('demo');
  const [documents, setDocuments] = useState([]);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    listDocuments(owner, { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) setDocuments(result);
      })
      .catch((failure) => {
        if (!controller.signal.aborted) setError(failure.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [owner, revision]);

  function changeOwner(event) {
    event.preventDefault();
    const nextOwner = ownerInput.trim();
    if (!nextOwner || nextOwner === owner) return;
    setDocuments([]);
    setOwner(nextOwner);
  }

  function refreshDocuments() {
    setRevision((value) => value + 1);
  }

  return (
    <>
      <header className="app-header">
        <div className="brand"><Files aria-hidden="true" /><span>DMS</span><span className="brand-label">Documentos</span></div>
        <span className="environment">Ambiente de demonstração</span>
      </header>
      <main className="workspace">
        <div className="page-heading">
          <div><p className="eyebrow">ARQUIVO DIGITAL</p><h1>Meus documentos</h1></div>
          <form className="owner-form" onSubmit={changeOwner}>
            <label htmlFor="owner"><UserRound size={16} aria-hidden="true" />Usuário de demonstração</label>
            <div className="input-action">
              <input id="owner" value={ownerInput} onChange={(event) => setOwnerInput(event.target.value)} required maxLength={100} />
              <button type="submit" disabled={!ownerInput.trim() || ownerInput.trim() === owner}>Aplicar</button>
            </div>
          </form>
        </div>
        <UploadComponent key={owner} owner={owner} onUploaded={refreshDocuments} />
        <section className="documents-section" aria-labelledby="documents-title">
          <div className="section-heading">
            <div><h2 id="documents-title">Arquivos</h2><span className="document-count">{documents.length} {documents.length === 1 ? 'documento' : 'documentos'}</span></div>
            <button type="button" className="icon-button" onClick={refreshDocuments} disabled={loading} title="Atualizar lista" aria-label="Atualizar lista"><RefreshCw size={18} className={loading ? 'spinning' : ''} aria-hidden="true" /></button>
          </div>
          {error && <p className="message error" role="alert">{error}</p>}
          <DocumentList documents={documents} owner={owner} loading={loading} failed={Boolean(error)} />
        </section>
      </main>
      <footer className="app-footer">DMS <span>Armazenamento local · Metadados temporários</span></footer>
    </>
  );
}

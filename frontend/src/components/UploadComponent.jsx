import { useState } from 'react';
import { LoaderCircle, Upload } from 'lucide-react';
import { uploadDocument } from '../services/api.js';

export default function UploadComponent({ owner, onUploaded }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file || uploading) return;
    const form = event.currentTarget;
    setUploading(true);
    setError('');
    setSuccess('');
    try {
      const document = await uploadDocument(file, owner);
      setSuccess(`${document.originalName} enviado com sucesso.`);
      setFile(null);
      form.reset();
      onUploaded();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="upload-section" aria-labelledby="upload-title">
      <h2 id="upload-title">Enviar documento</h2>
      <form className="upload-form" onSubmit={handleSubmit} aria-busy={uploading}>
        <label className="file-picker" htmlFor="document-file"><Upload size={24} aria-hidden="true" /><span>Arquivo</span>
          <input id="document-file" name="file" type="file" required disabled={uploading} onChange={(event) => { setFile(event.target.files[0] || null); setError(''); setSuccess(''); }} />
        </label>
        <button className="primary-button" type="submit" disabled={!file || uploading}>
          {uploading ? <LoaderCircle size={18} className="spinning" aria-hidden="true" /> : <Upload size={18} aria-hidden="true" />}
          {uploading ? 'Enviando…' : 'Enviar documento'}
        </button>
      </form>
      {error && <p className="message error" role="alert">{error}</p>}
      {success && <p className="message success" role="status">{success}</p>}
    </section>
  );
}
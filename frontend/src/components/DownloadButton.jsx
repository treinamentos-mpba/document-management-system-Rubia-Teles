import { useState } from 'react';
import { Download, LoaderCircle } from 'lucide-react';
import { downloadDocument } from '../services/api.js';

export default function DownloadButton({ document, owner }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  async function handleDownload() {
    if (downloading) return;
    setDownloading(true);
    setError('');
    let url;
    let link;
    try {
      const blob = await downloadDocument(document, owner);
      url = URL.createObjectURL(blob);
      link = window.document.createElement('a');
      link.href = url;
      link.download = document.originalName;
      window.document.body.appendChild(link);
      link.click();
    } catch (failure) {
      setError(failure.message);
    } finally {
      link?.remove();
      if (url) setTimeout(() => URL.revokeObjectURL(url), 1000);
      setDownloading(false);
    }
  }

  return (
    <div className="download-action">
      <button type="button" className="icon-button" onClick={handleDownload} disabled={downloading} title={`Baixar ${document.originalName}`} aria-label={`Baixar ${document.originalName}`}>
        {downloading ? <LoaderCircle size={18} className="spinning" aria-hidden="true" /> : <Download size={18} aria-hidden="true" />}
      </button>
      {error && <p className="message error" role="alert">{error}</p>}
    </div>
  );
}
import { FileText, FolderOpen, LoaderCircle } from 'lucide-react';
import DownloadButton from './DownloadButton.jsx';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
const sizeFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${sizeFormatter.format(bytes / 1024)} KB`;
  return `${sizeFormatter.format(bytes / (1024 * 1024))} MB`;
}

export default function DocumentList({ documents, owner, loading, failed }) {
  if (loading) return <div className="empty-state" role="status"><LoaderCircle className="spinning" aria-hidden="true" /><p>Carregando documentos…</p></div>;
  if (failed) return null;
  if (!documents.length) return <div className="empty-state"><FolderOpen size={36} aria-hidden="true" /><p>Nenhum documento encontrado.</p></div>;

  return (
    <div className="table-scroll">
      <table>
        <thead><tr><th scope="col">Nome do arquivo</th><th scope="col">Tamanho</th><th scope="col">Enviado em</th><th scope="col"><span className="sr-only">Ações</span></th></tr></thead>
        <tbody>{documents.map((document) => (
          <tr key={document.id}>
            <td><div className="file-name"><FileText size={22} aria-hidden="true" /><span>{document.originalName}</span></div></td>
            <td className="file-size">{formatSize(document.size)}</td>
            <td><time dateTime={document.uploadedAt}>{dateFormatter.format(new Date(document.uploadedAt))}</time></td>
            <td><DownloadButton document={document} owner={owner} /></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
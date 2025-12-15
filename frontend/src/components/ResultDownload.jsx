export default function ResultDownload({ downloadUrl, fileName, onReset }) {
  if (!downloadUrl) return null;

  return (
    <div className="result-download">
      <div className="success-message">
        <span className="success-icon">✅</span>
        <p>File processed successfully!</p>
      </div>
      <div className="download-actions">
        <a
          href={downloadUrl}
          download={fileName}
          className="download-button"
        >
          Download Processed File
        </a>
        <button onClick={onReset} className="reset-button">
          Process Another File
        </button>
      </div>
    </div>
  );
}


import { useState } from 'react';
import FileUpload from './components/FileUpload';
import InstructionInput from './components/InstructionInput';
import ResultDownload from './components/ResultDownload';
import { processFile } from './api/client';
import './App.css';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [instruction, setInstruction] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [downloadFileName, setDownloadFileName] = useState(null);

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setError(null);
    setDownloadUrl(null);
  };

  const handleProcess = async () => {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    if (!instruction.trim()) {
      setError('Please enter an instruction');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setDownloadUrl(null);

    try {
      const response = await processFile(selectedFile, instruction);
      
      // Create download URL from blob
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      
      // Use default filename with original file extension
      const lastDotIndex = selectedFile.name.lastIndexOf('.');
      const fileName = lastDotIndex > 0 
        ? `processed_file${selectedFile.name.substring(lastDotIndex)}`
        : 'processed_file';

      setDownloadUrl(url);
      setDownloadFileName(fileName);
    } catch (err) {
      // Handle error response with blob (error messages from API)
      if (err.response?.data instanceof Blob) {
        const text = await err.response.data.text();
        try {
          const errorData = JSON.parse(text);
          setError(errorData.error || 'Processing failed');
        } catch {
          setError('Processing failed. Please try again.');
        }
      } else {
        setError(err.message || 'An error occurred while processing the file');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setInstruction('');
    setError(null);
    setDownloadUrl(null);
    setDownloadFileName(null);
    
    // Clean up blob URL
    if (downloadUrl) {
      window.URL.revokeObjectURL(downloadUrl);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>AirLock</h1>
        <p>AI-Powered File Processing</p>
      </header>

      <main className="app-main">
        <div className="container">
          <FileUpload
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
          />

          <InstructionInput
            value={instruction}
            onChange={setInstruction}
            disabled={isProcessing}
          />

          {error && (
            <div className="error-message">
              <span className="error-icon">❌</span>
              <p>{error}</p>
            </div>
          )}

          <button
            className="process-button"
            onClick={handleProcess}
            disabled={!selectedFile || !instruction.trim() || isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Process File'}
          </button>

          {isProcessing && (
            <div className="processing-indicator">
              <div className="spinner"></div>
              <p>Processing your file. This may take a few moments...</p>
            </div>
          )}

          <ResultDownload
            downloadUrl={downloadUrl}
            fileName={downloadFileName}
            onReset={handleReset}
          />
        </div>
      </main>
    </div>
  );
}

export default App;


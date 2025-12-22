import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 minutes timeout for file processing
});

/**
 * Process a file with the given instruction
 * @param {File} file - The file to process
 * @param {string} instruction - The processing instruction
 * @returns {Promise} Axios response with blob data
 */
export const processFile = async (file, instruction) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('instruction', instruction);

  const response = await apiClient.post('/process', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    responseType: 'blob', // Important for file download
  });

  return response;
};

export default apiClient;


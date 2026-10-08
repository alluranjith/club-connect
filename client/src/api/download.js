import toast from 'react-hot-toast';
import api from './axios';

// Plain <a href> links can't send the login token, so downloads must go through axios.
// Fetches the file as a blob (token attached) and triggers a browser download.
export const downloadFile = async (path, filename) => {
  try {
    const res = await api.get(path, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    // error bodies arrive as blobs when responseType is 'blob'
    let message = 'Download failed';
    try { message = JSON.parse(await err.response.data.text()).message || message; } catch (e) { /* keep default */ }
    toast.error(message);
  }
};

export default downloadFile;

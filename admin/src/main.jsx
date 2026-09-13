import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';
const qc = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 2 * 60 * 1000 } } });
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <App />
        <Toaster position="top-right" toastOptions={{ style: { background:'#161616', color:'#F2EDE4', border:'1px solid #202020', fontFamily:'DM Sans,sans-serif', fontSize:'14px' }, success: { iconTheme: { primary:'#E8351A', secondary:'#fff' } } }} />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);

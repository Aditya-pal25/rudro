import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

export default function WhatsAppButton({ context = 'general', orderId = null, requestNumber = null }) {
  const { data } = useQuery({
    queryKey: ['public-settings'],
    queryFn: () => api.get('/settings/public').then(r => r.data),
    staleTime: 10 * 60 * 1000,
  });

  const settings = data?.settings;
  if (!settings?.whatsappEnabled || !settings?.whatsappNumber) return null;

  const buildMessage = () => {
    if (context === 'order' && orderId)
      return `Hello Rudroham Support, I need help with Order ${orderId}.`;
    if (context === 'return' && requestNumber)
      return `Hello Rudroham Support, I need help with Return Request ${requestNumber}.`;
    if (context === 'exchange' && requestNumber)
      return `Hello Rudroham Support, I need help with Exchange Request ${requestNumber}.`;
    return settings.whatsappMessage || 'Hello Rudroham Support, I need help.';
  };

  const phone = settings.whatsappNumber.replace(/\D/g, '');
  const msg   = encodeURIComponent(buildMessage());
  const url   = `https://wa.me/${phone}?text=${msg}`;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-[#25D366] hover:bg-[#128C7E] text-white flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 rounded-full"
      style={{ boxShadow: '0 4px 24px rgba(37,211,102,0.4)' }}>
      <svg viewBox="0 0 32 32" width="28" height="28" fill="currentColor">
        <path d="M16.003 3C9.374 3 4 8.373 4 15.003c0 2.28.627 4.41 1.717 6.236L4 29l7.97-1.698A11.95 11.95 0 0016.003 27C22.63 27 28 21.63 28 15.003 28 8.373 22.63 3 16.003 3zm0 21.83a9.76 9.76 0 01-5.02-1.383l-.36-.213-3.73.795.81-3.622-.234-.373A9.8 9.8 0 016.17 15c0-5.42 4.413-9.83 9.833-9.83 5.42 0 9.83 4.41 9.83 9.83 0 5.42-4.41 9.83-9.83 9.83zm5.394-7.352c-.296-.148-1.749-.862-2.02-.96-.272-.1-.47-.149-.668.149-.197.296-.764.96-.936 1.158-.173.197-.346.222-.641.074-.297-.148-1.25-.46-2.38-1.47-.88-.784-1.474-1.75-1.647-2.047-.173-.297-.018-.457.13-.605.133-.133.297-.346.445-.52.148-.172.197-.296.296-.494.099-.197.05-.37-.025-.52-.075-.148-.669-1.61-.916-2.205-.24-.58-.486-.5-.668-.51-.172-.01-.37-.012-.568-.012-.197 0-.518.074-.79.37-.27.297-1.036 1.012-1.036 2.468 0 1.456 1.06 2.863 1.208 3.06.148.197 2.086 3.186 5.056 4.47.707.305 1.259.487 1.69.623.71.225 1.357.193 1.868.117.57-.085 1.749-.715 1.996-1.406.247-.692.247-1.283.173-1.406-.074-.124-.272-.197-.568-.346z"/>
      </svg>
    </a>
  );
}

import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center text-center px-4">
      <div>
        <p className="font-display text-[10rem] leading-none text-surface2 select-none">404</p>
        <h1 className="font-display text-5xl text-cream -mt-8 mb-4">PAGE NOT FOUND</h1>
        <p className="text-muted mb-10">This drop doesn't exist. Yet.</p>
        <Link to="/" className="btn-primary"><ArrowLeft size={16} /> Back to Home</Link>
      </div>
    </div>
  );
}
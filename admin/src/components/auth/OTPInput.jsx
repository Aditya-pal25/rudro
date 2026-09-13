import { useRef, useState, useEffect } from 'react';
export default function OTPInput({ value, onChange, disabled = false }) {
  const [digits, setDigits] = useState(Array(6).fill(''));
  const refs = useRef([]);
  useEffect(() => { onChange(digits.join('')); }, [digits]);
  useEffect(() => { if (!value) setDigits(Array(6).fill('')); }, [value]);
  const handleChange = (idx, val) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...digits]; next[idx] = digit; setDigits(next);
    if (digit && idx < 5) refs.current[idx + 1]?.focus();
  };
  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace') { if (digits[idx]) { const n=[...digits];n[idx]='';setDigits(n); } else if (idx > 0) { refs.current[idx-1]?.focus(); const n=[...digits];n[idx-1]='';setDigits(n); } }
    if (e.key === 'ArrowLeft' && idx > 0) refs.current[idx-1]?.focus();
    if (e.key === 'ArrowRight' && idx < 5) refs.current[idx+1]?.focus();
  };
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6);
    if (!pasted) return;
    const next = Array(6).fill(''); pasted.split('').forEach((d,i) => { next[i]=d; }); setDigits(next);
    refs.current[Math.min(pasted.length,5)]?.focus();
  };
  return (
    <div className="flex gap-2 sm:gap-3 justify-center">
      {digits.map((d, i) => (
        <input key={i} ref={el => refs.current[i]=el} type="text" inputMode="numeric" maxLength={1} value={d} disabled={disabled}
          onChange={e => handleChange(i, e.target.value)} onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste} onFocus={e => e.target.select()}
          className={`w-11 h-14 sm:w-12 text-center text-2xl font-bold font-mono border-2 bg-surface2 text-cream outline-none transition-all ${d ? 'border-accent text-accent' : 'border-border hover:border-muted'} focus:border-accent ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
        />
      ))}
    </div>
  );
}

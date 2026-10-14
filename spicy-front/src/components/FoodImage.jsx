import { useState } from 'react';
import { Utensils } from 'lucide-react';

export default function FoodImage({ src, alt, className = '', priority = false }) {
  const [failedSrc, setFailedSrc] = useState(null);
  return !src || failedSrc === src ? <div className={`image-fallback ${className}`} role="img" aria-label={alt}><Utensils size={40} /><span>LE GOÛT SPICY.</span></div> : <img className={className} src={src} alt={alt} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} decoding="async" onError={() => setFailedSrc(src)} />;
}

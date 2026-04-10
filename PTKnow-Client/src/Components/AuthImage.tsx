import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { api } from '../api';
import { getFileUrl } from '../utils/fileUtils';

interface AuthImageProps {
  src?: string | null;
  fallbackSrc?: string;
  alt: string;
  className?: string;
}

const isProtectedFileUrl = (value: string) => {
  if (value.startsWith('data:') || value.startsWith('blob:')) {
    return false;
  }

  try {
    const parsed = new URL(value);
    return parsed.pathname.startsWith('/api/');
  } catch {
    return value.startsWith('/api/') || value.startsWith('api/');
  }
};

export const AuthImage: React.FC<AuthImageProps> = ({
  src,
  fallbackSrc,
  alt,
  className,
}) => {
  const resolvedSrc = useMemo(() => (src ? getFileUrl(src) : null), [src]);
  const [displaySrc, setDisplaySrc] = useState<string | null>(fallbackSrc ?? null);
  const objectUrlRef = useRef<string | null>(null);
  const authAttemptedRef = useRef(false);
  const isFetchingRef = useRef(false);

  const revokeObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const loadWithAuth = useCallback(async () => {
    if (!resolvedSrc || authAttemptedRef.current || isFetchingRef.current) {
      return;
    }

    authAttemptedRef.current = true;
    isFetchingRef.current = true;

    try {
      const response = await axios.get(resolvedSrc, {
        responseType: 'blob',
        withCredentials: true,
        timeout: api.defaults.timeout,
      });
      revokeObjectUrl();
      objectUrlRef.current = URL.createObjectURL(response.data);
      setDisplaySrc(objectUrlRef.current);
    } catch {
      setDisplaySrc(fallbackSrc ?? null);
    } finally {
      isFetchingRef.current = false;
    }
  }, [fallbackSrc, resolvedSrc, revokeObjectUrl]);

  useEffect(() => {
    authAttemptedRef.current = false;
    isFetchingRef.current = false;
    revokeObjectUrl();

    if (!resolvedSrc) {
      setDisplaySrc(fallbackSrc ?? null);
      return undefined;
    }

    setDisplaySrc(resolvedSrc);
    return revokeObjectUrl;
  }, [fallbackSrc, resolvedSrc, revokeObjectUrl]);

  const handleError = useCallback(() => {
    if (!resolvedSrc) {
      return;
    }

    if (!isProtectedFileUrl(resolvedSrc)) {
      setDisplaySrc(fallbackSrc ?? null);
      return;
    }

    void loadWithAuth();
  }, [fallbackSrc, loadWithAuth, resolvedSrc]);

  return (
    <img
      src={displaySrc ?? ''}
      alt={alt}
      className={className}
      onError={handleError}
    />
  );
};

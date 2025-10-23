import { useState } from 'react';
import { AuthProviders } from './useAuthProviders';

export function useManualAuthProviders() {
  const [manualProviders, setManualProviders] = useState<AuthProviders>({
    emailPassword: false,
    emailLink: false,
    phone: false,
    anonymous: false,
    google: false,
    facebook: false,
    twitter: false,
    github: false,
    microsoft: false,
    apple: false,
  });

  const [useManual, setUseManual] = useState(false);

  return {
    manualProviders,
    setManualProviders,
    useManual,
    setUseManual
  };
}
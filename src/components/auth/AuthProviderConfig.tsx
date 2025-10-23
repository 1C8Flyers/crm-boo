'use client';

import { useState } from 'react';
import { AuthProviders } from '@/hooks/useAuthProviders';

interface AuthProviderConfigProps {
  currentProviders: AuthProviders;
  onUpdateProviders: (providers: AuthProviders) => void;
}

export default function AuthProviderConfig({ currentProviders, onUpdateProviders }: AuthProviderConfigProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [providers, setProviders] = useState<AuthProviders>(currentProviders);

  const handleToggle = (provider: keyof AuthProviders) => {
    const newProviders = {
      ...providers,
      [provider]: !providers[provider]
    };
    setProviders(newProviders);
    onUpdateProviders(newProviders);
  };

  const providerLabels: Record<keyof AuthProviders, string> = {
    emailPassword: 'Email/Password',
    emailLink: 'Email Link',
    phone: 'Phone',
    anonymous: 'Anonymous',
    google: 'Google',
    facebook: 'Facebook',
    twitter: 'Twitter',
    github: 'GitHub',
    microsoft: 'Microsoft',
    apple: 'Apple'
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 text-white px-3 py-2 rounded text-sm shadow-lg hover:bg-blue-700"
        >
          Configure Auth Providers
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-xl p-4 w-64">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-sm">Auth Providers</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-2 text-sm">
        {Object.entries(providerLabels).map(([key, label]) => (
          <label key={key} className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={providers[key as keyof AuthProviders]}
              onChange={() => handleToggle(key as keyof AuthProviders)}
              className="rounded"
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600">
        This is for testing. Configure actual providers in Firebase Console.
      </div>
    </div>
  );
}
import { useFirebaseAuthTest } from '@/hooks/useFirebaseAuthTest';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';

export function FirebaseAuthStatus() {
  const { connected, error, authEnabled } = useFirebaseAuthTest();

  return (
    <div className="mb-4 p-3 border rounded-md">
      <div className="flex items-center space-x-2">
        {connected ? (
          <>
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-700">Firebase Auth Connected</span>
          </>
        ) : error ? (
          <>
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-700">Auth Error: {error}</span>
          </>
        ) : (
          <>
            <Loader className="h-4 w-4 text-gray-500 animate-spin" />
            <span className="text-sm text-gray-700">Checking auth status...</span>
          </>
        )}
      </div>
      
      {!connected && (
        <div className="mt-2 text-xs text-gray-600">
          <p>If you see connection issues:</p>
          <ol className="list-decimal list-inside mt-1 space-y-1">
            <li>Go to <a href="https://console.firebase.google.com/project/crm-boo-prod/authentication/providers" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Firebase Console</a></li>
            <li>Click "Get started" if Authentication isn't enabled</li>
            <li>Enable "Email/Password" sign-in method</li>
            <li>Refresh this page</li>
          </ol>
        </div>
      )}
    </div>
  );
}
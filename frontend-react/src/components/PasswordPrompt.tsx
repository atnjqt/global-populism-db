import { useState } from 'react';

interface PasswordPromptProps {
  onAuthenticated: () => void;
}

export default function PasswordPrompt({ onAuthenticated }: PasswordPromptProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'supersecure123') {
      onAuthenticated();
    } else {
      setError('Incorrect password');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Global Populism Database
        </h1>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
          <h2 className="font-semibold text-yellow-900 mb-2">⚠️ Dataset Usage Agreement</h2>
          <p className="text-sm text-yellow-800 mb-3">
            This database contains data from Harvard Dataverse and is subject to usage restrictions. 
            By accessing this application, you agree to:
          </p>
          <ul className="text-sm text-yellow-800 list-disc list-inside space-y-1">
            <li>Use the data for research and educational purposes only</li>
            <li>Not redistribute the dataset without permission</li>
            <li>Cite the original authors in any publications</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Enter Password to Continue
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Password"
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            I Agree & Continue
          </button>
        </form>

        <p className="mt-4 text-xs text-gray-500 text-center">
          Protected access • Research use only
        </p>
      </div>
    </div>
  );
}

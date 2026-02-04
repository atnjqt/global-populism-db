import { useState } from 'react';

interface PasswordPromptProps {
  onAuthenticated: () => void;
}

export default function PasswordPrompt({ onAuthenticated }: PasswordPromptProps) {
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (agreed) {
      onAuthenticated();
    }
  };

  return (
    <div 
      className="bg-gray-100 flex items-center justify-center p-4"
      style={{
        backgroundImage: 'url(https://cdn.pixabay.com/animation/2022/11/28/18/32/18-32-55-105_512.gif)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '100vh'
      }}
    >
      <div className="bg-white rounded-lg shadow-xl p-8 w-4/5">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Global Populism Database UI
        </h1>
                  <p className="text-sm text-yellow-800 mb-3">
            This web application provides interactive & educational data visualizations for the <strong>Global Populism Database</strong> provided by <strong><a href="https://dataverse.harvard.edu/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Harvard Dataverse</a> </strong> and as such is subject to usage restrictions. 
            The web application code and serverless infrastructure (i.e. AWS Lambda & S3) are provided publicly on GitHub, accessible here: <code><strong><a href="https://github.com/atnjqt/global-populism-db" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">github.com/atnjqt/global-populism-db</a></strong></code>.
            Should you have any questions, legal concerns, or require further information, please contact the maintainers <strong><a href="https://github.com/atnjqt/global-populism-db/issues" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">here</a></strong>.
          </p>       
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
          <h2 className="font-semibold text-yellow-900 mb-2">⚠️ Dataset Usage Agreement</h2>
          <h3 className="font-medium text-yellow-900 mb-2">Please read carefully before proceeding. By accessing this application, you agree to:</h3>

          <ul className="text-sm text-yellow-800 list-disc list-inside space-y-1">
            <li>Use the data, web interface, and functionality for research and educational purposes only (i.e. non-commercial)</li>
            <li>Respect all licensing agreements for both the Harvard Dataverse and this web application git repository</li>
            <li>Not redistribute, share, or sell the dataset without explicit written permission</li>
            <li>Cite the original authors in any publications, presentations, or derivative works</li>
            <li>Comply with all applicable laws and ethical guidelines, per local, national, and international regulations</li>
          </ul>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-start">
            <input
              id="agreement"
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              required
            />
            <label htmlFor="agreement" className="ml-3 text-sm font-medium text-gray-700">
              I have read and agree to all the terms and conditions stated above
            </label>
          </div>

          <button
            type="submit"
            disabled={!agreed}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </form>

        <p className="mt-4 text-xs text-gray-500 text-center">
          Protected access • Research use only
        </p>
      </div>
    </div>
  );
}

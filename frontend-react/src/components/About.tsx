export default function About() {
  return (
    <div className="bg-white rounded-lg shadow-md p-8 max-w-4xl mx-auto overflow-y-auto h-full">
      <h1 className="text-3xl font-bold text-gray-800 mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
        About the Global Populism Database
      </h1>
      
      <div className="prose prose-slate max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Overview</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            The <strong>Global Populism Database (GPD)</strong> is a comprehensive dataset provided by{' '}
            <a 
              href="https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi:10.7910/DVN/LFTQEZ"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Harvard Dataverse
            </a>
            , and codes populist rhetoric in political speeches 
            from leaders around the world. This interactive visualization tool allows researchers, journalists, and the public 
            to explore patterns of populism across countries, time periods, and ideological orientations.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Author</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            This visualization tool was created by{' '}
            <a 
              href="https://www.linkedin.com/in/etienne-jacquot-2808a5365/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline font-medium"
            >
              Etienne Jacquot 
            </a>
            , using Claude Sonnet 4.5 / Opus 4.5 via Copilot.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Source code for the web user interface available at on{' '}
            <a 
              href="https://github.com/atnjqt/global-populism-db"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <code>global-populism-db</code>
            </a>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Dataset Information</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            This tool visualizes data from the{' '}
            <a 
              href="https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi:10.7910/DVN/LFTQEZ"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Harvard Dataverse Global Populism Database v2.1
            </a>
            , which includes:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li><strong>361 coded records</strong> from political speeches</li>
            <li><strong>77 countries</strong> across multiple continents</li>
            <li><strong>269 political leaders</strong> spanning diverse ideological backgrounds</li>
            <li>Time coverage from <strong>1934 to 2026</strong></li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Populism Scoring</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Speeches are coded on a scale from <strong>0.0 to 2.0</strong>, measuring the degree of populist rhetoric:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li><strong>0.0-0.2:</strong> Very Low - Minimal or no populist language</li>
            <li><strong>0.2-0.5:</strong> Low - Occasional populist themes</li>
            <li><strong>0.5-1.0:</strong> Medium - Moderate populist rhetoric</li>
            <li><strong>1.0-1.5:</strong> High - Substantial populist messaging</li>
            <li><strong>1.5-2.0:</strong> Very High - Dominant populist discourse</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Speech Categories</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            The database codes different types of political speeches:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li><strong>Campaign Speeches:</strong> Electoral campaign addresses</li>
            <li><strong>Famous Speeches:</strong> Well-known or historically significant addresses</li>
            <li><strong>International Speeches:</strong> Addresses to international audiences or bodies</li>
            <li><strong>Ribbon-cutting:</strong> Ceremonial and governmental event speeches</li>
            <li><strong>Total Average:</strong> Aggregated score across all speech types</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Ideological Classification</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Leaders are classified into three ideological categories:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li><strong className="text-blue-600">Left:</strong> Progressive, socialist, or left-wing political orientation</li>
            <li><strong className="text-emerald-600">Center:</strong> Centrist or moderate political positioning</li>
            <li><strong className="text-red-600">Right:</strong> Conservative or right-wing political orientation</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">How to Use This Tool</h2>
          <ol className="list-decimal list-inside text-gray-600 space-y-2 mb-4">
            <li>Use the <strong>Time Period</strong> sliders to filter by year range</li>
            <li>Toggle between <strong>Populism Only</strong> and <strong>By Ideology</strong> color modes</li>
            <li>Filter by specific ideological orientations (Left, Center, Right)</li>
            <li>Select different <strong>Speech Types</strong> to compare populism across contexts</li>
            <li>Click on any country to view detailed leader-by-leader timeline data</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Related Research</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            For additional context and analysis related to populism research:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>
              <a 
                href="https://arxiv.org/html/2510.07458v2"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                <em>Populism Meets AI: Advancing Populism Research with LLMs (October, 2025)</em>
              </a>
            </li>
          </ul>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Citation</h2>
          <p className="text-gray-600 leading-relaxed bg-gray-50 p-4 rounded border-l-4 border-blue-500">
            If you use this data in your research, please cite the original Harvard Dataverse dataset. 
            Visit the{' '}
            <a 
              href="https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi:10.7910/DVN/LFTQEZ"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Harvard Dataverse page
            </a>
            {' '}for full citation information.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Technical Details</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            This interactive visualization was built using React, TypeScript, and Leaflet.js for mapping. 
            The backend API is powered by Python FastAPI, serving data from the GPD v2.1 dataset.
          </p>
        </section>
      </div>
    </div>
  );
}

# Global Populism Database UI

- Etienne P Jacquot (02/01/2026) [etiennej@upenn.edu](mailto:etiennej@upenn.edu)

## Overview

This repository provides an **interactive web application** and **AI-powered analysis tools** for exploring the **Global Populism Database v2.1** from Harvard Dataverse (see [DOI 10.7910/DVN/LFTQEZ](https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi:10.7910/DVN/LFTQEZ)).

![image of the web UI](assets/image.png)

The application combines interactive geographic visualization with AI-powered speech analysis to help researchers explore populist rhetoric patterns across 156 countries and 1,162+ political speeches.

## Features

### 🗺️ Interactive Map Visualization
- **World map** showing populism scores by country with color-coded intensity
- **Time-period filters** to explore trends across decades (1934-present)
- **Speech type filters** (Campaign, Famous, International, Ribbon-cutting)
- **Ideology filters** to compare left, center, and right-wing populism
- **Click-to-explore** country details with leader timelines
- **Time-weighted averaging** for accurate historical analysis

### 📢 Speech Explorer & Browser
- **Browse 1,162+ political speeches** with advanced filtering
- **Full-text speech viewer** with word counts
- **Filter by country, ideology, and speech type**
- **Sort by populism score** (high to low or low to high)
- **Real-time search and filtering**

### 🤖 AI-Powered Analysis (AWS Bedrock + Claude Sonnet 4.5)
- **Automatic speech summarization** using state-of-the-art LLMs
- **Populism assessment** analyzing anti-elite rhetoric and people-centrism
- **Markdown-formatted analysis** with structured insights
- **Collapsible UI** to preserve analysis results without re-running
- **Model transparency** showing which AI model performed the analysis

### 🔌 REST API Backend
- **FastAPI** with comprehensive endpoints
- **CORS-enabled** for cross-origin requests
- **Real-time data filtering** and aggregation
- **Speech content API** for programmatic access
- **AI analysis endpoint** for batch processing

## Quick Start

### Prerequisites
- **Python 3.8+** (backend)
- **Node.js 16+** (frontend)
- **AWS credentials** (optional, for AI analysis features)

### Installation & Running

#### Backend (FastAPI)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On macOS/Linux
pip install -r requirements.txt
python main.py
```

The backend will start on **http://localhost:8000**

#### Frontend (React + Vite)

```bash
cd frontend-react
npm install
npm run dev
```

The frontend will start on **http://localhost:5173**

### AWS Configuration (Optional - for AI Features)

To enable AI-powered speech analysis, configure AWS credentials:

```bash
# Set up AWS profile named 'atn-developer'
aws configure --profile atn-developer
```

Required permissions:
- `bedrock:InvokeModel` for Claude Sonnet 4.5

## Project Structure

```
global-populism-db/
├── backend/
│   ├── main.py                    # FastAPI application
│   └── notebooks/
│       └── bedrock-speech-review.ipynb  # AI analysis demo
├── frontend-react/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Map.tsx           # Interactive Leaflet map
│   │   │   ├── Speeches.tsx      # Speech browser with AI
│   │   │   ├── About.tsx         # Dataset documentation
│   │   │   └── Header.tsx        # Navigation and stats
│   │   ├── api/                  # API client functions
│   │   ├── hooks/                # React Query hooks
│   │   └── types/                # TypeScript interfaces
│   └── package.json
├── dataverse_files/
│   ├── GPD_v2.1_20251120.csv          # Main dataset (363 records)
│   ├── speeches_20251120/             # 1,162+ speech text files
│   ├── Rubrics_20251120/              # Coding rubrics
│   └── GPD Codebook_v2.1.pdf
└── README.md
```

## API Endpoints

### Summary & Metadata
- `GET /api/summary` - Dataset statistics (total records, countries, leaders, speeches)
- `GET /api/countries` - List all countries in the database
- `GET /api/regions` - List all geographic regions

### Data Endpoints
- `GET /api/data` - Filtered leader-term data
  - Params: `country`, `leader`, `year_start`, `year_end`, `min_populism`
  
- `GET /api/map-data` - Aggregated data for map visualization
  - Params: `year_start`, `year_end`, `speech_type`, `time_weighted`, `ideology`
  
- `GET /api/timeline/{country}` - Leader timeline for a specific country

### Speech Endpoints
- `GET /api/speeches` - List speeches with filters
  - Params: `country`, `ideology`, `speech_type`
  
- `GET /api/speeches/{filename}` - Get full speech text content

- `POST /api/speeches/{filename}/analyze` - AI-powered analysis
  - Returns: summary, populism_assessment, word counts

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and builds
- **TanStack React Query** for data fetching and caching
- **React-Leaflet** for interactive maps
- **Tailwind CSS** for styling
- **React Markdown** for rendering AI analysis

### Backend
- **FastAPI** (Python) for REST API
- **pandas** for data processing
- **AWS Bedrock** with Langchain for AI analysis
- **Claude Sonnet 4.5** LLM for speech analysis

## Dataset Information

The Global Populism Database (GPD v2.1) tracks populist rhetoric across:
- **156 countries** worldwide
- **363 leader terms** with coded speeches
- **1,162+ full-text speeches** available
- **4 speech types**: Campaign, Famous, International, Ribbon-cutting
- **Time period**: 1934 - Present
- **Populism scores**: 0-2 scale measuring rhetoric intensity

### Key Variables

- `country` - Country name
- `leader` - Leader name  
- `party` - Political party affiliation
- `lr` - Left-Right ideology (-1=left, 0=center, 1=right, null=unknown)
- `yearbegin` / `yearend` - Term start/end years
- `totalaverage` - Overall populism score (0-2)
- `campaign_average` - Campaign speech populism score
- `famous_average` - Famous speech populism score
- `international_average` - International speech populism score
- `ribbon_average` - Ribbon-cutting speech populism score

## AI Analysis Features

The application uses **AWS Bedrock** with **Claude Sonnet 4.5** (`us.anthropic.claude-sonnet-4-5-20250929-v1:0`) to provide:

### Speech Summarization
- Concise 2-3 sentence summaries of speech content
- Key themes and main messages identification
- Context preservation

### Populism Assessment
Analyzes speeches for:
- **Anti-elite rhetoric**: Criticism of established power structures
- **People-centrism**: References to "the people" and their will
- **Manichean discourse**: Good vs. evil framing
- **Crisis invocation**: Appeals to urgency or danger
- **Direct democracy appeals**: Calls to bypass institutions

Analysis results are:
- **Cached client-side** to avoid re-analysis costs
- **Markdown-formatted** for easy reading
- **Collapsible** to manage screen space
- **Limited to first 2,000 words** for cost efficiency

## Usage Examples

### Exploring the Map

1. **Filter by time period**: Use the year range sliders to focus on specific decades
2. **Toggle time-weighted averaging**: Account for partial term overlaps in date ranges
3. **Filter by ideology**: Compare populism across left, center, and right-wing leaders
4. **Change speech type**: See how populism varies across different contexts
5. **Click countries**: View detailed leader-by-leader breakdowns with timelines
6. **Color intensity**: Darker reds indicate higher populism scores

### Browsing Speeches

1. **Select a country** to see all available speeches
2. **Filter by ideology** (Left/Center/Right) to compare political spectrums
3. **Choose speech type** (Campaign, Famous, International, Ribbon-cutting)
4. **Sort by score** to find most/least populist speeches
5. **Click a speech** to read the full text
6. **Click "AI Analysis"** to get automated summary and populism assessment

### Using the API

Get all leaders from Argentina with high populism:
```bash
curl "http://localhost:8000/api/data?country=Argentina&min_populism=1.0"
```

Get map data for 2010-2020 with time weighting:
```bash
curl "http://localhost:8000/api/map-data?year_start=2010&year_end=2020&time_weighted=true"
```

List campaign speeches from the United States:
```bash
curl "http://localhost:8000/api/speeches?country=United%20States&speech_type=campaign"
```

Analyze a specific speech with AI:
```bash
curl -X POST "http://localhost:8000/api/speeches/Argentina_Fernandez_Campaign_1.txt/analyze"
```

## Development

### Frontend Development
```bash
cd frontend-react
npm run dev      # Start dev server with hot reload
npm run build    # Build for production
npm run preview  # Preview production build
```

### Backend Development
```bash
cd backend
source venv/bin/activate
python main.py   # Runs with auto-reload on file changes
```

### Jupyter Notebook Analysis
Explore the AI analysis workflow:
```bash
cd backend/notebooks
jupyter notebook bedrock-speech-review.ipynb
```

## Related Research

This project builds upon work published in:
- **Hawkins et al. (2019)**: "The ideational approach to populism" in *Routledge Handbook of Global Populism*
- **arXiv preprint**: [Dataset and analysis methodology](https://arxiv.org/abs/2210.09644)

## Future Enhancements

- [x] LLM-powered speech analysis with Claude Sonnet 4.5
- [x] Interactive speech browser with full-text access
- [x] Time-weighted populism averaging for accurate historical analysis
- [ ] Embedding-based semantic search across speeches
- [ ] Batch speech comparison and trend analysis
- [ ] Export functionality for filtered datasets
- [ ] Additional visualization types (scatter plots, trend lines)
- [ ] Multi-language translation support

## License

This code is provided for research and educational purposes. Please refer to the original dataset license on [Harvard Dataverse](https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi:10.7910/DVN/LFTQEZ). 

For questions about this implementation, contact Etienne P Jacquot at [etiennej@upenn.edu](mailto:etiennej@upenn.edu).
"""
FastAPI backend for Global Populism Database visualization
"""
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import pandas as pd
import json
from typing import Optional, List
from pathlib import Path
import boto3
from langchain_aws import ChatBedrock
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

app = FastAPI(title="Global Populism Database API", version="1.0.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load data
DATA_PATH = Path(__file__).parent.parent / "dataverse_files" / "GPD_v2.1_20251120_Wide.csv"
df = None
llm = None


@app.on_event("startup")
async def load_data():
    """Load the CSV data and initialize AI on startup"""
    global df, llm
    try:
        df = pd.read_csv(DATA_PATH)
        
        # Convert 'current' to 2026 for easier filtering
        df['yearend_numeric'] = df['yearend'].replace('current', 2026)
        df['yearend_numeric'] = pd.to_numeric(df['yearend_numeric'], errors='coerce')
        
        print(f"✓ Loaded {len(df)} records from {DATA_PATH.name}")
        
        # Initialize Bedrock AI (optional - only if AWS credentials are available)
        try:
            session = boto3.Session(profile_name='atn-developer')
            bedrock_runtime = session.client('bedrock-runtime', region_name='us-east-1')
            llm = ChatBedrock(
                client=bedrock_runtime,
                model_id="us.anthropic.claude-sonnet-4-5-20250929-v1:0",
                model_kwargs={
                    "max_tokens": 128000,
                    "temperature": 0.8,
                }
            )
            print(f"✓ Bedrock AI initialized")
        except Exception as ai_error:
            print(f"⚠️  Bedrock AI not available: {ai_error}")
            llm = None
            
    except Exception as e:
        print(f"Error loading data: {e}")
        raise


@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "message": "Global Populism Database API",
        "version": "1.0.0",
        "endpoints": {
            "/api/countries": "Get list of all countries",
            "/api/data": "Get filtered data",
            "/api/summary": "Get data summary statistics",
            "/api/map-data": "Get aggregated data for map visualization",
        }
    }


@app.get("/api/countries")
async def get_countries():
    """Get list of all unique countries in the database"""
    if df is None:
        raise HTTPException(status_code=500, detail="Data not loaded")
    
    countries = df['country'].unique().tolist()
    return {
        "countries": sorted(countries),
        "count": len(countries)
    }


@app.get("/api/regions")
async def get_regions():
    """Get list of all regions"""
    if df is None:
        raise HTTPException(status_code=500, detail="Data not loaded")
    
    regions = df['region'].dropna().unique().tolist()
    wb_regions = df['wb_region'].dropna().unique().tolist()
    
    return {
        "regions": sorted(regions),
        "wb_regions": sorted(wb_regions)
    }


@app.get("/api/leaders")
async def get_leaders(country: Optional[str] = None):
    """Get list of leaders, optionally filtered by country"""
    if df is None:
        raise HTTPException(status_code=500, detail="Data not loaded")
    
    filtered_df = df
    if country:
        filtered_df = df[df['country'] == country]
    
    leaders = filtered_df[['leader', 'country', 'party']].drop_duplicates()
    
    return {
        "leaders": leaders.to_dict('records'),
        "count": len(leaders)
    }


@app.get("/api/data")
async def get_data(
    country: Optional[str] = None,
    leader: Optional[str] = None,
    year_start: Optional[int] = None,
    year_end: Optional[int] = None,
    min_populism: Optional[float] = None
):
    """Get filtered data based on query parameters"""
    if df is None:
        raise HTTPException(status_code=500, detail="Data not loaded")
    
    filtered_df = df.copy()
    
    if country:
        filtered_df = filtered_df[filtered_df['country'] == country]
    
    if leader:
        filtered_df = filtered_df[filtered_df['leader'] == leader]
    
    # Filter by year range - include terms that overlap with the selected period
    # A term overlaps if: term_start <= year_end AND term_end >= year_start
    if year_start and year_end:
        filtered_df = filtered_df[
            (filtered_df['yearbegin'] <= year_end) & 
            (filtered_df['yearend_numeric'] >= year_start)
        ]
    elif year_start:
        # If only start year specified, include terms that ended on or after that year
        filtered_df = filtered_df[filtered_df['yearend_numeric'] >= year_start]
    elif year_end:
        # If only end year specified, include terms that started on or before that year
        filtered_df = filtered_df[filtered_df['yearbegin'] <= year_end]
    
    if min_populism is not None:
        filtered_df = filtered_df[filtered_df['totalaverage'] >= min_populism]
    
    # Convert to records and handle NaN values
    records = filtered_df.to_dict('records')
    
    # Replace NaN with None for JSON serialization
    for record in records:
        for key, value in record.items():
            if pd.isna(value):
                record[key] = None
    
    return {
        "data": records,
        "count": len(records)
    }


@app.get("/api/summary")
async def get_summary():
    """Get summary statistics about the dataset"""
    if df is None:
        raise HTTPException(status_code=500, detail="Data not loaded")
    
    return {
        "total_records": len(df),
        "total_countries": df['country'].nunique(),
        "total_leaders": df['leader'].nunique(),
        "year_range": {
            "min": int(df['yearbegin'].min()),
            "max": int(df['yearend_numeric'].max())
        },
        "populism_stats": {
            "mean": float(df['totalaverage'].mean()),
            "median": float(df['totalaverage'].median()),
            "min": float(df['totalaverage'].min()),
            "max": float(df['totalaverage'].max())
        },
        "regions": df['region'].value_counts().to_dict(),
        "speech_types": {
            "campaign": len(df[df['campaign_file'].notna()]),
            "famous": len(df[df['famous_file'].notna()]),
            "international": len(df[df['international_file'].notna()]),
            "ribbon": len(df[df['ribbon_file'].notna()])
        }
    }


@app.get("/api/map-data")
async def get_map_data(
    year_start: Optional[int] = None,
    year_end: Optional[int] = None,
    speech_type: Optional[str] = "total",
    time_weighted: Optional[bool] = False,
    ideology: Optional[int] = None
):
    """
    Get aggregated data for map visualization
    Returns average populism scores by country
    With time_weighted=True, weights each term by overlap years with the filter range
    ideology: -1=Left, 0=Center, 1=Right (filters leaders before averaging)
    """
    if df is None:
        raise HTTPException(status_code=500, detail="Data not loaded")
    
    filtered_df = df.copy()
    
    # Filter by ideology first (before year filtering)
    if ideology is not None:
        filtered_df = filtered_df[filtered_df['lr'] == ideology]
    
    # Filter by year range - include terms that overlap with the selected period
    # A term overlaps if: term_start <= year_end AND term_end >= year_start
    if year_start and year_end:
        filtered_df = filtered_df[
            (filtered_df['yearbegin'] <= year_end) & 
            (filtered_df['yearend_numeric'] >= year_start)
        ]
    elif year_start:
        # If only start year specified, include terms that ended on or after that year
        filtered_df = filtered_df[filtered_df['yearend_numeric'] >= year_start]
    elif year_end:
        # If only end year specified, include terms that started on or before that year
        filtered_df = filtered_df[filtered_df['yearbegin'] <= year_end]
    
    # Select the appropriate score column
    score_column_map = {
        "total": "totalaverage",
        "campaign": "campaign_average",
        "famous": "famous_average",
        "international": "international_average",
        "ribbon": "ribbon_average"
    }
    
    score_column = score_column_map.get(speech_type, "totalaverage")
    
    # Calculate time-weighted averages if requested
    if time_weighted and year_start and year_end:
        print(f"\n=== TIME-WEIGHTED CALCULATION ===")
        print(f"Filter range: {year_start} - {year_end}")
        print(f"Total terms before weighting: {len(filtered_df)}")
        
        # Calculate overlap years for each term
        filtered_df['overlap_start'] = filtered_df['yearbegin'].clip(lower=year_start)
        filtered_df['overlap_end'] = filtered_df['yearend_numeric'].clip(upper=year_end)
        filtered_df['overlap_years'] = filtered_df['overlap_end'] - filtered_df['overlap_start'] + 1
        filtered_df['weighted_score'] = filtered_df[score_column] * filtered_df['overlap_years']
        
        # Debug: Show sample calculations
        for idx, row in filtered_df.head(5).iterrows():
            print(f"  {row['country']} - {row['leader']} ({row['yearbegin']}-{row['yearend']}):")
            print(f"    Overlap: {row['overlap_start']}-{row['overlap_end']} = {row['overlap_years']} years")
            print(f"    Score: {row[score_column]:.2f} × {row['overlap_years']} years = {row['weighted_score']:.2f}")
            print(f"    Ideology: {row['lr']}")
        
        # Function to get time-weighted ideology (most years)
        def get_weighted_ideology(group):
            ideology_years = {}
            for _, row in group.iterrows():
                ideology = row['lr']
                years = row['overlap_years']
                ideology_years[ideology] = ideology_years.get(ideology, 0) + years
            # Return ideology with most years
            return max(ideology_years.items(), key=lambda x: x[1])[0]
        
        # Aggregate by country with weighted average
        country_groups = []
        for country, group in filtered_df.groupby('country'):
            country_groups.append({
                'country': country,
                'weighted_score': group['weighted_score'].sum(),
                'overlap_years': group['overlap_years'].sum(),
                'region': group['region'].iloc[0],
                'wb_region': group['wb_region'].iloc[0],
                'ideology': get_weighted_ideology(group),
                'num_terms': len(group)
            })
        
        country_data = pd.DataFrame(country_groups)
        country_data['avg_populism'] = country_data['weighted_score'] / country_data['overlap_years']
        country_data = country_data[['country', 'avg_populism', 'region', 'wb_region', 'ideology', 'num_terms']]
        
        print(f"\n=== TIME-WEIGHTED RESULTS (sample) ===")
        for _, row in country_data.head(3).iterrows():
            print(f"  {row['country']}: avg={row['avg_populism']:.2f}, ideology={row['ideology']}, terms={row['num_terms']}")
    else:
        # Standard aggregation (simple mean)
        country_data = filtered_df.groupby('country').agg({
            score_column: 'mean',
            'region': 'first',
            'wb_region': 'first',
            'lr': lambda x: x.mode()[0] if len(x.mode()) > 0 else x.iloc[0],  # Most common ideology
            'leader': 'count'  # Count number of leader terms
        }).reset_index()
        
        country_data.columns = ['country', 'avg_populism', 'region', 'wb_region', 'ideology', 'num_terms']
    
    # Convert to list of dicts
    map_data = []
    for _, row in country_data.iterrows():
        map_data.append({
            "country": row['country'],
            "avg_populism": float(row['avg_populism']) if pd.notna(row['avg_populism']) else 0,
            "region": row['region'] if pd.notna(row['region']) else "Unknown",
            "wb_region": row['wb_region'] if pd.notna(row['wb_region']) else "Unknown",
            "ideology": int(row['ideology']) if pd.notna(row['ideology']) else 0,
            "num_terms": int(row['num_terms'])
        })
    
    return {
        "map_data": map_data,
        "filters": {
            "year_start": year_start,
            "year_end": year_end,
            "speech_type": speech_type,
            "time_weighted": time_weighted
        }
    }


@app.get("/api/rankings")
async def get_rankings(
    sort_by: Optional[str] = "total",
    limit: Optional[int] = None,
    year_start: Optional[int] = None,
    year_end: Optional[int] = None,
    ideology: Optional[str] = None
):
    """
    Get ranked list of leader terms by populism scores
    ideology: comma-separated list of values (-1, 0, 1) or None for all
    """
    if df is None:
        raise HTTPException(status_code=500, detail="Data not loaded")
    
    filtered_df = df.copy()
    
    # Filter by year range - include terms that overlap with the selected period
    if year_start and year_end:
        filtered_df = filtered_df[
            (filtered_df['yearbegin'] <= year_end) & 
            (filtered_df['yearend_numeric'] >= year_start)
        ]
    elif year_start:
        filtered_df = filtered_df[filtered_df['yearend_numeric'] >= year_start]
    elif year_end:
        filtered_df = filtered_df[filtered_df['yearbegin'] <= year_end]
    
    # Filter by ideology
    if ideology:
        ideology_values = [int(x.strip()) for x in ideology.split(',')]
        filtered_df = filtered_df[filtered_df['lr'].isin(ideology_values)]
    
    # Select the appropriate score column
    score_column_map = {
        "total": "totalaverage",
        "campaign": "campaign_average",
        "famous": "famous_average",
        "international": "international_average",
        "ribbon": "ribbon_average"
    }
    
    score_column = score_column_map.get(sort_by, "totalaverage")
    
    # Sort by score (descending)
    sorted_df = filtered_df.sort_values(score_column, ascending=False)
    
    # Apply limit if specified
    if limit:
        sorted_df = sorted_df.head(limit)
    
    # Build rankings
    rankings = []
    for idx, (_, row) in enumerate(sorted_df.iterrows(), 1):
        score = row[score_column]
        if pd.isna(score):
            continue
            
        rankings.append({
            "rank": idx,
            "country": row['country'],
            "leader": row['leader'],
            "party": row['party'] if pd.notna(row['party']) else None,
            "year_start": int(row['yearbegin']),
            "year_end": row['yearend'] if row['yearend'] != 'current' else 2026,
            "term": int(row['term']),
            "lr": row['lr'] if pd.notna(row['lr']) else None,
            "region": row['region'] if pd.notna(row['region']) else None,
            "total_score": float(row['totalaverage']) if pd.notna(row['totalaverage']) else None,
            "campaign_score": float(row['campaign_average']) if pd.notna(row['campaign_average']) else None,
            "famous_score": float(row['famous_average']) if pd.notna(row['famous_average']) else None,
            "international_score": float(row['international_average']) if pd.notna(row['international_average']) else None,
            "ribbon_score": float(row['ribbon_average']) if pd.notna(row['ribbon_average']) else None,
            "primary_score": float(score)
        })
    
    return {
        "rankings": rankings,
        "count": len(rankings),
        "sort_by": sort_by,
        "filters": {
            "year_start": year_start,
            "year_end": year_end,
            "limit": limit,
            "ideology": ideology
        }
    }


@app.get("/api/timeline/{country}")
async def get_country_timeline(country: str):
    """Get timeline of populism scores for a specific country"""
    if df is None:
        raise HTTPException(status_code=500, detail="Data not loaded")
    
    country_df = df[df['country'] == country].copy()
    
    if len(country_df) == 0:
        raise HTTPException(status_code=404, detail=f"Country '{country}' not found")
    
    # Sort by year
    country_df = country_df.sort_values('yearbegin')
    
    timeline = []
    for _, row in country_df.iterrows():
        timeline.append({
            "leader": row['leader'],
            "party": row['party'] if pd.notna(row['party']) else None,
            "year_start": int(row['yearbegin']),
            "year_end": row['yearend'] if row['yearend'] != 'current' else 2026,
            "term": int(row['term']),
            "total_populism": float(row['totalaverage']) if pd.notna(row['totalaverage']) else 0,
            "campaign": float(row['campaign_average']) if pd.notna(row['campaign_average']) else None,
            "famous": float(row['famous_average']) if pd.notna(row['famous_average']) else None,
            "international": float(row['international_average']) if pd.notna(row['international_average']) else None,
            "ribbon": float(row['ribbon_average']) if pd.notna(row['ribbon_average']) else None,
        })
    
    return {
        "country": country,
        "timeline": timeline,
        "count": len(timeline)
    }


@app.get("/api/speeches")
async def get_speeches(
    country: Optional[str] = None,
    ideology: Optional[int] = None,
    speech_type: Optional[str] = None
):
    """Get list of available speeches with metadata"""
    if df is None:
        raise HTTPException(status_code=500, detail="Data not loaded")
    
    filtered_df = df.copy()
    
    # Apply filters
    if country:
        filtered_df = filtered_df[filtered_df['country'] == country]
    
    if ideology is not None:
        filtered_df = filtered_df[filtered_df['lr'] == ideology]
    
    speeches = []
    speech_columns = {
        'campaign': ['campaign_file', 'campaign_average'],
        'famous': ['famous_file', 'famous_average'],
        'international': ['international_file', 'international_average'],
        'ribbon': ['ribbon_file', 'ribbon_average']
    }
    
    # If speech_type filter is specified, only check that column
    types_to_check = [speech_type] if speech_type and speech_type != 'total' else speech_columns.keys()
    
    for _, row in filtered_df.iterrows():
        for stype in types_to_check:
            file_col, avg_col = speech_columns[stype]
            filename = row[file_col]
            
            if pd.notna(filename) and filename != '':
                # Handle ideology - convert to int only if not NaN
                ideology_val = int(row['lr']) if pd.notna(row['lr']) else None
                ideology_label = "Unknown"
                if ideology_val == -1:
                    ideology_label = "Left"
                elif ideology_val == 0:
                    ideology_label = "Center"
                elif ideology_val == 1:
                    ideology_label = "Right"
                
                speeches.append({
                    "filename": filename,
                    "country": row['country'],
                    "leader": row['leader'],
                    "party": row['party'] if pd.notna(row['party']) else None,
                    "ideology": ideology_val,
                    "ideology_label": ideology_label,
                    "speech_type": stype,
                    "populism_score": float(row[avg_col]) if pd.notna(row[avg_col]) else 0,
                    "year_start": int(row['yearbegin']),
                    "year_end": row['yearend'] if row['yearend'] != 'current' else 2026,
                    "term": int(row['term'])
                })
    
    # Sort by country, then leader, then speech type
    speeches.sort(key=lambda x: (x['country'], x['leader'], x['speech_type']))
    
    return {
        "speeches": speeches,
        "count": len(speeches),
        "filters": {
            "country": country,
            "ideology": ideology,
            "speech_type": speech_type
        }
    }


@app.get("/api/speeches/{filename}")
async def get_speech_content(filename: str):
    """Get the content of a specific speech file"""
    speeches_path = Path(__file__).parent.parent / "dataverse_files" / "speeches_20220427"
    file_path = speeches_path / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"Speech file '{filename}' not found")
    
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        word_count = len(content.split())
        
        return {
            "filename": filename,
            "content": content,
            "word_count": word_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading speech file: {str(e)}")


@app.post("/api/speeches/{filename}/analyze")
async def analyze_speech(filename: str):
    """Analyze a speech using AI to generate summary and populism assessment"""
    if llm is None:
        raise HTTPException(status_code=503, detail="AI analysis service not available")
    
    speeches_path = Path(__file__).parent.parent / "dataverse_files" / "speeches_20220427"
    file_path = speeches_path / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"Speech file '{filename}' not found")
    
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        # Truncate speech for analysis
        max_words = 2000
        words = content.split()
        if len(words) > max_words:
            analysis_content = ' '.join(words[:max_words]) + "..."
        else:
            analysis_content = content
        
        # Summary chain
        summary_template = """Analyze this political speech and provide a concise summary in 3-4 sentences.
Focus on the main themes, key messages, and overall tone.

Speech:
{speech}

Summary:"""
        summary_prompt = PromptTemplate(template=summary_template, input_variables=["speech"])
        summary_chain = summary_prompt | llm | StrOutputParser()
        
        # Populism assessment chain
        populism_template = """You are an expert political analyst specializing in populism research.
Analyze this political speech and assess its level of populism on a scale from 0 to 2.

Populism indicators include:
- Anti-elite rhetoric
- People-centrism (appeals to "the people")
- Criticism of establishment institutions
- Us vs. them framing
- Claims of representing the "real people"
- Conspiracy theories or distrust of experts

Speech excerpt:
{speech}

Provide:
1. A populism score (0-2, where 0=not populist, 1=moderately populist, 2=highly populist)
2. Brief justification (2-3 sentences)
3. Key populist phrases or themes identified

Assessment:"""
        populism_prompt = PromptTemplate(template=populism_template, input_variables=["speech"])
        populism_chain = populism_prompt | llm | StrOutputParser()
        
        # Generate analyses
        summary = summary_chain.invoke({"speech": analysis_content})
        assessment = populism_chain.invoke({"speech": analysis_content})
        
        return {
            "filename": filename,
            "summary": summary,
            "populism_assessment": assessment,
            "analyzed_words": min(len(words), max_words),
            "total_words": len(words)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing speech: {str(e)}")


    speeches_path = Path(__file__).parent.parent / "dataverse_files" / "speeches_20220427"
    file_path = speeches_path / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"Speech file '{filename}' not found")
    
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        return {
            "filename": filename,
            "content": content,
            "word_count": len(content.split())
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading speech file: {str(e)}")


# Mount static files for frontend
# Priority: frontend-react/dist (production React build) > frontend (legacy HTML)
try:
    react_dist_path = Path(__file__).parent.parent / "frontend-react" / "dist"
    legacy_static_path = Path(__file__).parent.parent / "frontend"
    
    if react_dist_path.exists():
        app.mount("/", StaticFiles(directory=str(react_dist_path), html=True), name="frontend")
        print(f"✓ Serving React build from {react_dist_path}")
    elif legacy_static_path.exists():
        app.mount("/", StaticFiles(directory=str(legacy_static_path), html=True), name="frontend")
        print(f"✓ Serving legacy frontend from {legacy_static_path}")
except Exception as e:
    print(f"Note: Frontend not mounted - {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

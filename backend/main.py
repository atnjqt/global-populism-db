"""
FastAPI backend for Global Populism Database visualization
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import pandas as pd
import json
from typing import Optional, List
from pathlib import Path

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


@app.on_event("startup")
async def load_data():
    """Load the CSV data on startup"""
    global df
    try:
        df = pd.read_csv(DATA_PATH)
        
        # Convert 'current' to 2026 for easier filtering
        df['yearend_numeric'] = df['yearend'].replace('current', 2026)
        df['yearend_numeric'] = pd.to_numeric(df['yearend_numeric'], errors='coerce')
        
        print(f"✓ Loaded {len(df)} records from {DATA_PATH.name}")
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
    speech_type: Optional[str] = "total"
):
    """
    Get aggregated data for map visualization
    Returns average populism scores by country
    """
    if df is None:
        raise HTTPException(status_code=500, detail="Data not loaded")
    
    filtered_df = df.copy()
    
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
    
    # Aggregate by country
    country_data = filtered_df.groupby('country').agg({
        score_column: 'mean',
        'region': 'first',
        'wb_region': 'first',
        'leader': 'count'  # Count number of leader terms
    }).reset_index()
    
    country_data.columns = ['country', 'avg_populism', 'region', 'wb_region', 'num_terms']
    
    # Convert to list of dicts
    map_data = []
    for _, row in country_data.iterrows():
        map_data.append({
            "country": row['country'],
            "avg_populism": float(row['avg_populism']) if pd.notna(row['avg_populism']) else 0,
            "region": row['region'] if pd.notna(row['region']) else "Unknown",
            "wb_region": row['wb_region'] if pd.notna(row['wb_region']) else "Unknown",
            "num_terms": int(row['num_terms'])
        })
    
    return {
        "map_data": map_data,
        "filters": {
            "year_start": year_start,
            "year_end": year_end,
            "speech_type": speech_type
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


# Mount static files for frontend
try:
    static_path = Path(__file__).parent.parent / "frontend"
    if static_path.exists():
        app.mount("/", StaticFiles(directory=str(static_path), html=True), name="frontend")
except Exception as e:
    print(f"Note: Frontend not mounted - {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

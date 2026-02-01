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
    speech_type: Optional[str] = "total",
    time_weighted: Optional[bool] = False
):
    """
    Get aggregated data for map visualization
    Returns average populism scores by country
    With time_weighted=True, weights each term by overlap years with the filter range
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

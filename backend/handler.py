"""
AWS Lambda handler for Global Populism Database API
Wraps FastAPI app with Mangum for Lambda compatibility
"""
from mangum import Mangum
from main import app, load_data
import asyncio

# Initialize data on cold start
asyncio.run(load_data())

# Create Lambda handler
handler = Mangum(app, lifespan="off")

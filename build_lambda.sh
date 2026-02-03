#!/bin/bash
set -e

echo "🔨 Building Lambda deployment package..."

# Clean previous builds
rm -rf lambda_package lambda_package.zip

# Create package directory
mkdir -p lambda_package

# Install dependencies
echo "📦 Installing Python dependencies..."

pip install -r requirements-lambda.txt -t lambda_package/ \
  --platform manylinux2014_x86_64 \
  --python-version 3.11 \
  --implementation cp \
  --only-binary=:all: \
  --upgrade

# Copy application code
echo "📝 Copying application code..."
cp backend/main.py lambda_package/
cp backend/handler.py lambda_package/

# Create ZIP file
echo "🗜️  Creating deployment package..."
cd lambda_package
zip -r ../lambda_package.zip . -q
cd ..

# Show package size
SIZE=$(du -h lambda_package.zip | cut -f1)
echo "✅ Deployment package created: lambda_package.zip ($SIZE)"

# Warn if too large
BYTES=$(stat -f%z lambda_package.zip 2>/dev/null || stat -c%s lambda_package.zip 2>/dev/null)
if [ $BYTES -gt 52428800 ]; then
    echo "⚠️  Warning: Package size exceeds 50MB. Consider using Lambda Layers."
fi

echo ""
echo "Next steps:"
echo "1. Upload data to S3: aws s3 sync dataverse_files/ s3://static.ejacquot.com/gpd/dataverse_files/"
echo "2. Deploy with Terraform: cd terraform && terraform init && terraform apply"

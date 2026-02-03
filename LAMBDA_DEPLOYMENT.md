# Lambda Deployment Guide

## Architecture Overview

**Frontend:** React app (deploy to S3 + CloudFront or keep local)  
**API:** Lambda + API Gateway  
**Data:** S3 bucket (CSV + speech files)  
**AI:** AWS Bedrock

## Prerequisites

- AWS CLI configured with `atn-developer` profile
- Terraform >= 1.2.0
- Python 3.11
- Existing ACM certificate for `*.ejacquot.com`
- Existing Route53 hosted zone for `ejacquot.com`

## Deployment Steps

### 1. Upload Data to S3

```bash
# Sync CSV file
aws s3 cp dataverse_files/GPD_v2.1_20251120_Wide.csv \
  s3://static.ejacquot.com/gpd/dataverse_files/ \
  --profile atn-developer

# Sync speech files
aws s3 sync dataverse_files/speeches_20251120/ \
  s3://static.ejacquot.com/gpd/dataverse_files/speeches_20251120/ \
  --profile atn-developer \
  --exclude ".DS_Store"
```

### 2. Build Lambda Package

```bash
./build_lambda.sh
```

This will:
- Install dependencies with correct architecture for Lambda
- Copy application code (main.py, handler.py)
- Create `lambda_package.zip` (~50MB)

### 3. Deploy with Terraform

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

This creates:
- Lambda function with 2GB memory, 5min timeout
- IAM role with S3 read + Bedrock invoke permissions
- API Gateway HTTP API with CORS
- Custom domain: `global-populism-db.ejacquot.com`
- Route53 A record
- CloudWatch log groups

### 4. Test the API

```bash
# Test endpoint
curl https://global-populism-db.ejacquot.com/api/summary

# Test with local API endpoint (before custom domain propagates)
export API_URL=$(terraform output -raw api_endpoint)
curl $API_URL/api/summary
```

### 5. Update Frontend (if needed)

If frontend needs to point to new API:

```typescript
// frontend-react/src/api/index.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://global-populism-db.ejacquot.com';
```

## Local Development

To test locally with S3 data:

```bash
cd backend
export AWS_PROFILE=atn-developer
export S3_BUCKET=static.ejacquot.com
export S3_PREFIX=gpd/dataverse_files
python main.py
```

## Cost Estimates

| Resource | Estimated Cost |
|----------|---------------|
| Lambda (10K requests/month) | ~$0.20 |
| API Gateway | ~$0.01 |
| S3 Storage (2GB) | ~$0.05 |
| CloudWatch Logs | ~$0.50 |
| Bedrock (per analysis) | ~$0.01-0.05 each |
| **Total (excluding Bedrock)** | **~$1/month** |

## Troubleshooting

**Cold start timeout:**
- First request may take 3-5 seconds
- Consider provisioned concurrency (+$10/month) for production

**Package too large:**
- Current package with pandas/langchain ~50MB (within 50MB limit)
- If it exceeds, move dependencies to Lambda Layer

**S3 permissions:**
- Lambda role has read access to `static.ejacquot.com/gpd/*`
- Verify bucket policy allows Lambda role

**Bedrock access:**
- Lambda needs `bedrock:InvokeModel` permission
- Models must be enabled in Bedrock console

## Cleanup

```bash
cd terraform
terraform destroy
```

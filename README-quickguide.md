# Readme Quickguide

Serverless web application on AWS for visualizing the Harvard Dataverse's Global Populism Database v2.1 (2025-11-20) dataset (see [Dataverse link](https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi:10.7910/DVN/LFTQEZ)))

## App

- **Backend**: FastAPI app deployed as AWS Lambda using API Gateway
- **Frontend**: React app deployed to S3 + CloudFront
- **API Base URL**: `https://global-populism-db.ejacquot.com/api`
- **Frontend URL**: `https://global-populism-db.ejacquot.com`
- **Data Source**: CSV files in S3 bucket `static.ejacquot.com/global-populism-db/`

## Build steps

### Build Lambda backend
```bash
./build_lambda.sh  # Build Lambda package
```

### Build React frontend
```bash
cd frontend-react
npm install
npm run build # Build React app
```
### Deploy Lambda with Terraform
```bash
cd terraform
terraform init
terraform apply --auto-approve
```
- copy app code to S3 bucket
```bash
aws s3 cp lambda_package.zip s3://static.ejacquot.com/global-populism-db/ --profile atn-developer
```

### Deploy frontend to S3
```bash
aws s3 sync frontend-react/dist/ s3://static.ejacquot.com/global-populism-db/ --profile atn-developer --delete
```

### Create CloudFront invalidation
```bash
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/global-populism-db/*" --profile atn-developer
```

## Access the app

- https://static.ejacquot.com/global-populism-db/index.html
- https://global-populism-db.ejacquot.com/docs (API docs)

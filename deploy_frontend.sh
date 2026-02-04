#!/bin/bash

# Deploy React frontend to S3 and invalidate CloudFront cache
echo "🚀 Deploying React frontend to S3..."
aws s3 sync /Users/ejacquot/Documents/Github/global-populism-db/frontend-react/dist/ s3://static.ejacquot.com/global-populism-db/ --delete --profile=atn-developer 
echo "✅ Frontend deployed to S3."
echo "🚧 Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id EL86EGEF42PND --paths "/global-populism-db/*" --profile=atn-developer
echo "✅ CloudFront cache invalidated."
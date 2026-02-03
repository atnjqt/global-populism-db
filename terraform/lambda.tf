terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  required_version = ">= 1.2.0"
}

provider "aws" {
  region  = "us-east-1"
  profile = "atn-developer"
}

# Variables
variable "app_name" {
  default = "global-populism-db"
}

variable "domain_name" {
  default = "global-populism-db.ejacquot.com"
}

variable "s3_bucket" {
  default = "static.ejacquot.com"
}

variable "s3_data_prefix" {
  default = "gpd/dataverse_files"
}

# Data sources
data "aws_route53_zone" "ejacquot" {
  name         = "ejacquot.com."
  private_zone = false
}

# Use existing certificate ARN (from Beanstalk setup)
variable "acm_certificate_arn" {
  default = "arn:aws:acm:us-east-1:579747246975:certificate/af4c521f-09a5-47ef-b931-4836e67cd03a"
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "${var.app_name}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# IAM Policy for Lambda - CloudWatch Logs
resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# IAM Policy for Lambda - S3 Read Access
resource "aws_iam_policy" "lambda_s3_policy" {
  name        = "${var.app_name}-lambda-s3-policy"
  description = "Allow Lambda to read from S3 data bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.s3_bucket}",
          "arn:aws:s3:::${var.s3_bucket}/${var.s3_data_prefix}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_s3" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_s3_policy.arn
}

# IAM Policy for Lambda - Bedrock Access
resource "aws_iam_policy" "lambda_bedrock_policy" {
  name        = "${var.app_name}-lambda-bedrock-policy"
  description = "Allow Lambda to invoke Bedrock models"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream"
        ]
        Resource = [
          "arn:aws:bedrock:us-east-1::foundation-model/us.anthropic.claude-sonnet-4-5-20250929-v1:0",
          "arn:aws:bedrock:us-east-1::foundation-model/openai.gpt-oss-120b-1:0",
          "arn:aws:bedrock:us-east-1::foundation-model/openai.gpt-oss-20b-1:0"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_bedrock" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_bedrock_policy.arn
}

# S3 bucket for Lambda deployment package
resource "aws_s3_object" "lambda_package" {
  bucket = var.s3_bucket
  key    = "gpd/lambda/lambda_package.zip"
  source = "${path.module}/../lambda_package.zip"
  etag   = filemd5("${path.module}/../lambda_package.zip")
}

# Lambda Function
resource "aws_lambda_function" "api" {
  s3_bucket        = var.s3_bucket
  s3_key           = aws_s3_object.lambda_package.key
  function_name    = "${var.app_name}-api"
  role            = aws_iam_role.lambda_role.arn
  handler         = "handler.handler"
  source_code_hash = filebase64sha256("${path.module}/../lambda_package.zip")
  runtime         = "python3.11"
  timeout         = 300  # 5 minutes for AI analysis
  memory_size     = 2048  # 2GB for pandas + langchain

  environment {
    variables = {
      S3_BUCKET = var.s3_bucket
      S3_PREFIX = var.s3_data_prefix
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_logs,
    aws_iam_role_policy_attachment.lambda_s3,
    aws_iam_role_policy_attachment.lambda_bedrock,
    aws_s3_object.lambda_package
  ]
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.api.function_name}"
  retention_in_days = 7
}

# API Gateway HTTP API
resource "aws_apigatewayv2_api" "api" {
  name          = "${var.app_name}-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["*"]
    max_age       = 300
  }
}

# API Gateway Stage
resource "aws_apigatewayv2_stage" "api" {
  api_id      = aws_apigatewayv2_api.api.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_logs.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }
}

# CloudWatch Log Group for API Gateway
resource "aws_cloudwatch_log_group" "api_logs" {
  name              = "/aws/apigateway/${var.app_name}"
  retention_in_days = 7
}

# API Gateway Integration
resource "aws_apigatewayv2_integration" "lambda" {
  api_id           = aws_apigatewayv2_api.api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.api.invoke_arn
  payload_format_version = "2.0"
}

# API Gateway Route - catch all
resource "aws_apigatewayv2_route" "default" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# Lambda Permission for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api.execution_arn}/*/*"
}

# API Gateway Custom Domain
resource "aws_apigatewayv2_domain_name" "api" {
  domain_name = var.domain_name

  domain_name_configuration {
    certificate_arn = var.acm_certificate_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }
}

# API Gateway API Mapping
resource "aws_apigatewayv2_api_mapping" "api" {
  api_id      = aws_apigatewayv2_api.api.id
  domain_name = aws_apigatewayv2_domain_name.api.id
  stage       = aws_apigatewayv2_stage.api.id
}

# Route53 Record for API
resource "aws_route53_record" "api" {
  zone_id = data.aws_route53_zone.ejacquot.id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_apigatewayv2_domain_name.api.domain_name_configuration[0].target_domain_name
    zone_id                = aws_apigatewayv2_domain_name.api.domain_name_configuration[0].hosted_zone_id
    evaluate_target_health = false
  }
}

# Outputs
output "api_endpoint" {
  value = aws_apigatewayv2_api.api.api_endpoint
}

output "custom_domain" {
  value = "https://${var.domain_name}"
}

output "lambda_function_name" {
  value = aws_lambda_function.api.function_name
}

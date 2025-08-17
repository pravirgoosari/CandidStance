#!/bin/bash

# Build and push script for CandidStance
set -e

# Configuration
ECR_REPO="041417444316.dkr.ecr.us-east-1.amazonaws.com/candidstance-app"
IMAGE_TAG="latest"
AWS_REGION="us-east-1"

echo "🚀 Building and pushing CandidStance to AWS ECR..."

# Login to ECR
echo "📝 Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPO

# Build the Docker image
echo "🔨 Building Docker image..."
docker build -t candidstance-app .

# Tag the image
echo "🏷️  Tagging image..."
docker tag candidstance-app:latest $ECR_REPO:$IMAGE_TAG

# Push to ECR
echo "⬆️  Pushing to ECR..."
docker push $ECR_REPO:$IMAGE_TAG

echo "✅ Successfully built and pushed to ECR!"
echo "🔄 Image: $ECR_REPO:$IMAGE_TAG"
echo "🚀 Ready for Kubernetes deployment!"

#!/bin/bash

# Deploy script for CandidStance to Kubernetes
set -e

echo "🚀 Deploying CandidStance to Kubernetes..."

# Create namespace if it doesn't exist
echo "📁 Creating namespace..."
kubectl create namespace candidstance --dry-run=client -o yaml | kubectl apply -f -

# Apply secrets
echo "🔐 Applying secrets..."
kubectl apply -f k8s/secrets.yaml -n candidstance

# Apply deployment
echo "📦 Applying deployment..."
kubectl apply -f k8s/deployment.yaml -n candidstance

# Apply service
echo "🔌 Applying service..."
kubectl apply -f k8s/service.yaml -n candidstance

# Apply ingress
echo "🌐 Applying ingress..."
kubectl apply -f k8s/ingress.yaml -n candidstance

# Wait for deployment to be ready
echo "⏳ Waiting for deployment to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/candidstance-app -n candidstance

echo "✅ Deployment completed successfully!"
echo "🔍 Check status with: kubectl get all -n candidstance"
echo "🌐 Ingress will be available once ALB is provisioned"

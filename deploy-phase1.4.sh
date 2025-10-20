#!/bin/bash
# Quick deployment script for Phase 1.4 corrections

set -e

echo "================================================"
echo "DEPLOYING PHASE 1.4 PHYSICS CORRECTIONS TO AZURE"
echo "================================================"
echo ""

# Variables
ACR_NAME="acrasteroidimpactckq6mn38"
CONTAINER_APP="astroimpactapi"
RESOURCE_GROUP="rg-asteroid-impact-ckq6mn38"
IMAGE_TAG="phase1.4-corrections"
FULL_IMAGE="${ACR_NAME}.azurecr.io/astroimpactapi:${IMAGE_TAG}"

echo "Configuration:"
echo "  ACR: ${ACR_NAME}"
echo "  Container App: ${CONTAINER_APP}"
echo "  Image Tag: ${IMAGE_TAG}"
echo ""

# Step 1: Login to ACR
echo "[1/4] Logging in to Azure Container Registry..."
az acr login --name ${ACR_NAME}

# Step 2: Tag image
echo "[2/4] Tagging Docker image..."
docker tag astroimpactapi:${IMAGE_TAG} ${FULL_IMAGE}

# Step 3: Push to ACR
echo "[3/4] Pushing image to ACR..."
docker push ${FULL_IMAGE}

# Step 4: Update Container App
echo "[4/4] Updating Container App..."
az containerapp update \
  --name ${CONTAINER_APP} \
  --resource-group ${RESOURCE_GROUP} \
  --image ${FULL_IMAGE}

echo ""
echo "================================================"
echo "✅ DEPLOYMENT COMPLETE"
echo "================================================"
echo ""
echo "API URL: https://astroimpactapi.proudbush-24f865c7.eastus.azurecontainerapps.io"
echo ""
echo "Test with:"
echo "  curl https://astroimpactapi.proudbush-24f865c7.eastus.azurecontainerapps.io/health"
echo ""
echo "Run 61-crater validation with:"
echo "  node tests/validation/test-61-craters-via-api.js"
echo ""
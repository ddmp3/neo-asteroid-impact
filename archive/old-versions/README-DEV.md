# 🚀 Asteroid Impact Simulator - DEVELOPMENT

⚠️ **This is the DEVELOPMENT environment** - Production is at [neo.lueger.fr](https://neo.lueger.fr)

## 🌐 Development URLs

| Service | URL |
|---------|-----|
| **Frontend** | https://lively-water-02a3d060f-preview.eastus2.1.azurestaticapps.net |
| **API** | https://ca-api-lgfjbo72.ambitiousflower-98a4df12.canadacentral.azurecontainerapps.io |
| **Swagger UI** | https://ca-api-lgfjbo72.ambitiousflower-98a4df12.canadacentral.azurecontainerapps.io/api-docs |
| **Health Check** | https://ca-api-lgfjbo72.ambitiousflower-98a4df12.canadacentral.azurecontainerapps.io/api/health |

## ☁️ Azure Infrastructure

- **Subscription**: dev-meteormadness
- **Resource Group**: rg-asteroid-impact-lgfjbo72
- **Container Registry**: acrasteroidimpactlgfjbo72.azurecr.io
- **Environment**: Development

## 🔄 Deployment Workflow

### 1. Build & Deploy API
```bash
cd asteroid-impact-simulator/api
docker buildx build --platform linux/amd64 -t acrasteroidimpactlgfjbo72.azurecr.io/asteroid-api:latest --push .
az containerapp update --name ca-api-lgfjbo72 --resource-group rg-asteroid-impact-lgfjbo72 --image acrasteroidimpactlgfjbo72.azurecr.io/asteroid-api:latest
```

### 2. Build & Deploy Frontend
```bash
cd asteroid-impact-simulator/web
npm run build
npx @azure/static-web-apps-cli deploy --deployment-token $(cd ../../terraform && terraform output -raw web_deployment_token) --app-location dist
```

## 🛠️ Local Development

### API
```bash
cd asteroid-impact-simulator/api
npm install
npm run dev  # Runs on https://api.neo.lueger.fr
```

### Frontend
```bash
cd asteroid-impact-simulator/web
npm install
npm run dev  # Runs on https://neo.lueger.fr
```

## 🔐 Environment Variables

### API (.env)
```
PORT=7071
NASA_API_KEY=DEMO_KEY
NODE_ENV=development
```

### Frontend (.env.production)
```
VITE_API_URL=https://ca-api-lgfjbo72.ambitiousflower-98a4df12.canadacentral.azurecontainerapps.io
```

## 📚 Documentation

See [DEV_URLS.md](DEV_URLS.md) for complete URL reference.

## ⚠️ Important Notes

- **DO NOT** use production URLs (neo.lueger.fr) in dev code
- **DO NOT** push to production Azure subscription
- All changes go to GitHub branch `dev` on `ddmp3/meteormadness`

## 🔗 Related

- **Production**: https://neo.lueger.fr
- **Prod GitHub**: https://github.com/TawbeBaker/Cyber-and-Space
- **Dev GitHub**: https://github.com/ddmp3/meteormadness

---

**Version**: 1.1-dev
**Environment**: Development
**Last Updated**: 2025-10-08

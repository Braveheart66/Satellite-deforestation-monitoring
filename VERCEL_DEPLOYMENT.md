# Vercel Deployment Setup Guide

## Quick Start
1. Push your code to GitHub (✅ Already done)
2. Connect GitHub repo to Vercel
3. Set environment variables in Vercel
4. Deploy

---

## Step 1: Connect Repository to Vercel

1. Go to https://vercel.com
2. Click "Add New..." → "Project"
3. Select "Import Git Repository"
4. Search for: `Satellite-deforestation-monitoring`
5. Click "Import"
6. Configure project settings (default is fine)
7. Click "Deploy"

---

## Step 2: Set Environment Variables

⚠️ **IMPORTANT**: The frontend needs the backend API URL

1. After deployment starts, go to **Project Settings**
2. Navigate to **Environment Variables**
3. Add the following:

   **For Frontend** (`frontend/` root):
   ```
   NEXT_PUBLIC_API_BASE=https://your-backend-api-url.com
   ```
   
   Replace `https://your-backend-api-url.com` with your actual backend URL:
   - If using **Render**: `https://satellite-backend-xxxxx.onrender.com`
   - If using **Railway**: `https://your-app.railway.app`
   - If using **Heroku**: `https://your-app.herokuapp.com`
   - If local: `http://localhost:8000`

4. Click "Save"
5. Trigger a redeploy

---

## What Was Fixed

The deployment failed due to:

1. **Missing Dependencies** - Added required packages:
   - `react-leaflet` - Map component library
   - `react-leaflet-draw` - Drawing tools for map
   - `leaflet` - Base mapping library
   - `leaflet-draw` - Draw library CSS
   - `prop-types` - Type validation
   - `@types/leaflet` - TypeScript types

2. **CSS Import Issue** - Removed unused Mapbox references from `globals.css`

3. **Peer Dependency Handling** - Created `.npmrc` with `legacy-peer-deps=true` to handle React 18 + react-leaflet@5 compatibility

4. **Environment Configuration**:
   - Created `frontend/.env.example` for documentation
   - `.env.local` works locally but NOT on Vercel (must use project settings)

---

## Verification

After deployment, the site should:
- ✅ Load the map interface
- ✅ Display area of interest (AOI) selection
- ✅ Show drone upload section
- ✅ Show time period selection
- ✅ Show "Run Analysis" button
- ✅ Connect to backend API when analysis runs

If any section is missing, check:
1. Browser console for errors (F12 → Console)
2. Vercel deployment logs
3. Environment variables are set correctly
4. Backend API is running and accessible

---

## Rollback (if needed)

If deployment fails:
1. Go to Vercel → Deployments
2. Find the last successful deployment
3. Click "⋮" → "Promote to Production"

---

## Local Development

To test locally before deploying:

```bash
cd frontend
npm install
npm run build
npm run start
```

Then visit: `http://localhost:3000`

---

## Troubleshooting

**Issue**: "Build failed"
- **Fix**: Check Vercel build logs → fix in code → push to GitHub

**Issue**: "API not responding"
- **Fix**: Verify `NEXT_PUBLIC_API_BASE` is set in Vercel Environment Variables

**Issue**: "Map not loading"
- **Fix**: Ensure Leaflet CSS is loading (check Network tab in DevTools)

**Issue**: "Cannot import module X"
- **Fix**: Check `package.json` has the dependency listed

---

**Last Updated**: March 23, 2026
**Status**: ✅ Ready for Vercel Deployment

# GitHub Secrets Setup for Vercel Deployment

Follow these steps to set up GitHub Actions for automatic deployment to Vercel.

## Required GitHub Secrets

You need to add the following secrets to your GitHub repository:

### 1. VERCEL_TOKEN
1. Go to https://vercel.com/account/tokens
2. Click "Create Token"
3. Give it a name like "GitHub Actions Deploy"
4. Copy the token (you won't see it again!)

### 2. VERCEL_ORG_ID
```
team_qcTZruijbGjJhazKurtXx4yA
```

### 3. VERCEL_PROJECT_ID
```
prj_MOLNmvxMvimDhQxtAYrAWzhwcK65
```

## How to Add Secrets to GitHub

1. Go to your repository: https://github.com/fol2/health_tracking
2. Click on **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add each secret:
   - Name: `VERCEL_TOKEN`
   - Value: (paste your token from Vercel)
   - Click "Add secret"
6. Repeat for:
   - Name: `VERCEL_ORG_ID`
   - Value: `team_qcTZruijbGjJhazKurtXx4yA`
7. And:
   - Name: `VERCEL_PROJECT_ID`
   - Value: `prj_MOLNmvxMvimDhQxtAYrAWzhwcK65`

## Testing the Deployment

Once all secrets are added, the deployment will trigger automatically when you:
- Push to the `main` branch
- Make changes in the `health-tracker/` directory

The workflow will:
1. Build your project
2. Deploy to Vercel production
3. Show deployment status in GitHub Actions tab

## Monitoring Deployments

Check deployment status at:
- GitHub Actions: https://github.com/fol2/health_tracking/actions
- Vercel Dashboard: https://vercel.com/fol2s-projects/health-tracker

## Troubleshooting

If deployment fails:
1. Check GitHub Actions logs for errors
2. Verify all secrets are correctly set
3. Ensure Vercel token hasn't expired
4. Check that project IDs match your Vercel project
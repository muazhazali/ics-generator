# 🚀 Netlify Deployment Guide

This guide will walk you through deploying your ICS Generator app to Netlify.

## Prerequisites

- ✅ Git repository (GitHub, GitLab, or Bitbucket)
- ✅ Netlify account (free tier available)
- ✅ Cerebras API key
- ✅ Your project files are ready

## Step 1: Prepare Your Repository

1. **Commit all changes** to your Git repository:
   ```bash
   git add .
   git commit -m "Prepare for Netlify deployment"
   git push origin main
   ```

## Step 2: Connect to Netlify

1. **Go to [Netlify](https://netlify.com)** and sign in
2. **Click "Add new site"** → "Import an existing project"
3. **Choose your Git provider** (GitHub, GitLab, etc.)
4. **Select your repository** (`ics-generator`)
5. **Configure build settings**:
   - **Build command**: `pnpm build`
   - **Publish directory**: Leave empty (handled by plugin)
   - **Base directory**: Leave empty

## Step 3: Environment Variables

In your Netlify dashboard, go to **Site settings** → **Environment variables** and add:

| Variable | Value | Description |
|----------|-------|-------------|
| `CEREBRAS_API_KEY` | `your_api_key_here` | Your Cerebras AI API key |
| `ADMIN_TOKEN` | `your_secure_token` | Admin access token |
| `NODE_ENV` | `production` | Environment mode |
| `ALLOWED_ORIGINS` | `https://your-site.netlify.app` | Your Netlify domain |

### Getting Your Netlify Domain
After deployment, your site will be available at: `https://[random-name].netlify.app`
You can customize this in **Site settings** → **Domain management**.

## Step 4: Deploy

1. **Click "Deploy site"** in Netlify
2. **Wait for build** (usually 2-5 minutes)
3. **Check deploy logs** if there are any issues

## Step 5: Post-Deployment Setup

### Update CORS Settings
Once deployed, update your environment variables:
- Set `ALLOWED_ORIGINS` to your actual Netlify URL
- Redeploy if needed

### Custom Domain (Optional)
1. Go to **Domain settings** in Netlify
2. Add your custom domain
3. Update DNS records as instructed
4. Update `ALLOWED_ORIGINS` environment variable

## Troubleshooting

### Build Fails
- Check the **Deploy logs** in Netlify dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### API Routes Not Working
- Ensure `@netlify/plugin-nextjs` is installed
- Check `netlify.toml` configuration
- Verify environment variables are set

### CORS Issues
- Update `ALLOWED_ORIGINS` with your Netlify domain
- Check middleware configuration
- Redeploy after changes

### File Upload Issues
- Netlify has a 6MB limit for serverless functions
- Large files might need different handling
- Consider using Netlify Large Media for assets

## Monitoring

### Check Site Health
```bash
# Test your deployed site
curl https://your-site.netlify.app/api/detect-timezone
```

### Admin Stats
Visit: `https://your-site.netlify.app/api/admin/stats?token=YOUR_ADMIN_TOKEN`

## Automatic Deployments

Netlify automatically deploys when you push to your main branch:
```bash
git add .
git commit -m "Update feature"
git push origin main
# Netlify will automatically deploy
```

## Performance Tips

1. **Enable Branch Deploys** for testing
2. **Use Netlify Analytics** for monitoring
3. **Enable Asset Optimization** in site settings
4. **Set up Form Handling** if needed

## Security Checklist

- ✅ Environment variables are set
- ✅ CORS is properly configured
- ✅ Admin token is secure
- ✅ HTTPS is enabled (automatic)
- ✅ Security headers are configured

## Support

- [Netlify Documentation](https://docs.netlify.com/)
- [Next.js on Netlify](https://docs.netlify.com/frameworks/next-js/)
- [Netlify Community](https://community.netlify.com/)

---

**🎉 Your ICS Generator is now live on Netlify!** 
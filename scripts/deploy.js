#!/usr/bin/env node

/**
 * Netlify Deployment Helper Script
 * This script helps prepare and validate the deployment to Netlify
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Netlify Deployment Helper');
console.log('============================\n');

// Check if required files exist
const requiredFiles = [
  'netlify.toml',
  'next.config.mjs',
  'package.json'
];

console.log('✅ Checking required files...');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✓ ${file} exists`);
  } else {
    console.log(`   ❌ ${file} is missing`);
    process.exit(1);
  }
});

// Check environment variables
console.log('\n🔧 Environment Variables Check:');
console.log('Make sure to set these in Netlify dashboard:');
console.log('   - CEREBRAS_API_KEY');
console.log('   - ADMIN_TOKEN');
console.log('   - ALLOWED_ORIGINS (your Netlify domain)');
console.log('   - NODE_ENV=production');

// Check package.json scripts
console.log('\n📦 Build Configuration:');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
if (packageJson.scripts && packageJson.scripts.build) {
  console.log('   ✓ Build script found');
} else {
  console.log('   ❌ Build script missing');
}

console.log('\n🎯 Next Steps:');
console.log('1. Push your code to GitHub/GitLab');
console.log('2. Connect your repository to Netlify');
console.log('3. Set environment variables in Netlify dashboard');
console.log('4. Deploy!');

console.log('\n✨ Deployment ready!'); 
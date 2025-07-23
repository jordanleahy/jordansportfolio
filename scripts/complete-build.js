#!/usr/bin/env node

/**
 * Complete build script that generates static OG files before building SPA
 * This ensures the static HTML files are available in public/ during Vite build
 */

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

console.log('🚀 Starting complete build process...\n');

async function ensureDirectories() {
  const dirs = [
    'public/blog',
    'dist'
  ];
  
  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
      console.log(`✓ Ensured directory: ${dir}`);
    } catch (error) {
      console.log(`Directory ${dir} already exists or created`);
    }
  }
}

async function generateStaticOG() {
  console.log('\n📄 Generating static OG HTML files...');
  
  try {
    // Run the OG generation script
    execSync('node scripts/generate-static-og.js', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log('✅ Static OG files generated successfully');
  } catch (error) {
    console.error('❌ Failed to generate static OG files:', error.message);
    throw error;
  }
}

async function runTypeScript() {
  console.log('\n🔧 Running TypeScript compilation...');
  
  try {
    execSync('tsc', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log('✅ TypeScript compilation completed');
  } catch (error) {
    console.error('❌ TypeScript compilation failed:', error.message);
    throw error;
  }
}

async function runViteBuild() {
  console.log('\n📦 Building SPA with Vite...');
  
  try {
    execSync('vite build', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log('✅ Vite build completed');
  } catch (error) {
    console.error('❌ Vite build failed:', error.message);
    throw error;
  }
}

async function copyStaticFiles() {
  console.log('\n📋 Copying static OG files to dist...');
  
  try {
    const blogDir = path.join(process.cwd(), 'public', 'blog');
    const distBlogDir = path.join(process.cwd(), 'dist', 'blog');
    
    // Check if source directory exists
    try {
      await fs.access(blogDir);
    } catch {
      console.log('⚠️ No static blog files found, skipping copy');
      return;
    }
    
    // Ensure destination directory exists
    await fs.mkdir(distBlogDir, { recursive: true });
    
    // Copy all HTML files
    const files = await fs.readdir(blogDir);
    const htmlFiles = files.filter(file => file.endsWith('.html') || file.endsWith('.json'));
    
    for (const file of htmlFiles) {
      const sourcePath = path.join(blogDir, file);
      const destPath = path.join(distBlogDir, file);
      await fs.copyFile(sourcePath, destPath);
      console.log(`✓ Copied: ${file}`);
    }
    
    console.log(`✅ Copied ${htmlFiles.length} static files to dist/blog/`);
  } catch (error) {
    console.error('❌ Failed to copy static files:', error.message);
    // Don't throw - this is not critical for the build
  }
}

async function generateBuildInfo() {
  console.log('\n📊 Generating build info...');
  
  const buildInfo = {
    buildTime: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    staticOGGenerated: true,
    buildScript: 'scripts/complete-build.js'
  };
  
  try {
    await fs.writeFile(
      path.join(process.cwd(), 'dist', 'build-info.json'),
      JSON.stringify(buildInfo, null, 2)
    );
    console.log('✅ Build info generated');
  } catch (error) {
    console.log('⚠️ Could not generate build info:', error.message);
  }
}

async function main() {
  const startTime = Date.now();
  
  try {
    // Step 1: Ensure required directories exist
    await ensureDirectories();
    
    // Step 2: Generate static OG HTML files FIRST
    await generateStaticOG();
    
    // Step 3: Run TypeScript compilation
    await runTypeScript();
    
    // Step 4: Build SPA with Vite (includes copying public/ to dist/)
    await runViteBuild();
    
    // Step 5: Ensure static files are properly placed
    await copyStaticFiles();
    
    // Step 6: Generate build metadata
    await generateBuildInfo();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('\n🎉 Build completed successfully!');
    console.log(`⏱️ Total build time: ${duration}s`);
    console.log('\n📁 Generated files:');
    console.log('- dist/ (SPA build)');
    console.log('- dist/blog/*.html (Static OG files)');
    console.log('- public/blog/*.html (Source static files)');
    
  } catch (error) {
    console.error('\n💥 Build failed:', error.message);
    process.exit(1);
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\n⚠️ Build interrupted by user');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️ Build terminated');
  process.exit(1);
});

// Run the complete build
main();
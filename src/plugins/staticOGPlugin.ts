import { Plugin } from 'vite';
import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

export interface StaticOGPluginOptions {
  enabled?: boolean;
  outputDir?: string;
  verbose?: boolean;
}

/**
 * Vite plugin to generate static OG HTML files before build
 */
export function staticOGPlugin(options: StaticOGPluginOptions = {}): Plugin {
  const {
    enabled = true,
    outputDir = 'public/blog',
    verbose = false
  } = options;

  let isProduction = false;
  let hasGenerated = false;

  return {
    name: 'static-og-generator',
    
    configResolved(config) {
      isProduction = config.command === 'build';
      if (verbose) {
        console.log(`Static OG Plugin: ${isProduction ? 'Production' : 'Development'} mode`);
      }
    },

    async buildStart() {
      if (!enabled || !isProduction || hasGenerated) {
        return;
      }

      console.log('🔄 Generating static OG HTML files...');
      
      try {
        // Ensure output directory exists
        await fs.mkdir(outputDir, { recursive: true });
        
        // Run the static OG generation script
        execSync('node scripts/generate-static-og.js', {
          stdio: verbose ? 'inherit' : 'pipe',
          cwd: process.cwd()
        });
        
        hasGenerated = true;
        console.log('✅ Static OG files generated successfully');
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('❌ Failed to generate static OG files:', errorMessage);
        throw error;
      }
    },

    async generateBundle() {
      if (!enabled || !isProduction) {
        return;
      }

      // Verify that static files exist and will be copied
      try {
        const files = await fs.readdir(outputDir);
        const htmlFiles = files.filter(f => f.endsWith('.html'));
        
        if (htmlFiles.length > 0) {
          console.log(`📁 Found ${htmlFiles.length} static OG files to include in build`);
        } else {
          console.warn('⚠️ No static OG HTML files found');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn('⚠️ Could not verify static OG files:', errorMessage);
      }
    }
  };
}

/**
 * Development server middleware for serving static OG files
 */
export function staticOGMiddleware() {
  return (req: any, res: any, next: any) => {
    const url = req.url;
    
    // Check if this is a request for a blog post that might need OG
    if (url.startsWith('/blog/') && url.endsWith('.html')) {
      const slug = path.basename(url, '.html');
      const filePath = path.join(process.cwd(), 'public', 'blog', `${slug}.html`);
      
      // Try to serve the static file if it exists
      fs.readFile(filePath, 'utf8')
        .then(content => {
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(content);
        })
        .catch(() => {
          // File doesn't exist, continue to SPA
          next();
        });
    } else {
      next();
    }
  };
}

export default staticOGPlugin;
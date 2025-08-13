import { useState, useCallback, useRef, useEffect } from 'react';
import { ColorTheme } from '@/types/colorTheme';
import { supabase } from '@/integrations/supabase/client';

interface ColorThemeAnalysis {
  dominantHue: number;
  saturation: number;
  lightness: number;
  temperature: 'warm' | 'cool' | 'neutral';
  contrast: 'high' | 'medium' | 'low';
  harmony: string;
  accessibility: {
    wcagAA: boolean;
    wcagAAA: boolean;
    contrastRatio: number;
  };
}

interface ComputedColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  gradients: {
    primary: string;
    secondary: string;
    hero: string;
  };
  shadows: {
    soft: string;
    medium: string;
    strong: string;
  };
  overlays: {
    light: string;
    medium: string;
    dark: string;
  };
}

interface ColorThemeCache {
  themeId: string;
  analysis: ColorThemeAnalysis;
  computed: ComputedColorScheme;
  timestamp: number;
  usage: number;
}

export const useEnhancedColorThemeProcessing = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  
  // Multi-layer caching
  const analysisCache = useRef(new Map<string, ColorThemeCache>());
  const computationCache = useRef(new Map<string, ComputedColorScheme>());
  
  // Background processing queue
  const processingQueue = useRef<ColorTheme[]>([]);
  const isBackgroundProcessing = useRef(false);

  const hexToHsl = useCallback((hex: string): [number, number, number] => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    const sum = max + min;
    
    const l = sum / 2;
    let s = 0;
    let h = 0;

    if (diff !== 0) {
      s = l > 0.5 ? diff / (2 - sum) : diff / sum;
      
      switch (max) {
        case r:
          h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / diff + 2) / 6;
          break;
        case b:
          h = ((r - g) / diff + 4) / 6;
          break;
      }
    }

    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  }, []);

  const calculateContrastRatio = useCallback((color1: string, color2: string): number => {
    const getLuminance = (hex: string): number => {
      const rgb = [
        parseInt(hex.slice(1, 3), 16),
        parseInt(hex.slice(3, 5), 16),
        parseInt(hex.slice(5, 7), 16)
      ].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      
      return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
    };

    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  }, []);

  const analyzeColorTheme = useCallback(async (
    colorTheme: ColorTheme
  ): Promise<ColorThemeAnalysis> => {
    const cacheKey = `${colorTheme.id}_analysis`;
    const cached = analysisCache.current.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < 3600000) { // 1 hour cache
      cached.usage++;
      return cached.analysis;
    }

    const [primaryH, primaryS, primaryL] = hexToHsl(colorTheme.primary_color);
    const [secondaryH, secondaryS, secondaryL] = hexToHsl(colorTheme.secondary_color);
    
    // Determine temperature based on hue
    const getTemperature = (hue: number): 'warm' | 'cool' | 'neutral' => {
      if (hue >= 315 || hue <= 45) return 'warm'; // Red-orange
      if (hue >= 46 && hue <= 135) return 'neutral'; // Yellow-green
      if (hue >= 136 && hue <= 225) return 'cool'; // Green-blue
      if (hue >= 226 && hue <= 314) return 'warm'; // Blue-purple
      return 'neutral';
    };

    // Calculate contrast
    const contrastRatio = calculateContrastRatio(colorTheme.primary_color, '#ffffff');
    const contrastLevel = contrastRatio >= 7 ? 'high' : contrastRatio >= 4.5 ? 'medium' : 'low';

    // Determine color harmony
    const hueDiff = Math.abs(primaryH - secondaryH);
    const harmony = hueDiff < 30 ? 'monochromatic' :
                   hueDiff < 90 ? 'analogous' :
                   hueDiff < 150 ? 'complementary' :
                   'triadic';

    const analysis: ColorThemeAnalysis = {
      dominantHue: primaryH,
      saturation: primaryS,
      lightness: primaryL,
      temperature: getTemperature(primaryH),
      contrast: contrastLevel,
      harmony,
      accessibility: {
        wcagAA: contrastRatio >= 4.5,
        wcagAAA: contrastRatio >= 7,
        contrastRatio
      }
    };

    // Cache the analysis
    const cacheEntry: ColorThemeCache = {
      themeId: colorTheme.id!,
      analysis,
      computed: await computeEnhancedColorScheme(colorTheme, analysis),
      timestamp: Date.now(),
      usage: 1
    };
    
    analysisCache.current.set(cacheKey, cacheEntry);
    
    return analysis;
  }, [hexToHsl, calculateContrastRatio]);

  const computeEnhancedColorScheme = useCallback(async (
    colorTheme: ColorTheme,
    analysis?: ColorThemeAnalysis
  ): Promise<ComputedColorScheme> => {
    const computeKey = `${colorTheme.id}_computed`;
    const cached = computationCache.current.get(computeKey);
    
    if (cached) return cached;

    const themeAnalysis = analysis || await analyzeColorTheme(colorTheme);
    
    // Generate enhanced color variations
    const generateShade = (color: string, percentage: number): string => {
      const num = parseInt(color.replace('#', ''), 16);
      const amt = Math.round(2.55 * percentage);
      const R = (num >> 16) + amt;
      const G = (num >> 8 & 0x00FF) + amt;
      const B = (num & 0x0000FF) + amt;
      
      return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    };

    // Generate accent color based on color theory
    const generateAccent = (): string => {
      if (colorTheme.accent_color) return colorTheme.accent_color;
      
      // Generate complementary accent
      const [h, s, l] = hexToHsl(colorTheme.primary_color);
      const complementaryH = (h + 180) % 360;
      
      // Convert back to hex (simplified)
      return themeAnalysis.temperature === 'warm' ? '#4ade80' : 
             themeAnalysis.temperature === 'cool' ? '#f97316' : '#a855f7';
    };

    const computed: ComputedColorScheme = {
      primary: colorTheme.primary_color,
      secondary: colorTheme.secondary_color,
      accent: generateAccent(),
      gradients: {
        primary: `linear-gradient(135deg, ${colorTheme.primary_color}, ${generateShade(colorTheme.primary_color, 15)})`,
        secondary: `linear-gradient(135deg, ${colorTheme.secondary_color}, ${generateShade(colorTheme.secondary_color, 15)})`,
        hero: `linear-gradient(135deg, ${colorTheme.primary_color}, ${colorTheme.secondary_color})`
      },
      shadows: {
        soft: `0 4px 6px -1px ${colorTheme.primary_color}20`,
        medium: `0 10px 15px -3px ${colorTheme.primary_color}25`,
        strong: `0 20px 25px -5px ${colorTheme.primary_color}30`
      },
      overlays: {
        light: `${colorTheme.primary_color}10`,
        medium: `${colorTheme.primary_color}20`,
        dark: `${colorTheme.primary_color}40`
      }
    };

    computationCache.current.set(computeKey, computed);
    
    // Store analysis in memory for now
    console.log('✅ Color theme processed and cached');

    return computed;
  }, [analyzeColorTheme]);

  const processThemeInBackground = useCallback(async (colorTheme: ColorTheme) => {
    processingQueue.current.push(colorTheme);
    
    if (!isBackgroundProcessing.current) {
      isBackgroundProcessing.current = true;
      
      while (processingQueue.current.length > 0) {
        const theme = processingQueue.current.shift();
        if (theme) {
          try {
            await analyzeColorTheme(theme);
            await computeEnhancedColorScheme(theme);
          } catch (error) {
            console.error('Background color processing failed:', error);
          }
        }
      }
      
      isBackgroundProcessing.current = false;
    }
  }, [analyzeColorTheme, computeEnhancedColorScheme]);

  const batchProcessThemes = useCallback(async (
    themes: ColorTheme[],
    onProgress?: (processed: number, total: number) => void
  ) => {
    setIsProcessing(true);
    setProcessingProgress(0);
    
    try {
      for (let i = 0; i < themes.length; i++) {
        await processThemeInBackground(themes[i]);
        
        const progress = Math.round(((i + 1) / themes.length) * 100);
        setProcessingProgress(progress);
        onProgress?.(i + 1, themes.length);
        
        // Small delay to prevent overwhelming
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  }, [processThemeInBackground]);

  const getOptimizedThemeForContext = useCallback(async (
    colorTheme: ColorTheme,
    context: 'hero' | 'content' | 'accent' | 'background'
  ): Promise<ComputedColorScheme> => {
    const computed = await computeEnhancedColorScheme(colorTheme);
    
    // Return context-specific optimizations
    switch (context) {
      case 'hero':
        return {
          ...computed,
          gradients: {
            ...computed.gradients,
            primary: computed.gradients.hero
          }
        };
      case 'accent':
        return {
          ...computed,
          primary: computed.accent,
          secondary: computed.primary
        };
      default:
        return computed;
    }
  }, [computeEnhancedColorScheme]);

  const clearColorCache = useCallback(() => {
    analysisCache.current.clear();
    computationCache.current.clear();
  }, []);

  const getCacheStats = useCallback(() => {
    const analysisSize = analysisCache.current.size;
    const computationSize = computationCache.current.size;
    const totalUsage = Array.from(analysisCache.current.values())
      .reduce((sum, cache) => sum + cache.usage, 0);
    
    return {
      analysisCache: analysisSize,
      computationCache: computationSize,
      totalUsage,
      queueLength: processingQueue.current.length,
      isBackgroundProcessing: isBackgroundProcessing.current
    };
  }, []);

  return {
    analyzeTheme: analyzeColorTheme,
    computeScheme: computeEnhancedColorScheme,
    processInBackground: processThemeInBackground,
    batchProcess: batchProcessThemes,
    getOptimizedTheme: getOptimizedThemeForContext,
    clearCache: clearColorCache,
    getCacheStats,
    isProcessing,
    processingProgress
  };
};
import { useDebouncedCallback } from "use-debounce";
import type { IUpdateProcessor, RealtimeUpdate, ProcessedUpdate } from "../interfaces/IUpdateProcessor";
import { realtimeLogger } from "./RealtimeLogger";

export class RealtimeUpdateProcessor implements IUpdateProcessor {
  private lastProcessedImageUpdate: Record<string, number> = {};
  private debounceDelay = 1000;

  process(update: RealtimeUpdate): ProcessedUpdate | null {
    const startTime = Date.now();
    
    try {
      realtimeLogger.info('update', 'Processing realtime update', { 
        table: update.table, 
        eventType: update.eventType 
      });

      if (update.table === 'social_media_posts' && update.eventType === 'UPDATE') {
        return this.processSocialMediaPostUpdate(update);
      }

      realtimeLogger.debug('update', 'Update ignored - not relevant for processing', {
        table: update.table,
        eventType: update.eventType
      });

      return null;
    } catch (error) {
      realtimeLogger.error('update', `Error processing update: ${error}`, {
        table: update.table,
        eventType: update.eventType,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    } finally {
      const processingTime = Date.now() - startTime;
      realtimeLogger.info('performance', 'Update processed', { processingTime });
    }
  }

  private processSocialMediaPostUpdate(update: RealtimeUpdate): ProcessedUpdate | null {
    const newRecord = update.new;
    const oldRecord = update.old;

    if (!newRecord || !oldRecord) {
      return null;
    }

    // Check for image status changes
    const imageStatusChanged = this.hasImageStatusChanged(oldRecord, newRecord);
    const imageUrlChanged = this.hasImageUrlChanged(oldRecord, newRecord);

    if (imageStatusChanged || imageUrlChanged) {
      const postId = newRecord.id;
      const category = newRecord.category || 'unknown';

      // Check if this is a duplicate update (debouncing)
      if (this.shouldDebounce(update)) {
        realtimeLogger.info('performance', 'Update debounced - too recent', { 
          postId, 
          category 
        });
        return null;
      }

      // Track this update
      this.lastProcessedImageUpdate[postId] = Date.now();

      return {
        type: 'image_status_change',
        data: {
          postId,
          category,
          oldImageStatus: oldRecord.image_status,
          newImageStatus: newRecord.image_status,
          oldImageUrl: oldRecord.image_url,
          newImageUrl: newRecord.image_url,
          title: newRecord.title
        },
        shouldInvalidateCache: true,
        cacheKeys: [
          'social_media_posts',
          `posts-${category}`,
          `categories`
        ]
      };
    }

    return null;
  }

  private hasImageStatusChanged(oldRecord: any, newRecord: any): boolean {
    return oldRecord.image_status !== newRecord.image_status;
  }

  private hasImageUrlChanged(oldRecord: any, newRecord: any): boolean {
    return oldRecord.image_url !== newRecord.image_url;
  }

  shouldDebounce(update: RealtimeUpdate): boolean {
    if (update.table === 'social_media_posts' && update.new?.id) {
      const postId = update.new.id;
      const lastUpdate = this.lastProcessedImageUpdate[postId];
      
      if (lastUpdate && (Date.now() - lastUpdate) < this.debounceDelay) {
        return true;
      }
    }
    
    return false;
  }

  // Method to clean up old debounce entries
  cleanupDebounceHistory(): void {
    const cutoff = Date.now() - (this.debounceDelay * 10); // Keep 10x debounce delay
    Object.keys(this.lastProcessedImageUpdate).forEach(postId => {
      if (this.lastProcessedImageUpdate[postId] < cutoff) {
        delete this.lastProcessedImageUpdate[postId];
      }
    });
  }
}
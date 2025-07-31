export interface RealtimeUpdate {
  table: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: Record<string, any>;
  old?: Record<string, any>;
  timestamp: number;
}

export interface ProcessedUpdate {
  type: 'image_status_change' | 'post_created' | 'post_deleted';
  data: any;
  shouldInvalidateCache: boolean;
  cacheKeys?: string[];
}

export interface IUpdateProcessor {
  process(update: RealtimeUpdate): ProcessedUpdate | null;
  shouldDebounce(update: RealtimeUpdate): boolean;
}
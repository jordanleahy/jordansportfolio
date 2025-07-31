export interface ICacheManager {
  invalidate(keys: string[]): void;
  invalidatePattern(pattern: string): void;
  getInvalidationCount(): number;
}
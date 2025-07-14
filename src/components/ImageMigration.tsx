import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { migrateHeroParallaxImages } from '@/utils/storageImageUpload';

export const ImageMigration = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleMigration = async () => {
    setIsUploading(true);
    try {
      const migrationResults = await migrateHeroParallaxImages();
      setResults(migrationResults);
      console.log('Migration completed:', migrationResults);
    } catch (error) {
      console.error('Migration failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-muted">
      <h3 className="text-lg font-semibold mb-4">Hero Parallax Image Migration</h3>
      <Button 
        onClick={handleMigration} 
        disabled={isUploading}
        className="mb-4"
      >
        {isUploading ? 'Uploading Images...' : 'Migrate Images to Storage'}
      </Button>
      
      {results.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Migration Results:</h4>
          {results.map((result, index) => (
            <div key={index} className="text-sm">
              {result.success ? '✅' : '❌'} {result.fileName}
              {result.error && <span className="text-destructive ml-2">{result.error}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
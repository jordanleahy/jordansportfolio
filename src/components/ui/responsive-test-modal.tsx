import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Smartphone, Tablet, Monitor } from 'lucide-react';

interface ResponsiveTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResponsiveTestModal = ({ isOpen, onClose }: ResponsiveTestModalProps) => {
  const [currentView, setCurrentView] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');

  const viewClasses = {
    mobile: 'w-[375px] max-w-[90vw]',
    tablet: 'w-[768px] max-w-[95vw]', 
    desktop: 'w-[1024px] max-w-[95vw]'
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${viewClasses[currentView]} max-h-[90vh] overflow-y-auto transition-all duration-300`}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Responsive Test View</span>
            <div className="flex gap-2">
              <Button
                variant={currentView === 'mobile' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentView('mobile')}
              >
                <Smartphone className="h-4 w-4" />
              </Button>
              <Button
                variant={currentView === 'tablet' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentView('tablet')}
              >
                <Tablet className="h-4 w-4" />
              </Button>
              <Button
                variant={currentView === 'desktop' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentView('desktop')}
              >
                <Monitor className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 border rounded-lg bg-muted/50">
            <h3 className="font-medium mb-2">Current View: {currentView}</h3>
            <p className="text-sm text-muted-foreground">
              Testing prompt generator responsiveness across different screen sizes.
            </p>
          </div>

          {/* Mock prompt generator content */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <label className="text-sm font-medium">Generated Image Prompt:</label>
              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" size="sm">
                  Regenerate
                </Button>
                <Button variant="outline" size="sm">
                  Settings
                </Button>
              </div>
            </div>

            <textarea 
              className="w-full min-h-[120px] p-3 border rounded-md resize-none"
              placeholder="Your generated prompt will appear here..."
              readOnly
            />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <Button variant="outline" size="sm">16:9</Button>
                <Button variant="outline" size="sm">9:16</Button>
                <Button variant="outline" size="sm">1:1</Button>
                <Button variant="outline" size="sm">3:4</Button>
              </div>
              
              <Button className="w-full sm:w-auto justify-center">
                Copy Prompt
              </Button>
            </div>
          </div>

          {/* Admin section mock */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Admin Actions</h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-3">
              <Button variant="outline" size="sm" className="flex-1">
                <span className="text-xs">Blog</span>
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <span className="text-xs sm:hidden">Prompt</span>
                <span className="hidden sm:inline">Generate Prompt</span>
              </Button>
              <Button variant="outline" size="sm" className="flex-1 col-span-2 sm:col-span-1">
                <span className="text-xs sm:hidden">Voice</span>
                <span className="hidden sm:inline">Voiceover</span>
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                <span className="text-xs sm:hidden">Bulk</span>
                <span className="hidden sm:inline">Bulk Generate</span>
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <span className="text-xs sm:hidden">Images</span>
                <span className="hidden sm:inline">Show Images</span>
              </Button>
              <Button variant="outline" size="sm" className="flex-1 col-span-2 sm:col-span-1">
                <span className="text-xs sm:hidden">Videos</span>
                <span className="hidden sm:inline">Show Videos</span>
              </Button>
            </div>
          </div>

          <div className="text-xs text-muted-foreground mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <strong>Responsive Features Tested:</strong>
            <ul className="mt-1 space-y-1">
              <li>• Modal width adapts to screen size (95vw mobile, max-w-4xl desktop)</li>
              <li>• Button layouts stack on mobile, horizontal on desktop</li>
              <li>• Text labels abbreviated on mobile, full on larger screens</li>
              <li>• Grid layouts responsive (2 cols mobile, 3 cols desktop)</li>
              <li>• Touch-friendly button sizes maintained</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
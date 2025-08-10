import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Menu, ArrowRight } from 'lucide-react';

export default function Homepage() {
  const [theme, setTheme] = useState('');
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (theme.trim()) {
      setShowModal(true);
    }
  };

  const handleConfirm = () => {
    setShowModal(false);
    // Navigate to stories page or create new theme
    navigate('/stories');
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://wgwmzfbnkovumqcvsxgd.supabase.co/storage/v1/object/public/general/Story%20ship.png')`
        }}
      />
      
      {/* Wave Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80" />
      
      {/* Animated Wave SVG */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden">
        <svg 
          viewBox="0 0 1200 120" 
          preserveAspectRatio="none" 
          className="relative block w-full h-16 animate-pulse"
        >
          <path 
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" 
            className="fill-background/60"
          />
        </svg>
      </div>

      {/* Top Navigation */}
      <div className="absolute top-6 right-6 z-20">
        <Button
          variant="outline"
          size="icon"
          className="bg-primary/20 border-primary/30 backdrop-blur-sm hover:bg-primary/30"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <Card className="w-full max-w-2xl mx-auto bg-background/95 backdrop-blur-sm shadow-2xl border-0 animate-fade-in">
          <CardHeader className="text-center space-y-4 pb-8">
            <CardTitle className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Story Ship
            </CardTitle>
            <CardDescription className="text-xl md:text-2xl text-muted-foreground">
              Every Thought is a Visual Journey
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Describe your theme... (e.g., 'AI app')"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full h-14 text-lg bg-muted/50 border-muted-foreground/20 focus:border-primary/50 focus:ring-primary/20"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-14 text-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium group"
                disabled={!theme.trim()}
              >
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </form>
            
            <div className="text-center text-sm text-muted-foreground">
              By Jordan Leahy
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Your Theme</DialogTitle>
            <DialogDescription>
              You're about to start creating content for the theme: 
              <span className="font-semibold text-foreground"> "{theme}"</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              Yes, Let's Go!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
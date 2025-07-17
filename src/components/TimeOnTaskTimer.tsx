import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Clock, RotateCcw, Activity, Square } from 'lucide-react';
import { useTimeOnTask } from '@/hooks/useTimeOnTask';
export const TimeOnTaskTimer: React.FC = () => {
  const [guessInput, setGuessInput] = useState('');
  const {
    currentSessionTime,
    totalTime,
    sessionCount,
    isActive,
    isStopped,
    userGuess,
    formatTime,
    getAverageSessionTime,
    resetData,
    stopSession,
    submitGuess
  } = useTimeOnTask();
  const handleGuessSubmit = () => {
    const guess = parseInt(guessInput);
    if (!isNaN(guess) && guess > 0) {
      submitGuess(guess);
      setGuessInput('');
    }
  };
  return <Card className="border border-muted-foreground/20">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5 text-primary" />
          Hit Stop to Guess Your Time on Task
          {isActive}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="text-center">
            <div className={`text-2xl font-mono font-bold text-primary transition-all duration-300 ${isActive && !isStopped || isStopped && userGuess === null ? 'blur-md select-none' : ''}`}>
              {formatTime(currentSessionTime)}
            </div>
            <div className="text-sm text-muted-foreground">Current Session</div>
            
            {/* Stop Button */}
            {isActive && !isStopped && <Button onClick={stopSession} size="sm" className="mt-2" variant="destructive">
                <Square className="h-3 w-3 mr-1" />
                Stop Session
              </Button>}
            
            {/* Guess Input */}
            {isStopped && <div className="mt-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  How long do you think this session was? (in minutes)
                </p>
                <div className="flex gap-2 items-center justify-center">
                  <Input type="number" placeholder="5" value={guessInput} onChange={e => setGuessInput(e.target.value)} className="w-20 text-center" min="1" />
                  <Button onClick={handleGuessSubmit} size="sm" disabled={!guessInput || parseInt(guessInput) <= 0}>
                    Submit Guess
                  </Button>
                </div>
              </div>}
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-mono font-bold text-foreground">
              {formatTime(totalTime)}
            </div>
            <div className="text-sm text-muted-foreground">Total Time</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-mono font-bold text-foreground">
              {sessionCount}
            </div>
            <div className="text-sm text-muted-foreground">Sessions</div>
          </div>
        </div>
        
        {sessionCount > 0 && <div className="pt-2 border-t border-muted-foreground/10">
            <div className="text-center">
              <div className="text-lg font-mono text-muted-foreground">
                {formatTime(getAverageSessionTime())}
              </div>
              <div className="text-xs text-muted-foreground">Average per session</div>
            </div>
          </div>}
        
        <div className="flex justify-center pt-2">
          <Button variant="outline" size="sm" onClick={resetData} className="text-xs">
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset Data
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground/70 text-center">
          Data stored locally in your browser
        </div>
      </CardContent>
    </Card>;
};
/**
 * Color Safety Utilities
 * 
 * Provides safety mechanisms for real-time color updates including
 * rate limiting, conflict resolution, and rollback capabilities.
 */

interface ColorChangeLog {
  id: string;
  timestamp: number;
  userId: string;
  property: string;
  oldValue: string;
  newValue: string;
  isReverted?: boolean;
}

interface ConflictResolution {
  strategy: 'last-writer-wins' | 'merge' | 'manual';
  mergedColors?: Record<string, string>;
  requiresUserInput?: boolean;
}

class ColorSafetyManager {
  private changeLog: ColorChangeLog[] = [];
  private readonly maxLogSize = 100;
  private readonly rateLimitWindow = 1000; // 1 second
  private readonly maxChangesPerWindow = 5;
  private userChangeTimestamps: Map<string, number[]> = new Map();
  
  /**
   * Rate limiting to prevent spam color changes
   */
  checkRateLimit(userId: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const userTimestamps = this.userChangeTimestamps.get(userId) || [];
    
    // Remove timestamps outside the rate limit window
    const validTimestamps = userTimestamps.filter(
      timestamp => now - timestamp < this.rateLimitWindow
    );
    
    this.userChangeTimestamps.set(userId, validTimestamps);
    
    const remaining = Math.max(0, this.maxChangesPerWindow - validTimestamps.length);
    const resetTime = validTimestamps.length > 0 
      ? validTimestamps[0] + this.rateLimitWindow 
      : now;
    
    return {
      allowed: validTimestamps.length < this.maxChangesPerWindow,
      remaining,
      resetTime
    };
  }

  /**
   * Records a color change in the log
   */
  logColorChange(
    userId: string,
    property: string,
    oldValue: string,
    newValue: string
  ): string {
    const id = this.generateChangeId();
    const change: ColorChangeLog = {
      id,
      timestamp: Date.now(),
      userId,
      property,
      oldValue,
      newValue
    };

    this.changeLog.unshift(change);
    
    // Maintain log size
    if (this.changeLog.length > this.maxLogSize) {
      this.changeLog = this.changeLog.slice(0, this.maxLogSize);
    }

    // Update rate limiting
    const userTimestamps = this.userChangeTimestamps.get(userId) || [];
    userTimestamps.push(change.timestamp);
    this.userChangeTimestamps.set(userId, userTimestamps);

    return id;
  }

  /**
   * Resolves conflicts when multiple users change colors simultaneously
   */
  resolveConflict(
    incomingChanges: Record<string, { value: string; userId: string; timestamp: number }>,
    currentState: Record<string, string>
  ): ConflictResolution {
    const conflictingProperties = Object.keys(incomingChanges);
    const recentChanges = this.getRecentChanges(5000); // Last 5 seconds
    
    // Check for actual conflicts
    const hasConflicts = conflictingProperties.some(property => {
      return recentChanges.some(change => 
        change.property === property && 
        change.userId !== incomingChanges[property].userId
      );
    });

    if (!hasConflicts) {
      // No conflict, apply all changes
      return {
        strategy: 'last-writer-wins',
        mergedColors: Object.fromEntries(
          Object.entries(incomingChanges).map(([prop, change]) => [prop, change.value])
        )
      };
    }

    // Attempt smart merge based on change timing and properties
    const mergedColors: Record<string, string> = { ...currentState };
    let requiresUserInput = false;

    for (const [property, change] of Object.entries(incomingChanges)) {
      const conflictingChange = recentChanges.find(
        log => log.property === property && log.userId !== change.userId
      );

      if (conflictingChange) {
        // Check if changes can be safely merged
        if (this.canAutoMerge(property, change.value, conflictingChange.newValue)) {
          // Use the most recent change
          mergedColors[property] = change.timestamp > conflictingChange.timestamp 
            ? change.value 
            : conflictingChange.newValue;
        } else {
          requiresUserInput = true;
        }
      } else {
        mergedColors[property] = change.value;
      }
    }

    return {
      strategy: requiresUserInput ? 'manual' : 'merge',
      mergedColors,
      requiresUserInput
    };
  }

  /**
   * Reverts a specific color change
   */
  revertChange(changeId: string): { success: boolean; revertedChange?: ColorChangeLog } {
    const changeIndex = this.changeLog.findIndex(change => change.id === changeId);
    
    if (changeIndex === -1) {
      return { success: false };
    }

    const change = this.changeLog[changeIndex];
    
    // Mark as reverted
    change.isReverted = true;
    
    // Log the revert action
    this.logColorChange(
      'system',
      change.property,
      change.newValue,
      change.oldValue
    );

    return { success: true, revertedChange: change };
  }

  /**
   * Gets recent changes within a time window
   */
  getRecentChanges(timeWindowMs: number): ColorChangeLog[] {
    const cutoff = Date.now() - timeWindowMs;
    return this.changeLog.filter(
      change => change.timestamp > cutoff && !change.isReverted
    );
  }

  /**
   * Creates a safe rollback point
   */
  createRollbackPoint(currentColors: Record<string, string>): string {
    const rollbackId = this.generateChangeId();
    
    // Store current state as a special log entry
    for (const [property, value] of Object.entries(currentColors)) {
      this.changeLog.unshift({
        id: `${rollbackId}-${property}`,
        timestamp: Date.now(),
        userId: 'system-rollback',
        property,
        oldValue: value,
        newValue: value, // Same value, this is just a marker
      });
    }

    return rollbackId;
  }

  /**
   * Rolls back to a specific point
   */
  rollbackToPoint(rollbackId: string): Record<string, string> | null {
    const rollbackEntries = this.changeLog.filter(
      change => change.id.startsWith(rollbackId) && change.userId === 'system-rollback'
    );

    if (rollbackEntries.length === 0) {
      return null;
    }

    return Object.fromEntries(
      rollbackEntries.map(entry => [entry.property, entry.oldValue])
    );
  }

  /**
   * Validates that a color change is safe to apply
   */
  validateSafetyConstraints(
    property: string,
    newValue: string,
    context: {
      currentColors: Record<string, string>;
      userRole?: string;
      userId: string;
    }
  ): { safe: boolean; warnings: string[]; blockers: string[] } {
    const warnings: string[] = [];
    const blockers: string[] = [];

    // Rate limiting check
    const rateLimit = this.checkRateLimit(context.userId);
    if (!rateLimit.allowed) {
      blockers.push(`Rate limit exceeded. ${rateLimit.remaining} changes remaining.`);
    }

    // Property-specific safety checks
    if (property === '--background' && this.isExtremeColor(newValue)) {
      warnings.push('Extreme background colors may impact readability');
    }

    if (property === '--foreground' && this.isExtremeColor(newValue)) {
      warnings.push('Extreme text colors may impact readability');
    }

    // System color protection
    if (this.isSystemCriticalColor(property) && context.userRole !== 'admin') {
      blockers.push('Only administrators can modify system-critical colors');
    }

    // Conflict detection
    const recentChanges = this.getRecentChanges(2000);
    const hasRecentConflict = recentChanges.some(
      change => change.property === property && change.userId !== context.userId
    );

    if (hasRecentConflict) {
      warnings.push('Another user recently modified this color. Consider coordinating changes.');
    }

    return {
      safe: blockers.length === 0,
      warnings,
      blockers
    };
  }

  /**
   * Gets change statistics for monitoring
   */
  getChangeStatistics(timeWindowMs: number = 60000): {
    totalChanges: number;
    uniqueUsers: number;
    mostChangedProperty: string;
    averageChangesPerUser: number;
  } {
    const recentChanges = this.getRecentChanges(timeWindowMs);
    const uniqueUsers = new Set(recentChanges.map(change => change.userId)).size;
    
    // Count changes per property
    const propertyChanges = recentChanges.reduce((acc, change) => {
      acc[change.property] = (acc[change.property] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostChangedProperty = Object.entries(propertyChanges)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'none';

    return {
      totalChanges: recentChanges.length,
      uniqueUsers,
      mostChangedProperty,
      averageChangesPerUser: uniqueUsers > 0 ? recentChanges.length / uniqueUsers : 0
    };
  }

  // Private helper methods

  private generateChangeId(): string {
    return `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private canAutoMerge(property: string, value1: string, value2: string): boolean {
    // Very conservative auto-merge - only if values are very similar
    return value1 === value2;
  }

  private isExtremeColor(color: string): boolean {
    // Simple check for very light or very dark colors
    const isWhite = /^(#f{6}|#fff|rgb\(255,\s*255,\s*255\)|white)$/i.test(color);
    const isBlack = /^(#0{6}|#000|rgb\(0,\s*0,\s*0\)|black)$/i.test(color);
    return isWhite || isBlack;
  }

  private isSystemCriticalColor(property: string): boolean {
    const criticalColors = ['--primary', '--background', '--foreground'];
    return criticalColors.includes(property);
  }
}

export const colorSafetyManager = new ColorSafetyManager();

// Export utility functions
export const createSafeColorUpdate = async (
  changes: Record<string, string>,
  context: { userId: string; userRole?: string }
): Promise<{
  safeChanges: Record<string, string>;
  blockedChanges: Record<string, string>;
  warnings: string[];
}> => {
  const safeChanges: Record<string, string> = {};
  const blockedChanges: Record<string, string> = {};
  const warnings: string[] = [];

  for (const [property, value] of Object.entries(changes)) {
    const safety = colorSafetyManager.validateSafetyConstraints(
      property,
      value,
      {
        currentColors: {}, // Would be populated with actual current colors
        userId: context.userId,
        userRole: context.userRole
      }
    );

    if (safety.safe) {
      safeChanges[property] = value;
    } else {
      blockedChanges[property] = value;
    }

    warnings.push(...safety.warnings);
  }

  return { safeChanges, blockedChanges, warnings };
};
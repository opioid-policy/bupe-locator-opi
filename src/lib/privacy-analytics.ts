// src/lib/privacy-analytics.ts - Privacy-preserving analytics
class PrivacyAnalytics {
  private static instance: PrivacyAnalytics;
  private pendingEvents: Array<{event: string, state?: string}> = [];
  private lastSent = 0;
  private sessionEventCounts: Record<string, number> = {};
  private batchTimer: NodeJS.Timeout | null = null;
  
  static getInstance() {
    if (!PrivacyAnalytics.instance) {
      PrivacyAnalytics.instance = new PrivacyAnalytics();
    }
    return PrivacyAnalytics.instance;
  }
  
  trackEvent(eventName: string, state?: string) {
    // Client-side rate limiting (resets on page refresh)
    const sessionCount = this.sessionEventCounts[eventName] || 0;
    if (sessionCount >= 10) return; // Max 10 of same event per session
    
    this.sessionEventCounts[eventName] = sessionCount + 1;
    
    // Add to pending batch
    this.pendingEvents.push({ 
      event: eventName, 
      state: state || undefined // Don't include if not provided
    });
    
    // Batch send events every 30 seconds or when leaving page
    if (Date.now() - this.lastSent > 30000) {
      this.sendBatch();
    } else if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => this.sendBatch(), 30000);
    }
  }
  
  private async sendBatch() {
    if (this.pendingEvents.length === 0) return;
    
    const events = [...this.pendingEvents];
    this.pendingEvents = [];
    this.lastSent = Date.now();
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    
    try {
      // NO fingerprinting data - only event names and optional state
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          events,
          // Only timestamp for rate limiting, not tracking
          timestamp: Date.now()
        })
      });
    } catch {
      // Silently fail - analytics shouldn't break user experience
      console.debug('Analytics batch failed - this is ok');
    }
  }
  
  // Send any pending events when page unloads
  flush() {
    if (this.pendingEvents.length > 0) {
      // Use sendBeacon for reliability on page unload
      const data = JSON.stringify({ 
        events: this.pendingEvents,
        timestamp: Date.now()
      });
      navigator.sendBeacon('/api/analytics', data);
      this.pendingEvents = [];
    }
  }
}

export const analytics = PrivacyAnalytics.getInstance();

// Flush on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    analytics.flush();
  });
}
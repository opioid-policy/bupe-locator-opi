// src/lib/privacy-analytics.ts - Updated without IP
class PrivacyAnalytics {
  private static instance: PrivacyAnalytics;
  private pendingEvents: Array<{event: string, state?: string}> = [];
  private lastSent = 0;
  private sessionEventCounts: Record<string, number> = {};
  
  static getInstance() {
    if (!PrivacyAnalytics.instance) {
      PrivacyAnalytics.instance = new PrivacyAnalytics();
    }
    return PrivacyAnalytics.instance;
  }
  
  trackEvent(eventName: string, state?: string) {
    // Simple client-side spam prevention (resets on page refresh)
    const sessionCount = this.sessionEventCounts[eventName] || 0;
    if (sessionCount >= 10) return; // Max 10 of same event per session
    
    this.sessionEventCounts[eventName] = sessionCount + 1;
    this.pendingEvents.push({ event: eventName, state });
    
    // Batch send events every 30 seconds
    if (Date.now() - this.lastSent > 30000) {
      this.sendBatch();
    }
  }
  
  private async sendBatch() {
    if (this.pendingEvents.length === 0) return;
    
    const events = [...this.pendingEvents];
    this.pendingEvents = [];
    this.lastSent = Date.now();
    
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          events,
          timestamp: Date.now() // For basic temporal validation only
        })
      });
    } catch (error) {
      // Silently fail - analytics shouldn't break user experience
      console.debug('Analytics batch failed:', error);
    }
  }
}

export const analytics = PrivacyAnalytics.getInstance();
export interface AirtableRecord {
  id: string;
  fields: {
    event_type: string;
    count: number;
    aggregation_level: string;
    state?: string;
  };
}

export interface AirtableUpdateRecord {
  id: string;
  fields: {
    count: number;
  };
}

export interface AirtableCreateRecord {
  fields: {
    event_type: string;
    count: number;
    aggregation_level: string;
    state?: string;
  };
}

export type EventType =
  | 'find-pharmacy-click'
  | 'report-pharmacy-click'
  | 'report-submitted'
  | 'language-switched';


export interface AnalyticsData {
  byState: Record<string, {
    'find-pharmacy-click': number;
    'report-pharmacy-click': number;
    'report-submitted': number;
    'language-switched': number;
  }>;
  totals: {
    'find-pharmacy-click': number;
    'report-pharmacy-click': number;
    'report-submitted': number;
    'language-switched': number;
  };
}

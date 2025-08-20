// src/lib/airtable-api.ts
// Direct Airtable API helper - replaces the Airtable SDK
// Benefits: No deprecation warnings, smaller bundle, more control

// Define proper types for Airtable field values
type AirtableFieldValue = string | number | boolean | string[] | null | undefined;
type AirtableFields = Record<string, AirtableFieldValue>;

interface AirtableConfig {
  baseId?: string;
  tableName?: string;
  apiKey?: string;
}

interface AirtableRecord {
  id?: string;
  fields: AirtableFields;
  createdTime?: string;
}

interface AirtableResponse {
  records: AirtableRecord[];
  offset?: string;
}

interface AirtableError {
  error: {
    type: string;
    message: string;
  };
}

class AirtableAPI {
  private baseUrl: string;
  private headers: HeadersInit;
  private tableName: string;

  constructor(config?: AirtableConfig) {
    const baseId = config?.baseId || process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID;
    this.tableName = config?.tableName || process.env.NEXT_PUBLIC_AIRTABLE_TABLE_NAME || 'Reports';
    const apiKey = config?.apiKey || process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;

    if (!baseId || !apiKey) {
      throw new Error('Airtable configuration missing: baseId and apiKey required');
    }

    this.baseUrl = `https://api.airtable.com/v0/${baseId}`;
    this.headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Create one or more records
   */
  async create(fields: AirtableFields | AirtableFields[]): Promise<AirtableRecord[]> {
    const records = Array.isArray(fields) 
      ? fields.map(f => ({ fields: f }))
      : [{ fields }];

    const response = await fetch(`${this.baseUrl}/${this.tableName}`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ records }),
    });

    if (!response.ok) {
      const error = await response.json() as AirtableError;
      throw new Error(`Airtable create failed: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json() as AirtableResponse;
    return data.records;
  }

  /**
   * Select records with optional filtering
   */
  async select(options?: {
    fields?: string[];
    filterByFormula?: string;
    maxRecords?: number;
    pageSize?: number;
    sort?: Array<{ field: string; direction?: 'asc' | 'desc' }>;
    view?: string;
  }): Promise<AirtableRecord[]> {
    const params = new URLSearchParams();
    
    if (options?.fields) {
      options.fields.forEach(field => params.append('fields[]', field));
    }
    if (options?.filterByFormula) {
      params.append('filterByFormula', options.filterByFormula);
    }
    if (options?.maxRecords) {
      params.append('maxRecords', options.maxRecords.toString());
    }
    if (options?.pageSize) {
      params.append('pageSize', options.pageSize.toString());
    }
    if (options?.sort) {
      options.sort.forEach((s, i) => {
        params.append(`sort[${i}][field]`, s.field);
        if (s.direction) {
          params.append(`sort[${i}][direction]`, s.direction);
        }
      });
    }
    if (options?.view) {
      params.append('view', options.view);
    }

    const allRecords: AirtableRecord[] = [];
    let offset: string | undefined;

    // Handle pagination
    do {
      if (offset) {
        params.set('offset', offset);
      }

      const response = await fetch(`${this.baseUrl}/${this.tableName}?${params.toString()}`, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        const error = await response.json() as AirtableError;
        throw new Error(`Airtable select failed: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json() as AirtableResponse;
      allRecords.push(...data.records);
      offset = data.offset;

      // Respect maxRecords if specified
      if (options?.maxRecords && allRecords.length >= options.maxRecords) {
        break;
      }
    } while (offset);

    return allRecords;
  }

  /**
   * Get all records (convenience method)
   */
  async all(): Promise<AirtableRecord[]> {
    return this.select();
  }

  /**
   * Update records
   */
  async update(updates: Array<{ id: string; fields: AirtableFields }>): Promise<AirtableRecord[]> {
    const records = updates.map(u => ({
      id: u.id,
      fields: u.fields,
    }));

    const response = await fetch(`${this.baseUrl}/${this.tableName}`, {
      method: 'PATCH',
      headers: this.headers,
      body: JSON.stringify({ records }),
    });

    if (!response.ok) {
      const error = await response.json() as AirtableError;
      throw new Error(`Airtable update failed: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json() as AirtableResponse;
    return data.records;
  }

  /**
   * Delete records
   */
  async delete(recordIds: string[]): Promise<{ deleted: boolean; id: string }[]> {
    const params = new URLSearchParams();
    recordIds.forEach(id => params.append('records[]', id));

    const response = await fetch(`${this.baseUrl}/${this.tableName}?${params.toString()}`, {
      method: 'DELETE',
      headers: this.headers,
    });

    if (!response.ok) {
      const error = await response.json() as AirtableError;
      throw new Error(`Airtable delete failed: ${error.error?.message || response.statusText}`);
    }

    interface DeleteResponse {
      records: Array<{ deleted: boolean; id: string }>;
    }
    
    const data = await response.json() as DeleteResponse;
    return data.records;
  }
}

// Export a default instance
export const airtableAPI = new AirtableAPI();

// Export the class for custom configurations
export default AirtableAPI;

// Export types for use in other files
export type { AirtableRecord, AirtableFields, AirtableFieldValue };
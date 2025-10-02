"use client";

import { useState, useEffect } from 'react';
import styles from './Dashboard.module.css';

// Define types matching your Airtable structure
type ReportType = 'success' | 'denial';

interface AirtableReport {
  reportType: ReportType;
  formulations: string[];
  standardizedNotes: string[];
  zipCode: string;
  state: string;
  submissionTime: string;
}

interface StateStats {
  success: number;
  denied: number;
  lastUpdated: string;
}

interface AnalyticsData {
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

interface DashboardData {
  pastMonth: {
    total: number;
    success: number;
    denied: number;
    period: string;
  };
  allTime: {
    total: number;
    success: number;
    denied: number;
  };
  byState: Record<string, { 
    pastMonth: { success: number; denied: number; lastUpdated: string };
    allTime: { success: number; denied: number; lastUpdated: string };
  }>;
  formulations: Array<{
    name: string;
    success: number;
    denied: number;
  }>;
  barriers: Array<{
    note: string;
    count: number;
  }>;
}

// Define these constants directly in the file
const formulationOptions = [
'Suboxone (film)', 'Buprenorphine/Naloxone (film; generic)', 'Buprenorphine/Naloxone (tablet; generic)', 'Buprenorphine (tablet; mono product; generic)', 'Zubsolv (tablet)',   'Sublocade shot (fills prescription)',
  'Sublocade shot (gives shot)',
  'Brixadi shot (fills prescription)',
  'Brixadi shot (gives shot)'
];

const standardizedNoteOptions = [
'Will order, but not in stock', 'Partial fill (did not fill the full prescription)', 'Best to call ahead', 'Only fills for existing patients', 'Only fills from prescribers "close-by"', 'Only fill from certain prescribers', 'Only fills for patients "close-by"', 'Long wait times', 'Won\'t accept cash', 'Helpful staff', 'Unhelpful staff', 'Permanently closed'
];

// Helper function to get month names
function getMonthInfo() {
  const now = new Date();
  
  // Past month = the most recently completed month
  const pastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1);
  const pastMonth = pastMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  
  return { pastMonth };
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData>({
    pastMonth: { total: 0, success: 0, denied: 0, period: '' },
    allTime: { total: 0, success: 0, denied: 0 },
    byState: {},
    formulations: formulationOptions.map(name => ({ name, success: 0, denied: 0 })),
    barriers: standardizedNoteOptions.map(note => ({ note, count: 0 }))
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);


  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch data for different time periods
        // "previous-month" in the API = the most recently completed month
        const [pastMonthRes, allTimeRes] = await Promise.all([
          fetch('/api/reports?timeframe=past-month').then(res => res.json()),
          fetch('/api/reports').then(res => res.json())
        ]);

        // Check for API errors
        if (pastMonthRes.error || allTimeRes.error) {
          throw new Error(pastMonthRes.error || allTimeRes.error);
        }


        // Process the data
        const processReports = (reports: AirtableReport[]) => {
          // Process state data
          const byState: Record<string, StateStats> = {};
          reports.forEach(report => {
            const state = report.state || 'Unknown';
            if (!byState[state]) {
              byState[state] = { success: 0, denied: 0, lastUpdated: '' };
            }
            
            if (report.reportType === 'success') {
              byState[state].success++;
            } else {
              byState[state].denied++;
            }
            
            // Track most recent submission
            if (!byState[state].lastUpdated || 
                new Date(report.submissionTime) > new Date(byState[state].lastUpdated)) {
              byState[state].lastUpdated = report.submissionTime;
            }
          });

          // Process formulation data
          const formulations = formulationOptions.map(name => ({ name, success: 0, denied: 0 }));
          reports.forEach(report => {
            report.formulations?.forEach(formulation => {
              const idx = formulations.findIndex(f => f.name === formulation);
              if (idx !== -1) {
                if (report.reportType === 'success') {
                  formulations[idx].success++;
                } else {
                  formulations[idx].denied++;
                }
              }
            });
          });

          // Process barrier data
          const barriers = standardizedNoteOptions.map(note => ({ note, count: 0 }));
          reports.forEach(report => {
            if (report.reportType === 'denial' && report.standardizedNotes) {
              report.standardizedNotes.forEach(note => {
                const idx = barriers.findIndex(b => b.note === note);
                if (idx !== -1) {
                  barriers[idx].count++;
                }
              });
            }
          });

          // Sort barriers by count
          barriers.sort((a, b) => b.count - a.count);

          // Calculate totals
          const total = reports.length;
          const success = reports.filter(r => r.reportType === 'success').length;
          const denied = reports.filter(r => r.reportType === 'denial').length;

          return {
            total,
            success,
            denied,
            byState,
            formulations,
            barriers
          };
        };

        const pastMonthData = processReports(pastMonthRes.data || []);
        const allTimeData = processReports(allTimeRes.data || []);
        const { pastMonth } = getMonthInfo();

        // Combine state data from both timeframes for the table
        const combinedStateData: Record<string, { 
          pastMonth: { success: number; denied: number; lastUpdated: string };
          allTime: { success: number; denied: number; lastUpdated: string };
        }> = {};

        // Get all unique states from both datasets
        const allStates = new Set([
          ...Object.keys(pastMonthData.byState),
          ...Object.keys(allTimeData.byState)
        ]);

        allStates.forEach(state => {
          combinedStateData[state] = {
            pastMonth: pastMonthData.byState[state] || { success: 0, denied: 0, lastUpdated: '' },
            allTime: allTimeData.byState[state] || { success: 0, denied: 0, lastUpdated: '' }
          };
        });

        setData({
          pastMonth: {
            total: pastMonthData.total,
            success: pastMonthData.success,
            denied: pastMonthData.denied,
            period: pastMonth
          },
          allTime: {
            total: allTimeData.total,
            success: allTimeData.success,
            denied: allTimeData.denied
          },
          byState: combinedStateData,
          formulations: allTimeData.formulations,
          barriers: allTimeData.barriers
        });

        // Set last updated timestamp
        setLastUpdated(allTimeRes.generatedAt || new Date().toISOString());
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        setLoading(false);
        console.error(err);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/dashboard/analytics');
        if (response.ok) {
          const data = await response.json();
          setAnalyticsData(data);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      }
    };
    
    fetchAnalytics();
  }, []);

  // Scroll to top when data finishes loading
  useEffect(() => {
    if (!loading && !error) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [loading, error]);

  if (loading) return <div className={styles.loading}>Loading dashboard...</div>;
  if (error) return <div className={styles.error}>Error: {error}</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Bupe Access Dashboard</h1>

      {/* 1. High-Level Stats */}
      <div className={styles.statsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Report Statistics</h2>
          {lastUpdated && (
            <div className={styles.lastUpdated}>
              Last updated: {new Date(lastUpdated).toLocaleString()}
              <br />
              <small>Data refreshes automatically at the start of each month</small>
            </div>
          )}
        </div>
        <div className={styles.statsGrid}>
           <StatCard
            title="All Time"
            total={data.allTime.total}
            success={data.allTime.success}
            denied={data.allTime.denied}
            subtitle="Total Reports"
          />
          <StatCard
            title={`Past Month (${data.pastMonth.period})`}
            total={data.pastMonth.total}
            success={data.pastMonth.success}
            denied={data.pastMonth.denied}
            subtitle="Total Reports"
          />
        </div>
      </div>

      {/* 2. State by State Table */}
      <div className={styles.tableSection}>
        <h2 className={styles.sectionTitle}>State Level Reports</h2>
        <div className={styles.tableContainer}>
          {Object.keys(data.byState).length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th></th>
                  <th colSpan={2}>{data.pastMonth.period}</th>
                  <th colSpan={2}>All Time</th>
                  <th>Last Updated</th>
                </tr>
                <tr>
                  <th>State</th>
                  <th>Success</th>
                  <th>Denied</th>
                  <th>Success</th>
                  <th>Denied</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(data.byState)
                  .sort(([, a], [, b]) => 
                    (b.allTime.success + b.allTime.denied) - (a.allTime.success + a.allTime.denied)
                  )
                  .map(([state, stats]) => (
                    <tr key={state}>
                      <td>{state}</td>
                      <td className={styles.successCell}>{stats.pastMonth.success}</td>
                      <td className={styles.deniedCell}>{stats.pastMonth.denied}</td>
                      <td className={styles.successCell}>{stats.allTime.success}</td>
                      <td className={styles.deniedCell}>{stats.allTime.denied}</td>
                      <td>
                        {stats.allTime.lastUpdated ? 
                          new Date(stats.allTime.lastUpdated).toLocaleDateString() : 'N/A'
                        }
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          ) : (
            <div className={styles.noData}>No state data available</div>
          )}
        </div>
        <br/><em>Scroll left to right on mobile</em> ↔️
      </div>

      {/* 3. Analytics Table */}

      {analyticsData && (
        <div className={styles.tableSection}>
          <h2 className={styles.sectionTitle}>User Interactions (Privacy-Preserved)</h2>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>State</th>
                  <th>Find Pharmacy Clicks</th>
                  <th>Report Clicks</th>
                  <th>Reports Submitted</th>
                  <th>Language Changes</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(analyticsData.byState)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([state, metrics]) => (
                    <tr key={state}>
                      <td>{state}</td>
                      <td>{metrics['find-pharmacy-click'] || 0}</td>
                      <td>{metrics['report-pharmacy-click'] || 0}</td>
                      <td>{metrics['report-submitted'] || 0}</td>
                      <td>{metrics['language-switched'] || 0}</td>
                    </tr>
                  ))}
                <tr className={styles.totalRow}>
                  <td><strong>Total</strong></td>
                  <td><strong>{analyticsData.totals['find-pharmacy-click'] || 0}</strong></td>
                  <td><strong>{analyticsData.totals['report-pharmacy-click'] || 0}</strong></td>
                  <td><strong>{analyticsData.totals['report-submitted'] || 0}</strong></td>
                  <td><strong>{analyticsData.totals['language-switched'] || 0}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Formulation Trends */}
      <div className={styles.formulationSection}>
        <h2 className={styles.sectionTitle}>Formulation Availability (All Time)</h2>
        <div className={styles.formulationGrid}>
          {data.formulations
            .sort((a, b) => (b.success + b.denied) - (a.success + a.denied))
            .filter(form => form.success > 0 || form.denied > 0)
            .map(form => (
              <FormulationBar
                key={form.name}
                name={form.name}
                success={form.success}
                denied={form.denied}
                total={data.allTime.total}
              />
            ))}
        </div>
      </div>

      {/* 5. Common Barriers */}
      <div className={styles.barriersSection}>
        <h2 className={styles.sectionTitle}>Common Bupe Barriers (All Time)</h2>
        <div className={styles.barChart}>
          {data.barriers
            .filter(barrier => barrier.count > 0)
            .slice(0, 5)
            .map(barrier => (
              <div className={styles.barItem} key={barrier.note}>
                <div className={styles.barLabel}>{barrier.note}</div>
                <div className={styles.barBackground}>
                  <div
                    className={styles.bar}
                    style={{ width: `${(barrier.count / (data.barriers[0]?.count || 1)) * 100}%` }}
                  />
                </div>
                <div className={styles.barValue}>{barrier.count}</div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ title, total, success, denied, subtitle }: {
  title: string;
  total: number;
  success: number;
  denied: number;
  subtitle?: string;
}) {
  return (
    <div className={styles.statCard}>
      <h3 className={styles.statCardTitle}>{title}</h3>
      {subtitle && <p className={styles.statCardSubtitle}>{subtitle}</p>}
      <div className={styles.statBigNumber}>{total}</div>
      <div className={styles.statDetails}>
        <div className={styles.statDetail}>
          <span className={styles.successDot} /> Success: {success}
        </div>
        <div className={styles.statDetail}>
          <span className={styles.deniedDot} /> Denied: {denied}
        </div>
      </div>
    </div>
  );
}

// Formulation Bar Component
function FormulationBar({ name, success, denied, total }: {
  name: string;
  success: number;
  denied: number;
  total: number;
}) {
  const successPercent = total > 0 ? (success / total) * 100 : 0;
  const deniedPercent = total > 0 ? (denied / total) * 100 : 0;

  return (
    <div className={styles.formulationItem}>
      <div className={styles.formulationName}>{name}</div>
      <div className={styles.formulationBars}>
        <div
          className={styles.successBar}
          style={{ width: `${successPercent}%` }}
        />
        <div
          className={styles.deniedBar}
          style={{ width: `${deniedPercent}%` }}
        />
      </div>
      <div className={styles.formulationCounts}>
        <span className={styles.successCount}>{success}</span>
        <span className={styles.deniedCount}>{denied}</span>
      </div>
    </div>
  );
}
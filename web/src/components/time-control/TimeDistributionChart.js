import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';

/**
 * TIME DISTRIBUTION CHART
 * Stacked bar showing category breakdown
 */
export const TimeDistributionChart = ({ categoryBreakdown }) => {
  if (!categoryBreakdown || Object.keys(categoryBreakdown).length === 0) {
    return (
      <Card className="p-6" data-testid="time-distribution-chart">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Time Distribution
        </h3>
        <div className="text-center py-8 text-slate-600 dark:text-slate-400">
          No time data available
        </div>
      </Card>
    );
  }

  // Transform data for recharts
  const data = [
    {
      name: 'Week',
      execution: categoryBreakdown.execution || 0,
      debugging: categoryBreakdown.debugging || 0,
      revision: categoryBreakdown.revision || 0,
      communication: categoryBreakdown.communication || 0,
      qa_fix: categoryBreakdown.qa_fix || 0,
    }
  ];

  const categoryColors = {
    execution: '#2FE6A6',     // green
    debugging: '#f59e0b',    // orange
    revision: '#ef4444',     // red
    communication: '#3b82f6', // blue
    qa_fix: '#8b5cf6'        // purple
  };

  return (
    <Card className="p-6" data-testid="time-distribution-chart">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        Time Distribution
      </h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis type="number" stroke="#94a3b8" />
          <YAxis type="category" dataKey="name" stroke="#94a3b8" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1e293b', 
              border: '1px solid #334155',
              borderRadius: '8px'
            }}
            labelStyle={{ color: '#f1f5f9' }}
          />
          <Legend />
          
          <Bar dataKey="execution" stackId="a" fill={categoryColors.execution} name="Execution" />
          <Bar dataKey="debugging" stackId="a" fill={categoryColors.debugging} name="Debugging" />
          <Bar dataKey="revision" stackId="a" fill={categoryColors.revision} name="Revision" />
          <Bar dataKey="communication" stackId="a" fill={categoryColors.communication} name="Communication" />
          <Bar dataKey="qa_fix" stackId="a" fill={categoryColors.qa_fix} name="QA Fix" />
        </BarChart>
      </ResponsiveContainer>

      {/* Legend with percentages */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-2">
        {Object.entries(categoryBreakdown).map(([cat, hours]) => {
          const total = Object.values(categoryBreakdown).reduce((sum, h) => sum + h, 0);
          const pct = total > 0 ? ((hours / total) * 100).toFixed(1) : 0;
          return (
            <div key={cat} className="text-xs">
              <div className="flex items-center gap-1">
                <div 
                  className="w-3 h-3 rounded-sm" 
                  style={{ backgroundColor: categoryColors[cat] || '#6b7280' }}
                />
                <span className="text-slate-600 dark:text-slate-400 capitalize">
                  {cat.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="text-slate-900 dark:text-white font-semibold ml-4">
                {pct}%
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

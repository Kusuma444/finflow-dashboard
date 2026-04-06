import React, { useContext, useMemo } from 'react';
import { AppContext } from '../App';

// Category colors — picked to be distinct but not too loud
const CAT_COLORS = {
  Food:          '#F97316',
  Housing:       '#3B82F6',
  Transport:     '#8B5CF6',
  Entertainment: '#EC4899',
  Health:        '#10B981',
  Shopping:      '#EF4444',
  Utilities:     '#06B6D4',
  Education:     '#F59E0B',
  Other:         '#6B7280',
};

function formatINR(amount) {
  return '₹' + amount.toLocaleString('en-IN');
}

// Simple SVG donut, hand-rolled — no library needed for something this simple
function DonutChart({ data }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return null;

  const SIZE = 140;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const outerR = 52;
  const innerR = 33;

  let angle = -Math.PI / 2; // start from top

  const slices = data.map(item => {
    const slice = (item.value / total) * 2 * Math.PI;

    // outer arc points
    const x1 = cx + outerR * Math.cos(angle);
    const y1 = cy + outerR * Math.sin(angle);
    angle += slice;
    const x2 = cx + outerR * Math.cos(angle);
    const y2 = cy + outerR * Math.sin(angle);

    // inner arc points (going backwards)
    const ix2 = cx + innerR * Math.cos(angle);
    const iy2 = cy + innerR * Math.sin(angle);
    const ix1 = cx + innerR * Math.cos(angle - slice);
    const iy1 = cy + innerR * Math.sin(angle - slice);

    const isLarge = slice > Math.PI ? 1 : 0;
    const path = `M${x1},${y1} A${outerR},${outerR} 0 ${isLarge},1 ${x2},${y2} L${ix2},${iy2} A${innerR},${innerR} 0 ${isLarge},0 ${ix1},${iy1} Z`;

    return {
      ...item,
      path,
      pct: Math.round((item.value / total) * 100),
    };
  });

  // only show top 5 in legend
  const legendItems = slices.slice(0, 5);

  return (
    <div className="donut-container">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} opacity={0.92}>
            <title>{s.name}: {formatINR(s.value)} ({s.pct}%)</title>
          </path>
        ))}
        {/* Center label */}
        <text x={cx} y={cy - 5} textAnchor="middle" fontSize="8" fill="currentColor" fontFamily="JetBrains Mono, monospace">Total</text>
        <text x={cx} y={cy + 8} textAnchor="middle" fontSize="8" fill="currentColor" fontFamily="JetBrains Mono, monospace">
          {formatINR(total)}
        </text>
      </svg>

      <div className="donut-legend-list">
        {legendItems.map((item, i) => (
          <div key={i} className="donut-legend-row">
            <span className="donut-legend-color" style={{ background: item.color }} />
            <span className="donut-legend-name">{item.name}</span>
            <span className="donut-legend-pct">{item.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ monthlyData }) {
  const max = Math.max(...monthlyData.flatMap(m => [m.income, m.expense]), 1);
  const chartHeight = 120; // pixels for bars

  return (
    <div className="bar-chart">
      {monthlyData.map((m, i) => (
        <div key={i} className="bar-month">
          <div className="bar-pair">
            <div
              className="bar-col income"
              style={{ height: `${(m.income / max) * chartHeight}px` }}
              title={`Income: ${formatINR(m.income)}`}
            />
            <div
              className="bar-col expense"
              style={{ height: `${(m.expense / max) * chartHeight}px` }}
              title={`Expenses: ${formatINR(m.expense)}`}
            />
          </div>
          <span className="bar-month-label">{m.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { state, role } = useContext(AppContext);
  const { transactions } = state;

  // Totals across all transactions
  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    transactions.forEach(t => {
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;
    });
    const balance = income - expense;
    const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0;
    return { income, expense, balance, savingsRate };
  }, [transactions]);

  // Spending by category for the donut
  const categoryData = useMemo(() => {
    const map = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({
        name,
        value,
        color: CAT_COLORS[name] || '#6B7280',
      }));
  }, [transactions]);

  // Monthly income vs expense for bar chart (last 6 months)
  const monthlyData = useMemo(() => {
    const months = {};
    transactions.forEach(t => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!months[key]) {
        months[key] = { income: 0, expense: 0, date: d };
      }
      if (t.type === 'income') months[key].income += t.amount;
      else months[key].expense += t.amount;
    });

    return Object.values(months)
      .sort((a, b) => a.date - b.date)
      .slice(-6)
      .map(m => ({
        ...m,
        label: m.date.toLocaleString('default', { month: 'short' }),
      }));
  }, [transactions]);

  // Just grab the most recent 5 for the dashboard list
  const recentTxns = transactions.slice(0, 5);

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Here's how your finances look overall</p>
      </div>

      {/* Summary cards */}
      <div className="stats-row">
        <div className="stat-card balance">
          <span className="stat-icon">💳</span>
          <div className="stat-label">Net Balance</div>
          <div className={`stat-value ${totals.balance >= 0 ? 'positive' : 'negative'}`}>
            {formatINR(totals.balance)}
          </div>
          <div className={`stat-sub ${totals.balance >= 0 ? 'up' : 'down'}`}>
            {totals.balance >= 0 ? '↑' : '↓'} {Math.abs(totals.savingsRate)}% of total income
          </div>
        </div>

        <div className="stat-card income">
          <span className="stat-icon">💰</span>
          <div className="stat-label">Total Income</div>
          <div className="stat-value positive">{formatINR(totals.income)}</div>
          <div className="stat-sub neutral">All recorded income</div>
        </div>

        <div className="stat-card expense">
          <span className="stat-icon">💸</span>
          <div className="stat-label">Total Expenses</div>
          <div className="stat-value negative">{formatINR(totals.expense)}</div>
          <div className="stat-sub neutral">All recorded spending</div>
        </div>

        <div className="stat-card savings">
          <span className="stat-icon">📈</span>
          <div className="stat-label">Savings Rate</div>
          <div className={`stat-value ${totals.savingsRate >= 20 ? 'positive' : 'amber'}`}>
            {totals.savingsRate}%
          </div>
          <div className={`stat-sub ${totals.savingsRate >= 20 ? 'up' : 'down'}`}>
            {totals.savingsRate >= 20 ? '↑ Above 20% target' : '↓ Below 20% target'}
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="charts-row">
        {/* Bar chart */}
        <div className="chart-box">
          <div className="chart-header">
            <span className="chart-title">Income vs Expenses</span>
            <div className="chart-legend">
              <div className="legend-item">
                <span className="legend-dot" style={{ background: 'var(--green)' }} />
                Income
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: 'var(--red)' }} />
                Expenses
              </div>
            </div>
          </div>
          {monthlyData.length === 0
            ? <div className="empty-box"><div className="empty-icon">📊</div><div className="empty-title">No data yet</div></div>
            : <BarChart monthlyData={monthlyData} />
          }
        </div>

        {/* Donut chart */}
        <div className="chart-box">
          <div className="chart-header">
            <span className="chart-title">Spending Breakdown</span>
          </div>
          {categoryData.length === 0
            ? <div className="empty-box"><div className="empty-icon">🍩</div><div className="empty-title">No expenses yet</div></div>
            : <DonutChart data={categoryData} />
          }
        </div>
      </div>

      {/* Recent transactions */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Transactions</span>
        </div>

        {recentTxns.length === 0 ? (
          <div className="empty-box">
            <div className="empty-icon">📋</div>
            <div className="empty-title">No transactions yet</div>
            <div className="empty-hint">Add some from the Transactions page</div>
          </div>
        ) : (
          <div className="txn-wrap">
            <table className="txn-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th className="col-category">Category</th>
                  <th>Date</th>
                  <th className="col-type">Type</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentTxns.map(txn => (
                  <tr key={txn.id}>
                    <td className="txn-desc">{txn.description}</td>
                    <td className="col-category">
                      <span className="cat-tag">{txn.category}</span>
                    </td>
                    <td className="txn-date-cell">
                      {new Date(txn.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="col-type">
                      <span className={`type-badge ${txn.type}`}>{txn.type}</span>
                    </td>
                    <td className={`txn-amount-cell ${txn.type}`}>
                      {txn.type === 'expense' ? '−' : '+'}{formatINR(txn.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
import React, { useContext, useMemo } from 'react';
import { AppContext } from '../App';

function formatINR(n) {
  return '₹' + n.toLocaleString('en-IN');
}

const COLORS = [
  '#3B82F6', '#F97316', '#10B981', '#8B5CF6',
  '#EF4444', '#F59E0B', '#06B6D4', '#EC4899',
];

export default function Insights() {
  const { state } = useContext(AppContext);
  const { transactions } = state;

  // ALL hooks must be called before any early return — React rules of hooks
  const categoryBreakdown = useMemo(() => {
    const totals = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        totals[t.category] = (totals[t.category] || 0) + t.amount;
      });

    const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    const grandTotal = sorted.reduce((sum, [, v]) => sum + v, 0);

    return sorted.map(([name, amount], i) => ({
      name,
      amount,
      pct: grandTotal > 0 ? Math.round((amount / grandTotal) * 100) : 0,
      color: COLORS[i % COLORS.length],
    }));
  }, [transactions]);

  const monthlyData = useMemo(() => {
    const months = {};
    transactions.forEach(t => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (!months[key]) months[key] = { label, income: 0, expense: 0 };
      if (t.type === 'income') months[key].income += t.amount;
      else months[key].expense += t.amount;
    });

    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, m]) => ({ ...m, net: m.income - m.expense }))
      .slice(-6);
  }, [transactions]);

  // derived values (not hooks, just plain calculations)
  const totalIncome  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const savingsRate  = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;
  const topCategory  = categoryBreakdown[0] || null;
  const avgMonthlySpend = monthlyData.length > 0
    ? Math.round(monthlyData.reduce((s, m) => s + m.expense, 0) / monthlyData.length)
    : 0;

  const freqMap = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    freqMap[t.category] = (freqMap[t.category] || 0) + 1;
  });
  const mostFrequent = Object.entries(freqMap).sort((a, b) => b[1] - a[1])[0] || null;

  const lastTwo = monthlyData.slice(-2);
  let momChange = null;
  if (lastTwo.length === 2) {
    const diff = lastTwo[1].expense - lastTwo[0].expense;
    const pct = lastTwo[0].expense > 0 ? Math.round(Math.abs(diff / lastTwo[0].expense) * 100) : 0;
    momChange = { diff, pct, up: diff > 0 };
  }

  // Safe to early return now — all hooks are already called above
  if (transactions.length === 0) {
    return (
      <div>
        <div className="page-head">
          <h1 className="page-title">Insights</h1>
        </div>
        <div className="empty-box" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '4rem' }}>
          <div className="empty-icon">💡</div>
          <div className="empty-title">No data to analyze yet</div>
          <div className="empty-hint">Add some transactions first</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">Insights</h1>
        <p className="page-subtitle">Patterns and observations from your spending</p>
      </div>

      <div className="insight-cards">
        <div className="insight-card">
          <div className="insight-icon">🏆</div>
          <div className="insight-label">Top Spending Category</div>
          <div className="insight-value">{topCategory ? topCategory.name : '—'}</div>
          <div className="insight-note">
            {topCategory
              ? `${formatINR(topCategory.amount)} spent · ${topCategory.pct}% of total`
              : 'No expense data'}
          </div>
        </div>

        <div className="insight-card">
          <div className="insight-icon">📅</div>
          <div className="insight-label">Avg Monthly Spend</div>
          <div className="insight-value">{formatINR(avgMonthlySpend)}</div>
          <div className="insight-note">
            Across last {monthlyData.length} month{monthlyData.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="insight-card">
          <div className="insight-icon">💰</div>
          <div className="insight-label">Savings Rate</div>
          <div
            className="insight-value"
            style={{
              color: savingsRate >= 20 ? 'var(--green)' : savingsRate >= 10 ? 'var(--amber)' : 'var(--red)',
            }}
          >
            {savingsRate}%
          </div>
          <div className="insight-note">
            {savingsRate >= 20
              ? '✅ Good — above the 20% benchmark'
              : savingsRate >= 10
              ? '⚠️ Moderate — try to get above 20%'
              : '⚠️ Low — consider cutting non-essentials'}
          </div>
        </div>

        <div className="insight-card">
          <div className="insight-icon">🔁</div>
          <div className="insight-label">Most Frequent</div>
          <div className="insight-value">{mostFrequent ? mostFrequent[0] : '—'}</div>
          <div className="insight-note">
            {mostFrequent
              ? `${mostFrequent[1]} transaction${mostFrequent[1] > 1 ? 's' : ''} recorded`
              : 'No data'}
          </div>
        </div>

        {momChange && (
          <div className="insight-card">
            <div className="insight-icon">{momChange.up ? '📈' : '📉'}</div>
            <div className="insight-label">vs Last Month</div>
            <div
              className="insight-value"
              style={{ color: momChange.up ? 'var(--red)' : 'var(--green)' }}
            >
              {momChange.up ? '+' : '-'}{momChange.pct}%
            </div>
            <div className="insight-note">
              Spending {momChange.up ? 'up' : 'down'} by {formatINR(Math.abs(momChange.diff))} vs previous month
            </div>
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-header">
          <span className="card-title">Spending by Category</span>
        </div>
        {categoryBreakdown.length === 0 ? (
          <div className="empty-box">
            <div className="empty-icon">📊</div>
            <div className="empty-title">No expense data</div>
          </div>
        ) : (
          <div style={{ padding: '1rem 1.25rem' }}>
            <div className="cat-bars">
              {categoryBreakdown.map((cat, i) => (
                <div key={i} className="cat-bar-item">
                  <div className="cat-bar-label">{cat.name}</div>
                  <div className="cat-bar-track">
                    <div
                      className="cat-bar-fill"
                      style={{ width: `${cat.pct}%`, background: cat.color }}
                    />
                  </div>
                  <div className="cat-bar-amount">{formatINR(cat.amount)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Monthly Breakdown</span>
        </div>
        {monthlyData.length === 0 ? (
          <div className="empty-box">
            <div className="empty-icon">📅</div>
            <div className="empty-title">Not enough data</div>
          </div>
        ) : (
          <div style={{ padding: '0 1.25rem 1rem' }}>
            <table className="monthly-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Income</th>
                  <th>Expenses</th>
                  <th>Net</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((m, i) => {
                  const prev = monthlyData[i - 1];
                  const netDiff = prev ? m.net - prev.net : null;
                  return (
                    <tr key={i}>
                      <td>{m.label}</td>
                      <td style={{ color: 'var(--green)' }}>{formatINR(m.income)}</td>
                      <td style={{ color: 'var(--red)' }}>{formatINR(m.expense)}</td>
                      <td>
                        <span style={{ color: m.net >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                          {m.net >= 0 ? '+' : ''}{formatINR(m.net)}
                        </span>
                        {netDiff !== null && (
                          <span
                            className={netDiff >= 0 ? 'positive-diff' : 'negative-diff'}
                            style={{ fontSize: '0.7rem', marginLeft: '5px' }}
                          >
                            {netDiff >= 0 ? '▲' : '▼'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
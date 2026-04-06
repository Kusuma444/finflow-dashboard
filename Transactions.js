import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../App';

function formatINR(n) {
  return '₹' + n.toLocaleString('en-IN');
}

const CATEGORIES = [
  'Food', 'Housing', 'Transport', 'Entertainment',
  'Health', 'Shopping', 'Utilities', 'Education', 'Other',
];

// default blank form state
const blankForm = {
  date: '',
  description: '',
  category: 'Food',
  amount: '',
  type: 'expense',
};

export default function Transactions() {
  const { state, dispatch, role } = useContext(AppContext);
  const { transactions, filter } = state;
  const isAdmin = role === 'admin';

  const [sortBy, setSortBy] = useState('date-desc');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = adding new
  const [form, setForm] = useState(blankForm);
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState(''); // small success feedback

  // Filtered + sorted list
  const visibleTransactions = useMemo(() => {
    let list = [...transactions];

    if (filter.type !== 'all') {
      list = list.filter(t => t.type === filter.type);
    }
    if (filter.category !== 'all') {
      list = list.filter(t => t.category === filter.category);
    }
    if (filter.search.trim()) {
      const q = filter.search.toLowerCase();
      list = list.filter(t =>
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    }

    // sort
    const [field, dir] = sortBy.split('-');
    list.sort((a, b) => {
      const va = field === 'date' ? new Date(a.date) : a.amount;
      const vb = field === 'date' ? new Date(b.date) : b.amount;
      return dir === 'asc' ? va - vb : vb - va;
    });

    return list;
  }, [transactions, filter, sortBy]);

  function updateFilter(key, val) {
    dispatch({ type: 'SET_FILTER', payload: { [key]: val } });
  }

  function openAddModal() {
    setEditingId(null);
    setForm(blankForm);
    setFormError('');
    setShowModal(true);
  }

  function openEditModal(txn) {
    setEditingId(txn.id);
    setForm({
      date: txn.date,
      description: txn.description,
      category: txn.category,
      amount: String(txn.amount),
      type: txn.type,
    });
    setFormError('');
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setFormError('');
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!form.date || !form.description.trim() || !form.amount) {
      setFormError('Please fill in all fields.');
      return;
    }
    const amt = parseFloat(form.amount);
    if (isNaN(amt) || amt <= 0) {
      setFormError('Enter a valid positive amount.');
      return;
    }

    const txnData = {
      id: editingId ?? Date.now(),
      date: form.date,
      description: form.description.trim(),
      category: form.category,
      amount: amt,
      type: form.type,
    };

    if (editingId) {
      dispatch({ type: 'EDIT_TRANSACTION', payload: txnData });
      showToast('Transaction updated');
    } else {
      dispatch({ type: 'ADD_TRANSACTION', payload: txnData });
      showToast('Transaction added');
    }

    setForm(blankForm);
    setShowModal(false);
  }

  function handleDelete(id) {
    // using window.confirm here — simple and works fine for an intern project
    if (window.confirm('Delete this transaction? This cannot be undone.')) {
      dispatch({ type: 'DELETE_TRANSACTION', payload: id });
      showToast('Transaction deleted');
    }
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }

  // toggle sort on column header click
  function toggleSort(field) {
    if (sortBy === `${field}-desc`) setSortBy(`${field}-asc`);
    else setSortBy(`${field}-desc`);
  }

  function getSortIndicator(field) {
    if (!sortBy.startsWith(field)) return null;
    return sortBy.endsWith('desc') ? ' ↓' : ' ↑';
  }

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">Transactions</h1>
        <p className="page-subtitle">
          {isAdmin
            ? 'Add, edit, or remove transactions below'
            : 'Viewing all transactions — read only'}
        </p>
      </div>

      {/* Filter / search bar */}
      <div className="filters-row">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name or category…"
            value={filter.search}
            onChange={e => updateFilter('search', e.target.value)}
          />
        </div>

        <select
          className="filter-dropdown"
          value={filter.type}
          onChange={e => updateFilter('type', e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="income">Income only</option>
          <option value="expense">Expenses only</option>
        </select>

        <select
          className="filter-dropdown"
          value={filter.category}
          onChange={e => updateFilter('category', e.target.value)}
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* Sort dropdown — I prefer a select here over clickable headers for mobile UX */}
        <select
          className="filter-dropdown"
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
        >
          <option value="date-desc">Newest first</option>
          <option value="date-asc">Oldest first</option>
          <option value="amount-desc">Highest amount</option>
          <option value="amount-asc">Lowest amount</option>
        </select>

        {isAdmin && (
          <button className="btn-primary" onClick={openAddModal}>
            + Add
          </button>
        )}
      </div>

      <div className="results-count">
        {visibleTransactions.length} transaction{visibleTransactions.length !== 1 ? 's' : ''}
      </div>

      {/* Table */}
      <div className="card">
        {visibleTransactions.length === 0 ? (
          <div className="empty-box">
            <div className="empty-icon">🔍</div>
            <div className="empty-title">Nothing found</div>
            <div className="empty-hint">Try changing your search or filters</div>
          </div>
        ) : (
          <div className="txn-wrap">
            <table className="txn-table">
              <thead>
                <tr>
                  <th
                    className="sortable"
                    onClick={() => toggleSort('date')}
                  >
                    Date{getSortIndicator('date')}
                  </th>
                  <th>Description</th>
                  <th className="col-category">Category</th>
                  <th className="col-type">Type</th>
                  <th
                    className="sortable"
                    style={{ textAlign: 'right' }}
                    onClick={() => toggleSort('amount')}
                  >
                    Amount{getSortIndicator('amount')}
                  </th>
                  {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {visibleTransactions.map(txn => (
                  <tr key={txn.id}>
                    <td className="txn-date-cell">
                      {new Date(txn.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: '2-digit',
                      })}
                    </td>
                    <td className="txn-desc">{txn.description}</td>
                    <td className="col-category">
                      <span className="cat-tag">{txn.category}</span>
                    </td>
                    <td className="col-type">
                      <span className={`type-badge ${txn.type}`}>{txn.type}</span>
                    </td>
                    <td className={`txn-amount-cell ${txn.type}`}>
                      {txn.type === 'expense' ? '−' : '+'}{formatINR(txn.amount)}
                    </td>
                    {isAdmin && (
                      <td>
                        <div className="row-actions">
                          <button
                            className="icon-btn"
                            onClick={() => openEditModal(txn)}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            className="icon-btn danger"
                            onClick={() => handleDelete(txn.id)}
                            title="Delete"
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-head">
              <span className="modal-title">
                {editingId ? 'Edit Transaction' : 'Add Transaction'}
              </span>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="field">
                <label>Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                />
              </div>

              <div className="field">
                <label>Description</label>
                <input
                  type="text"
                  placeholder="e.g. Salary, Rent, Groceries…"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>

              <div className="field-row">
                <div className="field">
                  <label>Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  >
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Type</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
              </div>

              <div className="field">
                <label>Amount (₹)</label>
                <input
                  type="number"
                  placeholder="0"
                  min="1"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                />
              </div>

              {formError && <div className="error-msg">{formError}</div>}

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingId ? 'Save Changes' : 'Add Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Simple toast notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'var(--text)',
          color: 'var(--surface)',
          padding: '10px 18px',
          borderRadius: 'var(--radius)',
          fontSize: '0.85rem',
          fontWeight: '500',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 999,
          animation: 'fadeUp 0.2s ease',
        }}>
          ✓ {toast}
        </div>
      )}
    </div>
  );
}
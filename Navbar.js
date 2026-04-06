import React, { useContext } from 'react';
import { AppContext } from '../App';

const pages = [
  { key: 'dashboard',    label: 'Dashboard' },
  { key: 'transactions', label: 'Transactions' },
  { key: 'insights',     label: 'Insights' },
];

export default function Navbar({ currentPage, onNavigate }) {
  const { role, setRole, darkMode, setDarkMode } = useContext(AppContext);

  return (
    <>
      <nav className="navbar">
        {/* Logo */}
        <div className="nav-logo">
          <span className="logo-dot" />
          FinFlow
        </div>

        {/* Page tabs */}
        <div className="nav-tabs">
          {pages.map(p => (
            <button
              key={p.key}
              className={`nav-tab ${currentPage === p.key ? 'active' : ''}`}
              onClick={() => onNavigate(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Controls on the right */}
        <div className="nav-right">
          {/* Shows the current role clearly */}
          <div className={`role-pill ${role}`}>
            <span className="role-dot" />
            {role === 'admin' ? 'Admin' : 'Viewer'}
          </div>

          <select
            className="role-select"
            value={role}
            onChange={e => setRole(e.target.value)}
            title="Switch role"
          >
            <option value="admin">Admin</option>
            <option value="viewer">Viewer</option>
          </select>

          <button
            className={`theme-toggle ${darkMode ? 'active' : ''}`}
            onClick={() => setDarkMode(prev => !prev)}
            title={darkMode ? 'Switch to light' : 'Switch to dark'}
          />
        </div>
      </nav>

      {/* Viewer gets a little banner so the restriction is obvious */}
      {role === 'viewer' && (
        <div className="viewer-banner">
          👁️ You're in Viewer mode — transactions are read-only. Switch to Admin to make changes.
        </div>
      )}
    </>
  );
}
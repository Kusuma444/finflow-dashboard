import React, { createContext, useReducer, useState } from 'react';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Insights from './components/Insights';
import Navbar from './components/Navbar';
import './App.css';

export const AppContext = createContext();

// Some realistic mock data to work with during demo
const seedTransactions = [
  { id: 1,  date: '2025-03-01', description: 'Salary Credit',     category: 'Income',        amount: 85000, type: 'income'  },
  { id: 2,  date: '2025-03-03', description: 'House Rent',         category: 'Housing',       amount: 18000, type: 'expense' },
  { id: 3,  date: '2025-03-05', description: 'Groceries - DMart',  category: 'Food',          amount: 3200,  type: 'expense' },
  { id: 4,  date: '2025-03-07', description: 'Netflix',            category: 'Entertainment', amount: 649,   type: 'expense' },
  { id: 5,  date: '2025-03-09', description: 'Freelance Payment',  category: 'Income',        amount: 22000, type: 'income'  },
  { id: 6,  date: '2025-03-11', description: 'Electricity Bill',   category: 'Utilities',     amount: 2100,  type: 'expense' },
  { id: 7,  date: '2025-03-13', description: 'Dinner - Zomato',    category: 'Food',          amount: 1850,  type: 'expense' },
  { id: 8,  date: '2025-03-15', description: 'Gym Membership',     category: 'Health',        amount: 1200,  type: 'expense' },
  { id: 9,  date: '2025-03-17', description: 'Amazon Order',       category: 'Shopping',      amount: 4500,  type: 'expense' },
  { id: 10, date: '2025-03-19', description: 'Dividend',           category: 'Income',        amount: 8500,  type: 'income'  },
  { id: 11, date: '2025-03-21', description: 'Fuel - Petrol Pump', category: 'Transport',     amount: 2800,  type: 'expense' },
  { id: 12, date: '2025-03-23', description: 'Apollo Clinic',      category: 'Health',        amount: 1500,  type: 'expense' },
  { id: 13, date: '2025-03-25', description: 'Udemy Course',       category: 'Education',     amount: 3999,  type: 'expense' },
  { id: 14, date: '2025-03-27', description: 'Internet Bill',      category: 'Utilities',     amount: 999,   type: 'expense' },
  { id: 15, date: '2025-03-29', description: 'Cafe Coffee Day',    category: 'Food',          amount: 680,   type: 'expense' },
  { id: 16, date: '2025-02-01', description: 'Salary Credit',      category: 'Income',        amount: 85000, type: 'income'  },
  { id: 17, date: '2025-02-04', description: 'House Rent',         category: 'Housing',       amount: 18000, type: 'expense' },
  { id: 18, date: '2025-02-06', description: 'Groceries - Big B',  category: 'Food',          amount: 2900,  type: 'expense' },
  { id: 19, date: '2025-02-10', description: 'Freelance Payment',  category: 'Income',        amount: 15000, type: 'income'  },
  { id: 20, date: '2025-02-14', description: 'Valentine Dinner',   category: 'Food',          amount: 2200,  type: 'expense' },
  { id: 21, date: '2025-02-18', description: 'Electricity Bill',   category: 'Utilities',     amount: 1800,  type: 'expense' },
  { id: 22, date: '2025-02-22', description: 'Myntra Order',       category: 'Shopping',      amount: 6200,  type: 'expense' },
  { id: 23, date: '2025-02-26', description: 'Ola / Uber',         category: 'Transport',     amount: 1900,  type: 'expense' },
  { id: 24, date: '2025-01-02', description: 'Salary Credit',      category: 'Income',        amount: 85000, type: 'income'  },
  { id: 25, date: '2025-01-05', description: 'House Rent',         category: 'Housing',       amount: 18000, type: 'expense' },
  { id: 26, date: '2025-01-08', description: 'New Year Party',     category: 'Entertainment', amount: 5500,  type: 'expense' },
  { id: 27, date: '2025-01-12', description: 'Groceries',          category: 'Food',          amount: 3500,  type: 'expense' },
  { id: 28, date: '2025-01-20', description: 'Annual Bonus',       category: 'Income',        amount: 30000, type: 'income'  },
  { id: 29, date: '2025-01-25', description: 'Flipkart Sale Buy',  category: 'Shopping',      amount: 8200,  type: 'expense' },
  { id: 30, date: '2025-01-28', description: 'Utilities Bundle',   category: 'Utilities',     amount: 2300,  type: 'expense' },
];

function appReducer(state, action) {
  switch (action.type) {
    case 'ADD_TRANSACTION':
      return {
        ...state,
        transactions: [action.payload, ...state.transactions],
      };
    case 'EDIT_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map(t =>
          t.id === action.payload.id ? action.payload : t
        ),
      };
    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter(t => t.id !== action.payload),
      };
    case 'SET_FILTER':
      return {
        ...state,
        filter: { ...state.filter, ...action.payload },
      };
    default:
      return state;
  }
}

const defaultState = {
  transactions: seedTransactions,
  filter: { type: 'all', category: 'all', search: '' },
};

export default function App() {
  const [state, dispatch] = useReducer(appReducer, defaultState);
  const [role, setRole] = useState('admin');
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);

  return (
    <AppContext.Provider value={{ state, dispatch, role, setRole, darkMode, setDarkMode }}>
      <div className={`app-shell ${darkMode ? 'dark' : ''}`}>
        <Navbar currentPage={currentPage} onNavigate={setCurrentPage} />
        <main className="page-wrapper">
          {currentPage === 'dashboard'    && <Dashboard />}
          {currentPage === 'transactions' && <Transactions />}
          {currentPage === 'insights'     && <Insights />}
        </main>
      </div>
    </AppContext.Provider>
  );
}
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from '@/components/dashboard/Dashboard';

// Mock Sidebar
jest.mock('@/components/layout/Sidebar', () =>
  function MockSidebar({ activeTab, setActiveTab, userRole }) {
    return (
      <div>
        <button onClick={() => setActiveTab('dashboard')}>Dashboard</button>
        <button onClick={() => setActiveTab('take-order')}>Take Order</button>
        <button onClick={() => setActiveTab('customers')}>Customers</button>
        <button onClick={() => setActiveTab('menu-management')}>Menu</button>
        <button onClick={() => setActiveTab('order-history')}>Orders</button>
      </div>
    );
  }
);

// Mock Header
jest.mock('@/components/layout/Header', () =>
  function MockHeader({ user, onLogout }) {
    return <div>Mock Header for {user.username}</div>;
  }
);

// Mock DashboardHome
jest.mock('@/components/dashboard/DashboardHome', () =>
  function MockDashboardHome({ user }) {
    return <div>Dashboard Home - {user.username}</div>;
  }
);

// Mock TakeOrder
jest.mock('@/components/orders/TakeOrder', () =>
  function MockTakeOrder({ user }) {
    return <div>Take Order Component - {user.username}</div>;
  }
);

// Mock Customers
jest.mock('@/components/customers/Customers', () =>
  function MockCustomers() {
    return <div>Customers Component</div>;
  }
);

// Mock MenuManagement
jest.mock('@/components/menu/MenuManagement', () =>
  function MockMenuManagement() {
    return <div>Menu Management Component</div>;
  }
);

// Mock OrderHistory
jest.mock('@/components/orders/OrderHistory', () =>
  function MockOrderHistory({ user }) {
    return <div>Order History Component - {user.username}</div>;
  }
);

describe('Dashboard Component', () => {
  const user = { username: 'admin', role: 'admin' };
  const onLogout = jest.fn();

  it('renders DashboardHome by default', () => {
    render(<Dashboard user={user} onLogout={onLogout} />);
    expect(screen.getByText(/Dashboard Home/i)).toBeInTheDocument();
  });

  it('switches to TakeOrder tab', async () => {
    render(<Dashboard user={user} onLogout={onLogout} />);
    await userEvent.click(screen.getByText('Take Order'));
    expect(screen.getByText(/Take Order Component/i)).toBeInTheDocument();
  });

  it('switches to Customers tab', async () => {
    render(<Dashboard user={user} onLogout={onLogout} />);
    await userEvent.click(screen.getByText('Customers'));
    expect(screen.getByText(/Customers Component/i)).toBeInTheDocument();
  });

  it('shows MenuManagement for admin', async () => {
    render(<Dashboard user={user} onLogout={onLogout} />);
    await userEvent.click(screen.getByText('Menu'));
    expect(screen.getByText(/Menu Management Component/i)).toBeInTheDocument();
  });

  it('shows Access Denied for staff role on menu-management', async () => {
    const staffUser = { username: 'staff', role: 'staff' };
    render(<Dashboard user={staffUser} onLogout={onLogout} />);
    await userEvent.click(screen.getByText('Menu'));
    expect(screen.getByText(/Access Denied/i)).toBeInTheDocument();
  });

  it('renders OrderHistory tab correctly', async () => {
    render(<Dashboard user={user} onLogout={onLogout} />);
    await userEvent.click(screen.getByText('Orders'));
    expect(screen.getByText(/Order History Component/i)).toBeInTheDocument();
  });
});
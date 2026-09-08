import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import DataTable from '../components/common/DataTable.jsx';
import Badge from '../components/common/Badge.jsx';
import { BarChart3, Download, Printer, Filter, Calendar, FileSpreadsheet } from 'lucide-react';

export default function ReportsPage() {
  const { success, error } = useToast();
  const [reportType, setReportType] = useState('sales');
  const [period, setPeriod] = useState('September 2026');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = () => {
    setLoading(true);
    let endpoint = '';
    if (reportType === 'users') endpoint = '/reports/users';
    else if (reportType === 'products') endpoint = '/reports/products';
    else if (reportType === 'sales') endpoint = '/reports/sales';
    else if (reportType === 'representatives') endpoint = `/reports/representatives?period=${encodeURIComponent(period)}`;
    else if (reportType === 'vendors') endpoint = '/reports/vendors';
    else if (reportType === 'management') endpoint = '/reports/overview';

    api.get(endpoint)
      .then(res => {
        if (res.success) setReportData(res);
      })
      .catch(err => error(err.message || 'Failed to fetch report'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, period]);

  // Export to CSV generator
  const exportToCSV = () => {
    if (!reportData) return;
    let csvRows = [];
    let filename = `pharma_report_${reportType}_${Date.now()}.csv`;

    if (reportType === 'sales') {
      csvRows.push(['Product Name', 'Dosage Form', 'Category', 'Units Sold', 'Total Revenue (INR)']);
      (reportData.productWise || []).forEach(p => {
        csvRows.push([`"${p.product_name}"`, `"${p.dosage_form}"`, `"${p.category_name}"`, p.units_sold, p.revenue]);
      });
    } else if (reportType === 'representatives') {
      csvRows.push(['Representative', 'Territory', 'Period', 'Target (INR)', 'Actual Sales (INR)', 'Achievement %', 'Status']);
      (reportData.report || []).forEach(r => {
        csvRows.push([`"${r.rep_name}"`, `"${r.territory}"`, `"${r.period_name}"`, r.target_amount, r.actual_sales, `${r.achievement_percentage}%`, `"${r.performance_status}"`]);
      });
    } else if (reportType === 'products') {
      csvRows.push(['Product Name', 'Active Ingredient', 'Category', 'Form', 'Stock Units', 'Unit Price (INR)', 'Status']);
      (reportData.products || []).forEach(p => {
        csvRows.push([`"${p.name}"`, `"${p.generic_name}"`, `"${p.category_name}"`, `"${p.dosage_form}"`, p.stock_quantity, p.unit_price, `"${p.stock_status}"`]);
      });
    } else if (reportType === 'users') {
      csvRows.push(['User ID', 'Name', 'Email', 'Role', 'Phone', 'Status', 'Created Date']);
      (reportData.userList || []).forEach(u => {
        csvRows.push([u.id, `"${u.name}"`, `"${u.email}"`, `"${u.role}"`, `"${u.phone}"`, `"${u.status}"`, u.created_at]);
      });
    } else if (reportType === 'vendors') {
      csvRows.push(['Company Name', 'Contact Person', 'Email', 'Phone', 'Products Supplied Count', 'Warehouse Stock']);
      (reportData.vendors || []).forEach(v => {
        csvRows.push([`"${v.company_name}"`, `"${v.contact_person}"`, `"${v.email}"`, `"${v.phone}"`, v.products_supplied, v.current_stock_in_inventory]);
      });
    }

    if (csvRows.length === 0) {
      error('No tabular data available to export.');
      return;
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success(`Downloaded ${filename}`);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Executive Intelligence & Reporting Engine</h1>
          <p className="page-description">
            Multi-dimensional reporting across organizational operations, sales quotas, product formulary, and supplier networks
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={() => window.print()}>
            <Printer size={16} /> Print Report
          </button>
          <button className="btn btn-primary" onClick={exportToCSV}>
            <Download size={16} /> Export to CSV
          </button>
        </div>
      </div>

      {/* Report Selector Ribbon */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Report Module:</span>
          {[
            { id: 'sales', label: 'Sales & Billing' },
            { id: 'representatives', label: 'Medical Rep Quotas' },
            { id: 'products', label: 'Product Inventory' },
            { id: 'users', label: 'User Directory' },
            { id: 'vendors', label: 'Suppliers' },
            { id: 'management', label: 'Executive Summary' }
          ].map(tab => (
            <button
              key={tab.id}
              className={`btn btn-sm ${reportType === tab.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setReportType(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {reportType === 'representatives' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Period:</span>
            <select
              className="form-select"
              style={{ padding: '0.35rem 0.75rem', width: 'auto' }}
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="September 2026">September 2026</option>
              <option value="August 2026">August 2026</option>
            </select>
          </div>
        )}
      </div>

      {/* Render Selected Report View */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Generating dynamic database report...
        </div>
      ) : (
        <div>
          {/* 1. SALES REPORT */}
          {reportType === 'sales' && reportData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-main)' }}>
                  Product-wise POS Sales & Revenue
                </h3>
                <DataTable
                  columns={[
                    { header: 'Product Name', accessor: 'product_name', render: (r) => <strong>{r.product_name}</strong> },
                    { header: 'Dosage Form', accessor: 'dosage_form' },
                    { header: 'Category', accessor: 'category_name', render: (r) => <Badge label={r.category_name} type="info" /> },
                    { header: 'Units Dispensed', accessor: 'units_sold', render: (r) => `${r.units_sold} units` },
                    { header: 'Revenue Generated', accessor: 'revenue', render: (r) => <strong style={{ color: '#10b981' }}>₹{Number(r.revenue).toFixed(2)}</strong> }
                  ]}
                  data={reportData.productWise || []}
                  searchPlaceholder="Search product sales..."
                />
              </div>

              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-main)' }}>
                  Cashier Shift Sales Summary
                </h3>
                <DataTable
                  columns={[
                    { header: 'Cashier Name', accessor: 'cashier_name', render: (r) => <strong>{r.cashier_name}</strong> },
                    { header: 'Invoices Cleared', accessor: 'invoice_count' },
                    { header: 'Total Collected', accessor: 'total_collected', render: (r) => <strong style={{ color: '#38bdf8' }}>₹{Number(r.total_collected).toFixed(2)}</strong> }
                  ]}
                  data={reportData.cashierWise || []}
                  searchPlaceholder="Search cashier..."
                />
              </div>
            </div>
          )}

          {/* 2. REPRESENTATIVE TARGETS REPORT */}
          {reportType === 'representatives' && reportData && (
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-main)' }}>
                Field Representative Performance Report &bull; {period}
              </h3>
              <DataTable
                columns={[
                  { header: 'Representative', accessor: 'rep_name', render: (r) => <strong>{r.rep_name}</strong> },
                  { header: 'Territory', accessor: 'territory' },
                  { header: 'Supervisor', accessor: 'manager_name', render: (r) => r.manager_name || 'Regional Lead' },
                  { header: 'Target Quota', accessor: 'target_amount', render: (r) => `₹${Number(r.target_amount).toLocaleString()}` },
                  { header: 'Actual Sales', accessor: 'actual_sales', render: (r) => <strong style={{ color: '#10b981' }}>₹{Number(r.actual_sales).toLocaleString()}</strong> },
                  {
                    header: 'Achievement %',
                    accessor: 'achievement_percentage',
                    render: (r) => (
                      <strong style={{ color: r.achievement_percentage >= 100 ? '#10b981' : '#f59e0b' }}>
                        {r.achievement_percentage}%
                      </strong>
                    )
                  },
                  {
                    header: 'Remaining',
                    accessor: 'remaining_target',
                    render: (r) => r.remaining_target === 0 ? 'Completed' : `₹${Number(r.remaining_target).toLocaleString()}`
                  },
                  {
                    header: 'Rating Status',
                    accessor: 'performance_status',
                    render: (r) => <Badge label={r.performance_status} color={r.badge_color} />
                  }
                ]}
                data={reportData.report || []}
                searchPlaceholder="Search representative or territory..."
              />
            </div>
          )}

          {/* 3. PRODUCT INVENTORY REPORT */}
          {reportType === 'products' && reportData && (
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-main)' }}>
                Pharmaceutical Inventory & Formulation Surveillance Report
              </h3>
              <DataTable
                columns={[
                  { header: 'Product Name', accessor: 'name', render: (p) => <strong>{p.name}</strong> },
                  { header: 'Generic Formulation', accessor: 'generic_name' },
                  { header: 'Category', accessor: 'category_name' },
                  { header: 'Form', accessor: 'dosage_form' },
                  { header: 'Supplier', accessor: 'vendor_name' },
                  {
                    header: 'Stock Units',
                    accessor: 'stock_quantity',
                    render: (p) => (
                      <span style={{ fontWeight: 700, color: p.stock_status === 'LOW_STOCK' ? '#f59e0b' : '#34d399' }}>
                        {p.stock_quantity}
                      </span>
                    )
                  },
                  {
                    header: 'Nearest Expiry',
                    accessor: 'nearest_expiry',
                    render: (p) => p.nearest_expiry || '—'
                  },
                  {
                    header: 'Stock Status',
                    accessor: 'stock_status',
                    render: (p) => <Badge label={p.stock_status} type={p.stock_status === 'LOW_STOCK' ? 'warning' : 'success'} />
                  }
                ]}
                data={reportData.products || []}
                searchPlaceholder="Search products by brand, generic, or supplier..."
              />
            </div>
          )}

          {/* 4. USER REPORT */}
          {reportType === 'users' && reportData && (
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-main)' }}>
                Organizational Users by Role Report
              </h3>
              <DataTable
                columns={[
                  { header: 'User ID', accessor: 'id', render: (u) => <code>#{u.id}</code> },
                  { header: 'Full Name', accessor: 'name', render: (u) => <strong>{u.name}</strong> },
                  { header: 'Email Address', accessor: 'email' },
                  { header: 'Role', accessor: 'role', render: (u) => <Badge label={u.role.replace('_', ' ')} type="info" /> },
                  { header: 'Phone', accessor: 'phone' },
                  { header: 'Status', accessor: 'status', render: (u) => <Badge label={u.status} type={u.status === 'active' ? 'active' : 'inactive'} /> },
                  { header: 'Joining Date', accessor: 'created_at', render: (u) => new Date(u.created_at).toLocaleDateString() }
                ]}
                data={reportData.userList || []}
                searchPlaceholder="Search users..."
              />
            </div>
          )}

          {/* 5. VENDOR REPORT */}
          {reportType === 'vendors' && reportData && (
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-main)' }}>
                Supplier Network & Fulfillment Report
              </h3>
              <DataTable
                columns={[
                  { header: 'Company Name', accessor: 'company_name', render: (v) => <strong>{v.company_name}</strong> },
                  { header: 'Contact Person', accessor: 'contact_person' },
                  { header: 'Email', accessor: 'email' },
                  { header: 'Tax ID (GSTIN)', accessor: 'tax_id' },
                  { header: 'Product Lines Supplied', accessor: 'products_supplied', render: (v) => `${v.products_supplied} lines` },
                  { header: 'Total Warehouse Units', accessor: 'current_stock_in_inventory', render: (v) => <strong style={{ color: '#10b981' }}>{v.current_stock_in_inventory} units</strong> }
                ]}
                data={reportData.vendors || []}
                searchPlaceholder="Search vendors..."
              />
            </div>
          )}

          {/* 6. EXECUTIVE MANAGEMENT SUMMARY */}
          {reportType === 'management' && reportData && (
            <div className="glass-card" style={{ padding: '2rem' }}>
              <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Organization Consolidated Executive Summary</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Organization Staff</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{reportData.stats?.totalUsers}</div>
                </div>
                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active Drug Formulary</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{reportData.stats?.totalProducts} lines</div>
                </div>
                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total POS Invoices</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>₹{reportData.stats?.totalSalesRevenue?.toLocaleString()}</div>
                </div>
                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Field Sales Quota Achievement</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>{reportData.stats?.orgTargetAchievement}%</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

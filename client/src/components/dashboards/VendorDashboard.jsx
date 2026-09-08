import React, { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import StatCard from '../common/StatCard.jsx';
import Badge from '../common/Badge.jsx';
import { Building2, Pill, CheckCircle2, Phone, Mail, MapPin, Layers } from 'lucide-react';

export default function VendorDashboard() {
  const { user } = useAuth();
  const [vendorData, setVendorData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/vendors')
      .then(res => {
        if (res.success && res.vendors?.length > 0) {
          const v = res.vendors[0];
          return api.get(`/vendors/${v.id}`);
        }
      })
      .then(res => {
        if (res && res.success) {
          setVendorData(res.vendor);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading vendor portal...</div>;
  }

  const v = vendorData || {
    company_name: 'Apex Life Sciences Ltd',
    contact_person: 'Manoj Bajpayee',
    email: 'vendor@example.com',
    phone: '+91 98555 11001',
    address: 'Plot 42, GIDC Industrial Estate, Ahmedabad, Gujarat',
    tax_id: 'GSTIN24AAACA1122D1Z5',
    products: []
  };

  const totalStock = (v.products || []).reduce((sum, p) => sum + Number(p.total_stock || 0), 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Vendor Supply Console</h1>
          <p className="page-description">
            Confidential supplier account &bull; <strong>{v.company_name}</strong> &bull; Tax ID: {v.tax_id}
          </p>
        </div>
        <Badge label="VERIFIED SUPPLIER" type="success" />
      </div>

      <div className="stats-grid">
        <StatCard
          title="Authorized Medicines Supplied"
          value={(v.products || []).length}
          icon={Pill}
          trend="Active Supply Catalog"
          color="#38bdf8"
          bgTint="rgba(56, 189, 248, 0.15)"
        />
        <StatCard
          title="Warehouse Stock on Hand"
          value={`${totalStock.toLocaleString()} units`}
          icon={Layers}
          trend="Current Central Inventory"
          color="#10b981"
          bgTint="rgba(16, 185, 129, 0.15)"
        />
        <StatCard
          title="Contract Compliance"
          value="Active"
          icon={CheckCircle2}
          trend="Terms Good Through 2027"
          color="#8b5cf6"
          bgTint="rgba(139, 92, 246, 0.15)"
        />
      </div>

      {/* Profile & Supplied Products Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>
        {/* Vendor Profile Card */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '1rem' }}>Supplier Profile</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.88rem' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Company</div>
              <div style={{ fontWeight: 600 }}>{v.company_name}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Contact Person</div>
              <div>{v.contact_person}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Official Email</div>
              <div style={{ color: '#38bdf8' }}>{v.email}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Phone</div>
              <div>{v.phone}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Facility Address</div>
              <div style={{ color: 'var(--text-muted)' }}>{v.address}</div>
            </div>
          </div>
        </div>

        {/* Supplied Products List */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '1rem' }}>Supplied Pharmaceutical Lines</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {(v.products || []).length > 0 ? (
              v.products.map(p => (
                <div
                  key={p.id}
                  style={{
                    padding: '0.75rem 1rem',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Form: {p.dosage_form} &bull; Unit Price: ₹{Number(p.unit_price).toFixed(2)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: '#10b981' }}>{p.total_stock} units</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>Central Stock</div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-subtle)', padding: '1.5rem 0', textAlign: 'center' }}>
                No active pharmaceutical lines registered yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

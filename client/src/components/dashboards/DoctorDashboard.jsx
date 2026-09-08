import React, { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import StatCard from '../common/StatCard.jsx';
import Badge from '../common/Badge.jsx';
import { Stethoscope, Pill, BookOpen, CalendarCheck, Hospital } from 'lucide-react';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [doctorData, setDoctorData] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/doctors'),
      api.get('/products?limit=8')
    ]).then(([docRes, prodRes]) => {
      if (docRes.success && docRes.doctors?.length > 0) {
        const d = docRes.doctors[0];
        return api.get(`/doctors/${d.id}`).then(fullDoc => {
          if (fullDoc.success) setDoctorData(fullDoc.doctor);
          if (prodRes.success) setProducts(prodRes.products || []);
        });
      }
    }).catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading clinician portal...</div>;
  }

  const d = doctorData || {
    name: 'Dr. Sanjay Gupta, MD',
    specialization: 'Cardiologist',
    hospital_clinic: 'Apollo Multispeciality Hospital, Delhi',
    email: 'doctor@example.com',
    phone: '+91 98666 22001',
    address: 'Sarita Vihar, Mathura Road, New Delhi',
    visits: []
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Healthcare Practitioner Portal</h1>
          <p className="page-description">
            {d.name} &bull; <strong>{d.specialization}</strong> &bull; {d.hospital_clinic}
          </p>
        </div>
        <Badge label="VERIFIED PRACTITIONER" type="info" />
      </div>

      <div className="stats-grid">
        <StatCard
          title="Clinical Specialty"
          value={d.specialization}
          icon={Stethoscope}
          trend={d.hospital_clinic}
          color="#38bdf8"
          bgTint="rgba(56, 189, 248, 0.15)"
        />
        <StatCard
          title="Medical Rep Detailing Sessions"
          value={(d.visits || []).length}
          icon={CalendarCheck}
          trend="Past Educational Product Briefings"
          color="#10b981"
          bgTint="rgba(16, 185, 129, 0.15)"
        />
        <StatCard
          title="Compendium Directory"
          value="Approved"
          icon={BookOpen}
          trend="Full Dosage & Formulation Access"
          color="#8b5cf6"
          bgTint="rgba(139, 92, 246, 0.15)"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>
        {/* Approved Drug Directory */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '1rem' }}>
            Authorized Formulations & Indications
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {products.slice(0, 6).map(p => (
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
                    Active: {p.generic_name} &bull; Form: {p.dosage_form}
                  </div>
                </div>
                <Badge label={p.dosage_form} type="info" />
              </div>
            ))}
          </div>
        </div>

        {/* Medical Rep Visits Log */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '1rem' }}>
            Representative Visit & Sample Briefings
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {(d.visits || []).length > 0 ? (
              d.visits.map(v => (
                <div
                  key={v.id}
                  style={{
                    padding: '0.75rem 1rem',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{v.rep_name} (Med Rep)</span>
                    <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>{v.visit_date}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Product: <strong>{v.product_name}</strong> &bull; Notes: {v.notes}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-subtle)', padding: '1.5rem 0', textAlign: 'center' }}>
                No recent representative interactions recorded.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

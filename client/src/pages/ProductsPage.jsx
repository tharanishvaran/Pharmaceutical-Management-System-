import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import DataTable from '../components/common/DataTable.jsx';
import Modal from '../components/common/Modal.jsx';
import Badge from '../components/common/Badge.jsx';
import { Pill, PlusCircle, AlertTriangle, Clock, Layers, Filter } from 'lucide-react';

export default function ProductsPage() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [alertFilter, setAlertFilter] = useState('ALL'); // 'ALL', 'low_stock', 'expiring'

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    generic_name: '',
    category_id: '',
    dosage_form: 'Tablet',
    manufacturer: '',
    description: '',
    unit_price: '',
    reorder_level: 25,
    vendor_id: '',
    initial_batch: {
      batch_number: '',
      expiry_date: '',
      quantity: 100,
      cost_price: ''
    }
  });

  const [batchData, setBatchData] = useState({
    batch_number: '',
    manufacture_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    quantity: 100,
    cost_price: ''
  });

  const canManage = user?.role === 'ADMIN' || user?.role === 'PHARMACIST';

  const fetchProducts = () => {
    setLoading(true);
    let url = `/products?limit=100`;
    if (selectedCategory !== 'ALL') url += `&category=${selectedCategory}`;
    if (alertFilter !== 'ALL') url += `&alertType=${alertFilter}`;

    api.get(url)
      .then(res => {
        if (res.success) setProducts(res.products || []);
      })
      .catch(err => error(err.message || 'Failed to fetch products'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
    api.get('/products/categories').then(r => { if (r.success) setCategories(r.categories || []); });
    api.get('/vendors').then(r => { if (r.success) setVendors(r.vendors || []); });
  }, [selectedCategory, alertFilter]);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/products', formData);
      if (res.success) {
        success('Pharmaceutical product registered successfully');
        setIsAddOpen(false);
        fetchProducts();
      }
    } catch (err) {
      error(err.message || 'Failed to register product');
    }
  };

  const handleAddBatch = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      const res = await api.post(`/products/${selectedProduct.id}/batches`, batchData);
      if (res.success) {
        success('New batch added to inventory');
        setIsBatchOpen(false);
        fetchProducts();
      }
    } catch (err) {
      error(err.message || 'Failed to add batch');
    }
  };

  const columns = [
    {
      header: 'Product Name',
      accessor: 'name',
      render: (p) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{p.name}</div>
          <div style={{ fontSize: '0.75rem', color: '#38bdf8' }}>{p.generic_name}</div>
        </div>
      )
    },
    {
      header: 'Category',
      accessor: 'category_name',
      render: (p) => <Badge label={p.category_name || 'General'} type="info" />
    },
    {
      header: 'Dosage Form',
      accessor: 'dosage_form',
      render: (p) => p.dosage_form
    },
    {
      header: 'Manufacturer',
      accessor: 'manufacturer'
    },
    {
      header: 'Unit Price',
      accessor: 'unit_price',
      render: (p) => <strong style={{ color: '#10b981' }}>₹{Number(p.unit_price).toFixed(2)}</strong>
    },
    {
      header: 'Available Stock',
      accessor: 'total_stock',
      render: (p) => {
        const isLow = p.total_stock <= p.reorder_level;
        return (
          <div>
            <span style={{ fontWeight: 700, color: isLow ? '#f59e0b' : '#34d399' }}>
              {p.total_stock} units
            </span>
            {isLow && (
              <div style={{ fontSize: '0.68rem', color: '#f59e0b', fontWeight: 600 }}>
                Low Stock (&le; {p.reorder_level})
              </div>
            )}
          </div>
        );
      }
    },
    {
      header: 'Nearest Expiry',
      accessor: 'nearest_expiry',
      render: (p) => {
        if (!p.nearest_expiry) return '—';
        const isNear = new Date(p.nearest_expiry) <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
        return (
          <span style={{ color: isNear ? '#f43f5e' : 'var(--text-main)', fontWeight: isNear ? 700 : 400 }}>
            {p.nearest_expiry} {isNear && '⚠️'}
          </span>
        );
      }
    },
    ...(canManage ? [{
      header: 'Action',
      width: '120px',
      align: 'right',
      render: (p) => (
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => {
            setSelectedProduct(p);
            setIsBatchOpen(true);
          }}
          title="Add New Batch"
        >
          <PlusCircle size={14} /> Add Batch
        </button>
      )
    }] : [])
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pharmaceutical Products Compendium</h1>
          <p className="page-description">
            Complete active drug formulary &bull; Batch tracking &bull; Stock levels &bull; Expiry surveillance
          </p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={() => setIsAddOpen(true)}>
            <PlusCircle size={16} /> Register New Medicine
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Category:</span>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.35rem 0.75rem' }}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Stock & Expiry Alert:</span>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.35rem 0.75rem' }}
            value={alertFilter}
            onChange={(e) => setAlertFilter(e.target.value)}
          >
            <option value="ALL">All Products</option>
            <option value="low_stock">⚠️ Low Stock Warnings</option>
            <option value="expiring">⏳ Expiring Within 90 Days</option>
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={products}
        searchPlaceholder="Search medicine by brand or generic name..."
        emptyMessage="No pharmaceutical products found."
      />

      {/* Add Product Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Register New Pharmaceutical Formulation"
        footer={(
          <>
            <button className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreateProduct}>Register Product</button>
          </>
        )}
      >
        <form onSubmit={handleCreateProduct}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Brand Name *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. Lipitor 20mg"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Generic / Active Ingredient *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. Atorvastatin Calcium"
                value={formData.generic_name}
                onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                className="form-select"
                required
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              >
                <option value="">Select Category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Dosage Form *</label>
              <select
                className="form-select"
                value={formData.dosage_form}
                onChange={(e) => setFormData({ ...formData, dosage_form: e.target.value })}
              >
                <option value="Tablet">Tablet</option>
                <option value="Capsule">Capsule</option>
                <option value="Syrup">Syrup</option>
                <option value="Injection">Injection</option>
                <option value="Inhaler">Inhaler</option>
                <option value="Ointment">Ointment</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Unit Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                required
                className="form-input"
                placeholder="150.00"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Manufacturer *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. Apex Life Sciences"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Reorder Level Threshold</label>
              <input
                type="number"
                className="form-input"
                value={formData.reorder_level}
                onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
              />
            </div>
          </div>

          <h4 style={{ fontSize: '0.9rem', color: '#38bdf8', margin: '1rem 0 0.5rem' }}>Initial Batch Details</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Batch Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="BAT-2026-X1"
                value={formData.initial_batch.batch_number}
                onChange={(e) => setFormData({
                  ...formData,
                  initial_batch: { ...formData.initial_batch, batch_number: e.target.value }
                })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Quantity</label>
              <input
                type="number"
                className="form-input"
                value={formData.initial_batch.quantity}
                onChange={(e) => setFormData({
                  ...formData,
                  initial_batch: { ...formData.initial_batch, quantity: e.target.value }
                })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Expiry Date</label>
              <input
                type="date"
                className="form-input"
                value={formData.initial_batch.expiry_date}
                onChange={(e) => setFormData({
                  ...formData,
                  initial_batch: { ...formData.initial_batch, expiry_date: e.target.value }
                })}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Add Batch Modal */}
      <Modal
        isOpen={isBatchOpen}
        onClose={() => setIsBatchOpen(false)}
        title={`Add Stock Batch for ${selectedProduct?.name}`}
        footer={(
          <>
            <button className="btn btn-secondary" onClick={() => setIsBatchOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAddBatch}>Save Batch</button>
          </>
        )}
      >
        <form onSubmit={handleAddBatch}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Batch Number *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. BAT-2026-99"
                value={batchData.batch_number}
                onChange={(e) => setBatchData({ ...batchData, batch_number: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Quantity Received *</label>
              <input
                type="number"
                required
                className="form-input"
                value={batchData.quantity}
                onChange={(e) => setBatchData({ ...batchData, quantity: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Mfg Date *</label>
              <input
                type="date"
                required
                className="form-input"
                value={batchData.manufacture_date}
                onChange={(e) => setBatchData({ ...batchData, manufacture_date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Expiry Date *</label>
              <input
                type="date"
                required
                className="form-input"
                value={batchData.expiry_date}
                onChange={(e) => setBatchData({ ...batchData, expiry_date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Unit Cost (₹) *</label>
              <input
                type="number"
                step="0.01"
                required
                className="form-input"
                placeholder="50.00"
                value={batchData.cost_price}
                onChange={(e) => setBatchData({ ...batchData, cost_price: e.target.value })}
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

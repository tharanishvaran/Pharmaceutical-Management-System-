import React from 'react';
import Modal from './Modal.jsx';
import { Printer, CheckCircle } from 'lucide-react';

export default function ReceiptModal({ isOpen, onClose, receipt }) {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="POS Transaction Receipt"
      maxWidth="480px"
      footer={(
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={16} /> Print Receipt
          </button>
        </div>
      )}
    >
      <div className="receipt-printable">
        <div className="receipt-header">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
            PHARMA CARE ORG LTD
          </h2>
          <div style={{ fontSize: '0.75rem', color: '#475569' }}>Central Pharmaceutical Dispensing Unit</div>
          <div style={{ fontSize: '0.75rem', color: '#475569' }}>GSTIN: 24AAACP1234F1Z9</div>
          <div style={{ margin: '0.5rem 0', fontWeight: 700 }}>TAX INVOICE / RECEIPT</div>
          <div style={{ fontSize: '0.78rem' }}>Invoice: <strong>{receipt.invoiceNumber}</strong></div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Date: {new Date(receipt.created_at || Date.now()).toLocaleString()}</div>
        </div>

        <div style={{ fontSize: '0.75rem', marginBottom: '0.75rem' }}>
          <div>Customer: <strong>{receipt.customer_name}</strong></div>
          {receipt.customer_phone && <div>Phone: {receipt.customer_phone}</div>}
          <div>Payment Method: <strong>{receipt.payment_method}</strong></div>
        </div>

        <table className="receipt-items-table">
          <thead>
            <tr style={{ borderBottom: '1px dashed #94a3b8', borderTop: '1px dashed #94a3b8' }}>
              <th style={{ textAlign: 'left' }}>Item</th>
              <th style={{ textAlign: 'center' }}>Qty</th>
              <th style={{ textAlign: 'right' }}>Price</th>
              <th style={{ textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {(receipt.items || []).map((item, idx) => (
              <tr key={idx}>
                <td style={{ textAlign: 'left' }}>
                  {item.product_name}
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Batch: {item.batch_number}</div>
                </td>
                <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ textAlign: 'right' }}>₹{Number(item.unit_price).toFixed(2)}</td>
                <td style={{ textAlign: 'right' }}>₹{Number(item.total_price).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ borderTop: '1px dashed #94a3b8', paddingTop: '0.5rem', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
            <span>Subtotal:</span>
            <span>₹{Number(receipt.subtotal).toFixed(2)}</span>
          </div>
          {receipt.discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', marginBottom: '0.2rem' }}>
              <span>Discount:</span>
              <span>-₹{Number(receipt.discount).toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
            <span>GST (5%):</span>
            <span>₹{Number(receipt.taxAmount).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1rem', marginTop: '0.5rem', borderTop: '1px solid #1e293b', paddingTop: '0.35rem' }}>
            <span>TOTAL AMOUNT:</span>
            <span>₹{Number(receipt.totalAmount).toFixed(2)}</span>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.72rem', color: '#64748b', borderTop: '1px dashed #94a3b8', paddingTop: '0.75rem' }}>
          Thank you for choosing Pharma Care!
          <div>Keep medicines in a cool, dry place.</div>
        </div>
      </div>
    </Modal>
  );
}

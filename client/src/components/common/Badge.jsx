import React from 'react';

export default function Badge({ label, type = 'info', color = null }) {
  const customStyle = color ? {
    background: `${color}20`,
    color: color,
    border: `1px solid ${color}50`
  } : {};

  return (
    <span className={`badge badge-${type}`} style={customStyle}>
      {label}
    </span>
  );
}

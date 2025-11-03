import React from 'react';

export default function Settings({ onClose }) {
  return (
    <div style={styles.overlay} role="dialog" aria-modal="true" aria-label="Settings">
      <div style={styles.panel}>
        <div style={styles.header}>
          <h2 style={{ margin: 0 }}>Settings</h2>
          <button onClick={onClose} style={styles.closeButton} aria-label="Close settings">✕</button>
        </div>

        <div style={styles.content}>
          <p>Configure your trading terminal settings here.</p>
          <label style={styles.label}>Example option</label>
          <input type="text" placeholder="Value" style={styles.input} />
          <p style={{ color: '#888', fontSize: '0.9rem' }}>(Add settings as needed)</p>
        </div>

        <div style={styles.actions}>
          <button onClick={onClose} style={styles.primary}>Save & Close</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  panel: {
    width: 560,
    maxWidth: '90%',
    background: '#111',
    color: '#fff',
    borderRadius: 8,
    padding: '1rem',
    boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem'
  },
  closeButton: {
    background: 'transparent',
    border: 'none',
    color: '#fff',
    fontSize: '1.2rem',
    cursor: 'pointer'
  },
  content: {
    marginBottom: '1rem'
  },
  label: {
    display: 'block',
    marginBottom: '0.25rem'
  },
  input: {
    width: '100%',
    padding: '0.5rem',
    borderRadius: 4,
    border: '1px solid #333',
    background: '#222',
    color: '#fff',
    marginBottom: '0.75rem'
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end'
  },
  primary: {
    padding: '0.5rem 1rem',
    background: 'limegreen',
    border: 'none',
    color: '#000',
    borderRadius: 4,
    cursor: 'pointer'
  }
};

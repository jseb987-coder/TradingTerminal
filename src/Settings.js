import React, { useState } from 'react';

export default function Settings({ onClose }) {
  // Hardcoded balance for now
  const [balance] = useState(12345.67);

  const baseLabels = [
    'ATM+5', 'ATM+4', 'ATM+3', 'ATM+2', 'ATM+1', 'ITM',
    'OTM+1', 'OTM+2', 'OTM+3', 'OTM+4', 'OTM+5'
  ];

  // We want buy and sell to show reversed orders from each other.
  // Buy will show baseLabels reversed, Sell will show baseLabels in original order.
  const buyDisplay = baseLabels.slice().reverse(); // OTM+5 ... ATM+5
  const sellDisplay = baseLabels.slice(); // ATM+5 ... OTM+5

  // Use distinct keys for buy vs sell so ATM in buy and sell are different values
  const buyKeys = buyDisplay.map(l => `buy_${l}`);
  const sellKeys = sellDisplay.map(l => `sell_${l}`);

  const initialMap = {};
  buyDisplay.forEach((l, i) => { initialMap[buyKeys[i]] = ''; });
  sellDisplay.forEach((l, i) => { initialMap[sellKeys[i]] = ''; });

  const [values, setValues] = useState(initialMap);

  const handleChange = (key, val) => {
    setValues(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = () => {
    console.log('Settings saved:', { balance, values });
    // For now close the modal after save
    if (onClose) onClose();
  };

  const handleBacktest = () => {
    console.log('Backtest started with values:', { balance, values });
    // Implement backtest integration later
  };

  return (
    <div style={styles.overlay} role="dialog" aria-modal="true" aria-label="Settings">
      <div style={styles.panel}>
        <div style={styles.header}>
          <h2 style={{ margin: 0 }}>Settings</h2>
          <button onClick={onClose} style={styles.closeButton} aria-label="Close settings">✕</button>
        </div>

        <div style={styles.content}>
          <div style={styles.balanceRow}>
            <strong>Available Balance:</strong>
            <span style={{ marginLeft: 8 }}>&#8377; {balance.toFixed(2)}</span>
          </div>

          <div style={styles.columns}>
            <div style={styles.column}>
              <div style={styles.colHeader}>Buy</div>
              {buyDisplay.map((label, idx) => {
                const key = buyKeys[idx];
                return (
                  <div key={key} style={styles.row}>
                    <div style={styles.rowLabel}>{label}</div>
                    <input
                      type="number"
                      value={values[key]}
                      onChange={(e) => handleChange(key, e.target.value)}
                      style={styles.valueInput}
                      placeholder="0"
                    />
                  </div>
                );
              })}
            </div>

            <div style={styles.column}>
              <div style={styles.colHeader}>Sell</div>
              {sellDisplay.map((label, idx) => {
                const key = sellKeys[idx];
                return (
                  <div key={key} style={styles.row}>
                    <div style={styles.rowLabel}>{label}</div>
                    <input
                      type="number"
                      value={values[key]}
                      onChange={(e) => handleChange(key, e.target.value)}
                      style={styles.valueInput}
                      placeholder="0"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={styles.actions}>
          <button onClick={handleBacktest} style={styles.secondary}>Backtest</button>
          <div style={{ width: 8 }} />
          <button onClick={handleSave} style={styles.primary}>Save</button>
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
    width: 760,
    maxWidth: '96%',
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
  balanceRow: {
    marginBottom: '1rem',
    fontSize: '1.05rem'
  },
  columns: {
    display: 'flex',
    gap: '1rem'
  },
  column: {
    flex: 1,
    background: '#0f0f0f',
    padding: '0.5rem',
    borderRadius: 6,
    border: '1px solid rgba(255,255,255,0.04)'
  },
  colHeader: {
    fontWeight: 'bold',
    marginBottom: '0.5rem'
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '0.4rem'
  },
  rowLabel: {
    color: '#ddd'
  },
  valueInput: {
    width: 120,
    padding: '0.35rem',
    borderRadius: 4,
    border: '1px solid #333',
    background: '#111',
    color: '#fff',
    textAlign: 'right'
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center'
  },
  primary: {
    padding: '0.5rem 1rem',
    background: 'limegreen',
    border: 'none',
    color: '#000',
    borderRadius: 4,
    cursor: 'pointer'
  },
  secondary: {
    padding: '0.45rem 0.9rem',
    background: '#222',
    border: '1px solid rgba(255,255,255,0.06)',
    color: '#fff',
    borderRadius: 4,
    cursor: 'pointer'
  }
};

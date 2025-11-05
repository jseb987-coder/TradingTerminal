import React, { useState, useRef, useEffect } from 'react';

export default function Settings({ onClose, onSave, balance, positionConfig }) {
  // Use balance from props, default to 0 if not provided
  const displayBalance = balance?.locked ? 'Account Locked' : (balance?.data?.equity?.available_margin ?? 0);

  // Initialize values from positionConfig if available
  const initialMap = {};
  const buyConfig = positionConfig?.data?.BUY || {};
  const sellConfig = positionConfig?.data?.sell || {};

  // Get labels from the config data
  const sellLabels = Object.keys(sellConfig);
  const buyLabels = Object.keys(buyConfig);

  // Function to get sort value for labels
  const getSortValue = (label) => {
    if (label === 'ATM') return 0;
    const match = label.match(/(ITM|OTM)\+(\d+)/);
    if (match) {
      const type = match[1];
      const num = parseInt(match[2]);
      return type === 'ITM' ? num : -num;
    }
    return 0;
  };

  // Sell displays in ascending order: OTM+5 to ITM+5
  const sellDisplay = sellLabels.sort((a, b) => getSortValue(a) - getSortValue(b));
  // Buy displays in descending order: ITM+5 to OTM+5
  const buyDisplay = buyLabels.sort((a, b) => getSortValue(b) - getSortValue(a));

  // Use distinct keys for buy vs sell
  const buyKeys = buyDisplay.map(l => `buy_${l}`);
  const sellKeys = sellDisplay.map(l => `sell_${l}`);

  // Populate initial values directly from config
  buyDisplay.forEach((label, i) => {
    const key = buyKeys[i];
    const configValue = buyConfig[label] !== undefined ? String(buyConfig[label]) : '';
    initialMap[key] = configValue;
  });

  sellDisplay.forEach((label, i) => {
    const key = sellKeys[i];
    const configValue = sellConfig[label] !== undefined ? String(sellConfig[label]) : '';
    initialMap[key] = configValue;
  });

  const [values, setValues] = useState(initialMap);

  // Update values when positionConfig changes
  useEffect(() => {
    const newInitialMap = {};
    const buyConfig = positionConfig?.data?.BUY || {};
    const sellConfig = positionConfig?.data?.sell || {};

    const sellLabels = Object.keys(sellConfig);
    const buyLabels = Object.keys(buyConfig);

    const sellDisplay = sellLabels;
    const buyDisplay = buyLabels.slice().reverse();

    const buyKeys = buyDisplay.map(l => `buy_${l}`);
    const sellKeys = sellDisplay.map(l => `sell_${l}`);

    buyDisplay.forEach((label, i) => {
      const key = buyKeys[i];
      const configValue = buyConfig[label] !== undefined ? String(buyConfig[label]) : '';
      newInitialMap[key] = configValue;
    });

    sellDisplay.forEach((label, i) => {
      const key = sellKeys[i];
      const configValue = sellConfig[label] !== undefined ? String(sellConfig[label]) : '';
      newInitialMap[key] = configValue;
    });

    setValues(newInitialMap);
  }, [positionConfig]);

  const handleChange = (key, val) => {
    // Prevent negative values for numeric option inputs (buy_/sell_ keys)
    if (typeof val === 'string' && (key.startsWith('buy_') || key.startsWith('sell_'))) {
      // allow empty string to clear the field
      if (val === '') {
        setValues(prev => ({ ...prev, [key]: '' }));
        return;
      }
      const num = Number(val);
      if (Number.isNaN(num)) {
        // ignore invalid numeric input
        return;
      }
      const safe = Math.max(0, num);
      setValues(prev => ({ ...prev, [key]: String(safe) }));
      return;
    }

    setValues(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = () => {
    // Build config objects directly using the display labels as keys
    const buyConfigObj = {};
    buyDisplay.forEach((label, i) => {
      const key = buyKeys[i];
      const value = values[key] ? Number(values[key]) : 0;
      buyConfigObj[label] = value;
    });

    const sellConfigObj = {};
    sellDisplay.forEach((label, i) => {
      const key = sellKeys[i];
      const value = values[key] ? Number(values[key]) : 0;
      sellConfigObj[label] = value;
    });

    const configData = {
      sell: sellConfigObj,
      BUY: buyConfigObj
    };

    console.log('Settings saved:', JSON.stringify(configData, null, 2));
    // Call onSave to update TradeDelegate and post to server
    if (onSave) {
      onSave(configData);
    }
    // For now close the modal after save
    if (onClose) onClose();
  };

  const handleBacktest = () => {
    // Format dates as YYYY/MM/DD when logging/backtesting
    const fmt = (d) => {
      if (!d) return '';
      // input type=date gives YYYY-MM-DD, convert to YYYY/MM/DD
      return d.replace(/-/g, '/');
    };
    console.log('Backtest started with values:', { balance: displayBalance, values, from: fmt(fromDate), to: fmt(toDate) });
    // Implement backtest integration later
  };

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const fromRef = useRef(null);
  const toRef = useRef(null);

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
            <span style={{ marginLeft: 8 }}>
              {typeof displayBalance === 'string' ? displayBalance : `₹ ${displayBalance.toFixed(2)}`}
            </span>
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
                      min={0}
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
                      min={0}
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
          <div style={styles.saveRow}>
            <button onClick={handleSave} style={styles.primary}>Save</button>
          </div>

          <div style={styles.dateBacktestRow}>
            <div style={styles.backtestHeading}>Backtest</div>
            <div style={styles.dateGroupCentered}>
              <label style={styles.dateLabel}>From</label>
              <div style={styles.dateInputWrapper}>
                <input
                  ref={fromRef}
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  style={styles.dateInput}
                  placeholder="2025/09/01"
                />
                <button
                  type="button"
                  aria-label="Open from date picker"
                  onClick={() => { if (fromRef.current) { try { fromRef.current.showPicker && fromRef.current.showPicker(); } catch{} fromRef.current.focus(); } }}
                  style={styles.calendarButton}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" style={styles.calendarSvg}>
                    <path fill="currentColor" d="M7 10h5v5H7z" opacity="0.9" />
                    <path fill="currentColor" d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H5V9h14v9z" />
                  </svg>
                </button>
              </div>

              <label style={{ ...styles.dateLabel, marginLeft: 8 }}>To</label>
              <div style={{ ...styles.dateInputWrapper, marginLeft: 4 }}>
                <input
                  ref={toRef}
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  style={styles.dateInput}
                  placeholder="2025/09/01"
                />
                <button
                  type="button"
                  aria-label="Open to date picker"
                  onClick={() => { if (toRef.current) { try { toRef.current.showPicker && toRef.current.showPicker(); } catch{} toRef.current.focus(); } }}
                  style={styles.calendarButton}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" style={styles.calendarSvg}>
                    <path fill="currentColor" d="M7 10h5v5H7z" opacity="0.9" />
                    <path fill="currentColor" d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H5V9h14v9z" />
                  </svg>
                </button>
              </div>
            </div>
            <button onClick={handleBacktest} style={styles.secondary}>Backtest</button>
          </div>
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
    position: 'relative',
    boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
  },
  header: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '0.75rem'
  },
  closeButton: {
    background: 'transparent',
    border: 'none',
    color: '#fff',
    fontSize: '1.2rem',
    cursor: 'pointer',
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 20
  },
  content: {
    marginBottom: '1rem'
  },
  balanceRow: {
    marginBottom: '1rem',
    fontSize: '1.05rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px'
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
    textAlign: 'center'
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px'
  },
  dateGroup: {
    display: 'flex',
    alignItems: 'center',
    marginRight: '0.5rem'
  },
  dateInput: {
    width: 150,
    padding: '0.35rem',
    borderRadius: 4,
    border: '1px solid #333',
    background: '#111',
    color: '#fff'
  },
  dateInputWrapper: {
    display: 'inline-flex',
    alignItems: 'center',
    background: '#111',
    borderRadius: 4,
    border: '1px solid #333',
    padding: '2px'
  },
  calendarButton: {
    background: 'transparent',
    border: 'none',
    color: '#fff',
    padding: '4px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  },
  calendarSvg: {
    display: 'block'
  },
  backtestHeading: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center'
  },
  dateLabel: {
    color: '#ddd',
    fontSize: '0.9rem',
    marginRight: 6
  },
  dateGroupCentered: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    margin: '0.5rem 0'
  },
  saveRow: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '0.5rem'
  },
  backtestRow: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '0.5rem'
  },
  dateBacktestRow: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
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

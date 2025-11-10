import React from "react";
import TradeDelegate from "./TradeDelegate";
import MarketDataFeed from "./socket/MarketDataFeed";
import OrderDataFeed from "./socket/OrderDataFeed";
import Settings from './Settings';
import { BuyButton, SellButton, CloseButton, ReverseButton } from "./Buttons";

const _tradeDelegate = new TradeDelegate();
const SYMBOL_NAME = "NSE_INDEX|Nifty 50";

class AutoTrader extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isConnected: navigator.onLine,
      backendConnected: false,
      dataStreamConnected: false,
      orderStreamConnected: false,
      showSettings: false,
      positionStatus: 0,
      isBusy: false
    };
    this.token = props.token;
    this.handleOnline = this.handleOnline.bind(this);
    this.handleOffline = this.handleOffline.bind(this);
    this.setPositionStatus = this.setPositionStatus.bind(this);
    this.setBusy = this.setBusy.bind(this);
    this.marketDataFeed = null;
    this.orderDataFeed = null;
    this._tester = 0;
    this.handleMarketData = this.handleMarketData.bind(this);
    this.handleOrderData = this.handleOrderData.bind(this);
    this.toggleSettings = this.toggleSettings.bind(this);
    this.newCandleUpdated = this.newCandleUpdated.bind(this);
    this.previousCandle = null;

    // prepare offline alarm audio (assume only WAV file is present)
    // initialization moved to a dedicated method for clarity
    this.initOfflineAudio();

    // Initialize button instances
    this.buyButton = new BuyButton(_tradeDelegate, this.setPositionStatus.bind(this), this.setBusy.bind(this));
    this.sellButton = new SellButton(_tradeDelegate, this.setPositionStatus.bind(this), this.setBusy.bind(this));
    this.closeButton = new CloseButton(_tradeDelegate, this.setPositionStatus.bind(this), this.setBusy.bind(this));
    this.reverseButton = new ReverseButton(_tradeDelegate, this.setPositionStatus.bind(this), () => this.state.positionStatus, this.setBusy.bind(this));
  }

  async setUpMarketFeed(token) {
    // Combine both current and future symbols into one feed
    const symbols = [SYMBOL_NAME];
    if (_tradeDelegate._futureSymbol) {
      symbols.push(_tradeDelegate._futureSymbol);
    }
    this.marketDataFeed = new MarketDataFeed(token, (data) => this.handleMarketData(data), symbols, () => this.setState({ dataStreamConnected: true }), () => this.setState({ dataStreamConnected: false }), "full");
  }

  async setUpOrderFeed(token) {
    this.orderDataFeed = new OrderDataFeed(token, this.handleOrderData, () => this.setState({ orderStreamConnected: true }), () => this.setState({ orderStreamConnected: false }));
  }




  async setUpAutoTrader() {

    try {
      const backendOk = await _tradeDelegate.setupCalls();
      if (backendOk) {
        this.setState({ backendConnected: true });
        if (_tradeDelegate.currentPosition === 'CALL') {
          this.setPositionStatus(1);
        } else if (_tradeDelegate.currentPosition === 'PUT') {
          this.setPositionStatus(2);
        }
      } else {
        this.setState({ backendConnected: false });
      }
      return backendOk;
    } catch {
      this.setState({ backendConnected: false });
      return false;
    }
  }

  async componentDidMount() {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    _tradeDelegate.initialize(this.token, SYMBOL_NAME);
    const backendOk = await this.setUpAutoTrader();
    if (backendOk) {
      await this.setUpMarketFeed(this.token);
      await this.setUpOrderFeed(this.token);
    }
  }

  componentWillUnmount() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    // cleanup offline audio if exists
    try {
      // Use helper to pause/reset audio and clear reference
      this.pauseOfflineAudio();
      this._offlineAudio = null;
    } catch (e) { }
  }

  handleOnline() {
    this.setState({ isConnected: true });
    // Stop alarm when back online
    this.pauseOfflineAudio();
    // Re-enable buttons when connection is restored
    try {
      this.setBusy(false);
    } catch (e) { }
  }

  handleOffline() {
    this.setState({ isConnected: false });
    // Disable buttons while offline and play alarm on loop until reconnected
    try {
      this.setBusy(true);
    } catch (e) { }
    this.playOfflineAudio();
  }

  setPositionStatus(value) {
    this.setState({ positionStatus: value });
  }

  setBusy(isBusy) {
    this.setState({ isBusy });
  }

  // Initialize offline alarm audio (WAV-only)
  initOfflineAudio() {
    try {
      const audio = new Audio('/mixkit-facility-alarm-sound-999.wav');
      audio.loop = true;
      audio.volume = 0.6;
      this._offlineAudio = audio;
    } catch (e) {
      this._offlineAudio = null;
    }
  }

  // Play the offline alarm (handles autoplay promise rejection silently)
  playOfflineAudio() {
    try {
      if (this._offlineAudio && this._offlineAudio.paused) {
        const p = this._offlineAudio.play();
        if (p && p.catch) p.catch(() => {
          // autoplay may be blocked by browser; ignore silently
        });
      }
    } catch (e) { }
  }

  // Pause and reset the offline alarm
  pauseOfflineAudio() {
    try {
      if (this._offlineAudio && !this._offlineAudio.paused) {
        this._offlineAudio.pause();
        this._offlineAudio.currentTime = 0;
      }
    } catch (e) { }
  }

  newCandleUpdated(candle) {
    console.log('New candle updated:', candle);
    //{interval: 'I1', open: 25632, high: 25638, low: 25630.5, close: 25637.2,ts: 1762423140000,vol: 52425}
  }

  toggleSettings = async () => {
    if (!this.state.showSettings) {
      // Opening settings, refetch the latest config from server
      await _tradeDelegate.fetchPositionConfig();
    }
    this.setState((s) => ({ showSettings: !s.showSettings }));
  };

  handleSaveSettings = async (configData) => {
    try {
      _tradeDelegate.setPositionConfig(configData);
      await _tradeDelegate.postTradeConfig();
      console.log('Settings saved and posted to server.');
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  renderButton(button) {
    const isDisabled = button.isDisabled(this.state.positionStatus) || this.state.isBusy;
    const cursor = button.getCursor(this.state.positionStatus, this.state.isBusy);
    const baseStyle = button.getStyle();
    const style = isDisabled
      ? {
        ...baseStyle,
        cursor,
        opacity: 0.5,
        filter: 'grayscale(50%)',
        transform: 'none',
      }
      : {
        ...baseStyle,
        cursor,
      };

    return (
      <button
        key={button.getLabel()}
        onClick={() => button.execute()}
        className="button"
        disabled={isDisabled}
        style={style}
      >
        {button.getLabel()}
      </button>
    );
  }


  handleMarketData = (data) => {
    try {
      const parsed = JSON.parse(data);
      
      // Check if data contains current symbol (NSE_INDEX|Nifty 50)
      if (parsed?.feeds?.[SYMBOL_NAME]) {
        // Extract LTP from ltpc field
        const ltp = parsed.feeds[SYMBOL_NAME]?.fullFeed?.indexFF?.ltpc?.ltp;
        if (ltp !== undefined && ltp !== null) {
          _tradeDelegate.setLtp(ltp);
        }
      }
      
      // Check if data contains future symbol
      const futureSymbol = _tradeDelegate._futureSymbol;
      if (futureSymbol && parsed?.feeds?.[futureSymbol]) {
        const ohlcArray = parsed.feeds[futureSymbol]?.fullFeed?.marketFF?.marketOHLC?.ohlc;
        if (ohlcArray) {
          const i1Candle = ohlcArray.find(candle => candle.interval === 'I1');
          if (i1Candle) {
            const candleStr = JSON.stringify(i1Candle);
            if (this.previousCandle !== candleStr) {
              this.previousCandle = candleStr;
              this.newCandleUpdated(i1Candle);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error parsing market data:', error);
    }
  };

  async handleOrderData(data) {
    // The feed may sometimes send multiple JSON objects concatenated. Extract balanced JSON objects.
    const extractJsonObjects = (str) => {
      const objs = [];
      let depth = 0;
      let start = -1;
      for (let i = 0; i < str.length; i++) {
        const ch = str[i];
        if (ch === '{') {
          if (depth === 0) start = i;
          depth++;
        } else if (ch === '}') {
          depth--;
          if (depth === 0 && start !== -1) {
            objs.push(str.slice(start, i + 1));
            start = -1;
          }
        }
      }
      return objs;
    };

    try {
      console.log('Order feed raw message:', data);
      const payloads = extractJsonObjects(data.toString());
      if (payloads.length === 0) {
        // Fallback: try single JSON parse
        try {
          const obj = JSON.parse(data);
          payloads.push(JSON.stringify(obj));
        } catch (e) {
          console.warn('No JSON objects found in order feed message');
        }
      }

      for (const p of payloads) {
        let msg = null;
        try {
          msg = JSON.parse(p);
        } catch (err) {
          console.warn('Failed to parse order feed JSON part:', err.message);
          continue;
        }

        // Basic logging
        console.log('Order feed parsed message:', msg);

        // If this is an order update and it's rejected, refresh positions and update UI
        if (msg && (msg.update_type === 'order' || msg.updateType === 'order')) {
          const status = (msg.status || '').toString().toLowerCase();
          if (status.includes('reject')) {
            console.warn('Order rejected detected from feed, refreshing positions...');
            try {
              const ok = await _tradeDelegate.calculatePositionDetails();
              if (ok) {
                const cp = _tradeDelegate.currentPosition;
                if (cp === 'CALL') this.setPositionStatus(1);
                else if (cp === 'PUT') this.setPositionStatus(2);
                else this.setPositionStatus(0);
              } else {
                // If calculation failed, set to no positions to be safe
                this.setPositionStatus(0);
              }
            } catch (err) {
              console.error('Error refreshing positions after order rejection:', err);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error handling order data:', error);
    }
  }

  render() {
    const statusText = this.state.isConnected ? 'online' : 'offline';
    const statusColor = this.state.isConnected ? 'limegreen' : 'red';
    const positionText = this.state.positionStatus === 0 ? 'No Positions' : this.state.positionStatus === 1 ? 'Buy' : 'Sell';
    const positionColor = this.state.positionStatus === 0 ? '#888' : this.state.positionStatus === 1 ? 'limegreen' : 'red';
    return (
      <div
        style={{
          background: `linear-gradient(-45deg, #000000, #111111, #222222, #000000)`,
          backgroundSize: '400% 400%',
          animation: 'backgroundShift 10s ease infinite',
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <style>
          {`
            @keyframes backgroundShift {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            @keyframes glow {
              0% { text-shadow: 0 0 5px ${this.state.isConnected ? 'limegreen' : 'red'}, 0 0 10px ${this.state.isConnected ? 'limegreen' : 'red'}, 0 0 15px ${this.state.isConnected ? 'limegreen' : 'red'}; }
              50% { text-shadow: 0 0 10px ${this.state.isConnected ? 'limegreen' : 'red'}, 0 0 20px ${this.state.isConnected ? 'limegreen' : 'red'}, 0 0 30px ${this.state.isConnected ? 'limegreen' : 'red'}; }
              100% { text-shadow: 0 0 5px ${this.state.isConnected ? 'limegreen' : 'red'}, 0 0 10px ${this.state.isConnected ? 'limegreen' : 'red'}, 0 0 15px ${this.state.isConnected ? 'limegreen' : 'red'}; }
            }
            .button {
              transition: transform 0.2s ease;
            }
            .button:active {
              transform: scale(0.95);
            }
          `}
        </style>
        {/* settings button will be rendered above the status indicators (right side) */}
        {this.state.isConnected && (<>
          <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 6 }}>
            <button
              onClick={this.toggleSettings}
              title="Settings"
              aria-label="Open settings"
              disabled={!this.state.backendConnected}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#fff',
                padding: '10px',
                fontSize: '1.25rem',
                minWidth: 44,
                height: 44,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                cursor: this.state.backendConnected ? 'pointer' : 'not-allowed',
                opacity: this.state.backendConnected ? 1 : 0.5
              }}
            >
              ⚙
            </button>
          </div>

          <div
            style={{
              position: 'absolute',
              top: 'calc(10px + 5vw + 12px)', // place below the responsive status text (10px top + 5vw font size + gap)
              left: 16,
              zIndex: 2,
              color: '#fff',
              fontFamily: 'monospace',
              fontSize: '1rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: this.state.backendConnected ? 'limegreen' : 'red',
                  marginRight: '0.5rem',
                }}
              ></span>
              Backend
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: this.state.dataStreamConnected ? 'limegreen' : 'red',
                  marginRight: '0.5rem',
                }}
              ></span>
              Data Stream
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.5rem' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: this.state.orderStreamConnected ? 'limegreen' : 'red',
                  marginRight: '0.5rem',
                }}
              ></span>
              Order Stream
            </div>
          </div>
        </>)}
        {this.state.showSettings && <Settings onClose={this.toggleSettings} onSave={this.handleSaveSettings} balance={_tradeDelegate.balance} positionConfig={_tradeDelegate.positionConfig} />}
        <span
          style={{
            color: statusColor,
            fontSize: "5vw",
            fontWeight: "bold",
            fontFamily: "monospace",
            animation: "glow 2s ease-in-out infinite alternate",
            zIndex: 1,
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            position: 'absolute',
            top: 10,
            left: 10,
          }}
        >
          {statusText}
        </span>
        {this.state.isConnected && (
          <div
            style={{
              marginTop: "1rem",
              fontSize: "5vw",
              color: positionColor,
              fontFamily: "monospace",
              fontWeight: "bold",
              zIndex: 1,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            {positionText}
          </div>
        )}
        {this.state.backendConnected && (
          <div
            style={{
              marginTop: "2rem",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gridTemplateRows: "auto auto",
              gap: "1rem",
              justifyItems: "center",
              zIndex: 1,
            }}
          >
            {this.renderButton(this.buyButton)}
            {this.renderButton(this.sellButton)}
            {this.renderButton(this.closeButton)}
            {this.renderButton(this.reverseButton)}
          </div>
        )}
      </div>
    );
  }
}

export default AutoTrader;

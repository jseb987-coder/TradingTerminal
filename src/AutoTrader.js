import React from "react";
import TradeDelegate from "./TradeDelegate";
import MarketDataFeed from "./socket/MarketDataFeed";

const _tradeDelegate = new TradeDelegate();
const SYMBOL_NAME = "NSE_INDEX|Nifty 50";

class AutoTrader extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isConnected: navigator.onLine,
      backendConnected: false,
      dataStreamConnected: false,
      positionStatus: 0
    };
    this.token = props.token;
    this.handleOnline = this.handleOnline.bind(this);
    this.handleOffline = this.handleOffline.bind(this);
    this.handleBuy = this.handleBuy.bind(this);
    this.handleSell = this.handleSell.bind(this);
    this.handleCloseAll = this.handleCloseAll.bind(this);
    this.handleReverse = this.handleReverse.bind(this);
    this.setPositionStatus = this.setPositionStatus.bind(this);
    this.marketDataFeed = null;
    this._tester = 0;
    this.handleMarketData = this.handleMarketData.bind(this);
  }

  async setUpMarketFeed(token, symbol) {
    this.marketDataFeed = new MarketDataFeed(token, this.handleMarketData, [symbol], () => this.setState({ dataStreamConnected: true }), () => this.setState({ dataStreamConnected: false }));
  }

  


  async setUpAutoTrader() {

    try {
      const backendOk = await _tradeDelegate.setupCalls();
      if (backendOk) {
        this.setState({ backendConnected: true });
        if (_tradeDelegate._currentPosition === 'CALL') {
          this.setPositionStatus(1);
        } else if (_tradeDelegate._currentPosition === 'PUT') {
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
      await this.setUpMarketFeed(this.token, SYMBOL_NAME);
    }
  }

  componentWillUnmount() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }

  handleOnline() {
    this.setState({ isConnected: true });
  }

  handleOffline() {
    this.setState({ isConnected: false });
  }

  setPositionStatus(value) {
    this.setState({ positionStatus: value });
  }

  handleMarketData(data) {
    try {
      const parsed = JSON.parse(data);
      const ltp = parsed?.feeds?.[SYMBOL_NAME]?.ltpc?.ltp;
      if (ltp !== undefined) {
        console.log('LTP:', ltp);
        _tradeDelegate._ltp = ltp;
      } else {
        console.log('LTP not available in data');
      }
    } catch (error) {
      console.error('Error parsing market data:', error);
    }
  }

  async handleBuy() {
    try {
      await _tradeDelegate.closeAllPositions();
      const atmCall = _tradeDelegate.getATMOption('CALL', _tradeDelegate._ltp);
      if (atmCall) {
        const quantity = atmCall.lot_size;
        const response = await _tradeDelegate.buyOrder(atmCall.instrument_token, quantity);
        console.log('Buy order response:', response);
        this.setPositionStatus(1);
      } else {
        console.error('No ATM CALL option found');
      }
    } catch (error) {
      console.error('Buy order failed:', error);
    }
  }

  async handleSell() {
    try {
      await _tradeDelegate.closeAllPositions();
      const atmPut = _tradeDelegate.getATMOption('PUT', _tradeDelegate._ltp);
      if (atmPut) {
        const quantity = atmPut.lot_size;
        const response = await _tradeDelegate.buyOrder(atmPut.instrument_token, quantity);
        console.log('Sell order response:', response);
        this.setPositionStatus(2);
      } else {
        console.error('No ATM PUT option found');
      }
    } catch (error) {
      console.error('Sell order failed:', error);
    }
  }

  async handleCloseAll() {
    try {
      const response = await _tradeDelegate.closeAllPositions();
      console.log('Close all positions response:', response);
      this.setPositionStatus(0);
    } catch (error) {
      console.error('Close all positions failed:', error);
    }
  }

  async handleReverse() {
    try {
      await _tradeDelegate.closeAllPositions();
      if (this.state.positionStatus === 1) {
        const atmPut = _tradeDelegate.getATMOption('PUT', _tradeDelegate._ltp);
        if (atmPut) {
          const quantity = atmPut.lot_size;
          const response = await _tradeDelegate.buyOrder(atmPut.instrument_token, quantity);
          console.log('Reverse to PUT buy order response:', response);
          this.setPositionStatus(2);
        } else {
          console.error('No ATM PUT option found for reverse');
        }
      } else if (this.state.positionStatus === 2) {
        const atmCall = _tradeDelegate.getATMOption('CALL', _tradeDelegate._ltp);
        if (atmCall) {
          const quantity = atmCall.lot_size;
          const response = await _tradeDelegate.buyOrder(atmCall.instrument_token, quantity);
          console.log('Reverse to CALL buy order response:', response);
          this.setPositionStatus(1);
        } else {
          console.error('No ATM CALL option found for reverse');
        }
      } else {
        console.log('No position to reverse');
      }
    } catch (error) {
      console.error('Reverse failed:', error);
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
        {this.state.isConnected && (
          <div
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              zIndex: 2,
              color: '#fff',
              fontFamily: 'monospace',
              fontSize: '1rem',
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
          </div>
        )}
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
        {this.state.isConnected && (
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
            <button
              onClick={this.handleBuy}
              className="button"
              disabled={this.state.positionStatus !== 0}
              style={{
                padding: "1rem 2rem",
                fontSize: "2.4vw",
                backgroundColor: "limegreen",
                color: "black",
                border: "none",
                borderRadius: "0.25rem",
                cursor: this.state.positionStatus !== 0 ? 'not-allowed' : 'pointer',
                minWidth: "160px",
              }}
            >
              Buy
            </button>
            <button
              onClick={this.handleSell}
              className="button"
              disabled={this.state.positionStatus !== 0}
              style={{
                padding: "1rem 2rem",
                fontSize: "2.4vw",
                backgroundColor: "red",
                color: "white",
                border: "none",
                borderRadius: "0.25rem",
                cursor: this.state.positionStatus !== 0 ? 'not-allowed' : 'pointer',
                minWidth: "160px",
              }}
            >
              Sell
            </button>
            <button
              onClick={this.handleCloseAll}
              className="button"
              style={{
                padding: "1rem 2rem",
                fontSize: "2.4vw",
                backgroundColor: "orange",
                color: "black",
                border: "none",
                borderRadius: "0.25rem",
                cursor: "pointer",
                minWidth: "160px",
              }}
            >
              Close All
            </button>
            <button
              onClick={this.handleReverse}
              className="button"
              disabled={this.state.positionStatus === 0}
              style={{
                padding: "1rem 2rem",
                fontSize: "2.4vw",
                backgroundColor: "blue",
                color: "white",
                border: "none",
                borderRadius: "0.25rem",
                cursor: this.state.positionStatus === 0 ? 'not-allowed' : 'pointer',
                minWidth: "160px",
              }}
            >
              Reverse
            </button>
          </div>
        )}
      </div>
    );
  }
}

export default AutoTrader;

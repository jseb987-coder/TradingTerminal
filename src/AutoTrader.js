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
  }

   async setUpMarketFeed(token) {
    // Pass the instrument key from TradeDelegate
    const instrumentKey = _tradeDelegate._symbol;
    this.marketDataFeed = new MarketDataFeed();
    try {
      await this.marketDataFeed.init(token, SYMBOL_NAME);
      if (this.marketDataFeed.ws) {
        this.marketDataFeed.ws.onmessage = async (event) => {
          const arrayBuffer = await (event.data.arrayBuffer ? event.data.arrayBuffer() : new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject();
            reader.readAsArrayBuffer(event.data);
          }));
          let buffer = Buffer.from(arrayBuffer);
          let response = MarketDataFeed.decodeProfobuf(buffer);
          console.log('[AutoTrader] MarketDataFeed stream:', response);
        };
        this.setState({ dataStreamConnected: true });
      } else {
        this.setState({ dataStreamConnected: false });
      }
    } catch (err) {
      this.setState({ dataStreamConnected: false });
    }
  }


   async setUpAutoTrader() {
    
      try {
        const backendOk = await _tradeDelegate.setupCalls();
        if (backendOk) {
          this.setState({ backendConnected: true });
        } else {
          this.setState({ backendConnected: false });
        }
        if(_tradeDelegate._currentPosition === 'CALL') {
          this.setPositionStatus(1);
        } else if(_tradeDelegate._currentPosition === 'PUT') {
          this.setPositionStatus(2);
        }
      } catch {
          this.setState({ backendConnected: false });
      }
  }

  async componentDidMount() {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    _tradeDelegate.initialize(this.token);
    await this.setUpMarketFeed(this.token);
    await this.setUpAutoTrader(); 
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

  async handleBuy() {
    try {
      // Placeholder: need to provide actual instrument_token and quantity
      // const instrument_token = 'NSE_FO|58717'; // Example
      // const quantity = 75;
      // const response = await _tradeDelegate.buyOrder(instrument_token, quantity);
      this.setState({ backendConnected: !this.state.backendConnected });
      const response = {};
      console.log('Buy order response:', response);
    } catch (error) {
      console.error('Buy order failed:', error);
    }
  }

  async handleSell() {
    try {
      // // Placeholder: need to provide actual instrument_token and quantity
      // const instrument_token = 'NSE_FO|58717'; // Example
      // const quantity = 75;
      // const response = await _tradeDelegate.sellOrder(instrument_token, quantity);
            this.setState({ dataStreamConnected: !this.state.dataStreamConnected });
            const response = {};

      console.log('Sell order response:', response);
    } catch (error) {
      console.error('Sell order failed:', error);
    }
  }

  async handleCloseAll() {
    try {
     // const response = await _tradeDelegate.closeAllPositions();
           const response = {};
           this._tester += 1;
           this.setPositionStatus(this._tester % 3);

      console.log('Close all positions response:', response);
    } catch (error) {
      console.error('Close all positions failed:', error);
    }
  }

  async handleReverse() {
    try {
      // Placeholder: reverse logic, e.g., if current position is CALL, sell (PUT), else buy (CALL)
      // const currentPos = _tradeDelegate.currentPosition;
      // if (currentPos === 'CALL') {
      //   await this.handleSell();
      // } else if (currentPos === 'PUT') {
      //   await this.handleBuy();
      // } else {
        console.log('No position to reverse');
      
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
              style={{
                padding: "1rem 2rem",
                fontSize: "2.4vw",
                backgroundColor: "limegreen",
                color: "black",
                border: "none",
                borderRadius: "0.25rem",
                cursor: "pointer",
                minWidth: "160px",
              }}
            >
              Buy
            </button>
            <button
              onClick={this.handleSell}
              className="button"
              style={{
                padding: "1rem 2rem",
                fontSize: "2.4vw",
                backgroundColor: "red",
                color: "white",
                border: "none",
                borderRadius: "0.25rem",
                cursor: "pointer",
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
              style={{
                padding: "1rem 2rem",
                fontSize: "2.4vw",
                backgroundColor: "blue",
                color: "white",
                border: "none",
                borderRadius: "0.25rem",
                cursor: "pointer",
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

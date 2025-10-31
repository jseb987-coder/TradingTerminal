import React from "react";
import TradeDelegate from "./TradeDelegate";
import MarketDataFeed from "./socket/MarketDataFeed";
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
      positionStatus: 0
    };
    this.token = props.token;
    this.handleOnline = this.handleOnline.bind(this);
    this.handleOffline = this.handleOffline.bind(this);
    this.setPositionStatus = this.setPositionStatus.bind(this);
    this.marketDataFeed = null;
    this._tester = 0;
    this.handleMarketData = this.handleMarketData.bind(this);

    // Initialize button instances
    this.buyButton = new BuyButton(_tradeDelegate, this.setPositionStatus.bind(this));
    this.sellButton = new SellButton(_tradeDelegate, this.setPositionStatus.bind(this));
    this.closeButton = new CloseButton(_tradeDelegate, this.setPositionStatus.bind(this));
    this.reverseButton = new ReverseButton(_tradeDelegate, this.setPositionStatus.bind(this), () => this.state.positionStatus);
  }

  async setUpMarketFeed(token, symbol) {
    this.marketDataFeed = new MarketDataFeed(token, this.handleMarketData, [symbol], () => this.setState({ dataStreamConnected: true }), () => this.setState({ dataStreamConnected: false }));
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

  renderButton(button) {
    const isDisabled = button.isDisabled(this.state.positionStatus);
    const cursor = button.getCursor(this.state.positionStatus);
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

  handleMarketData(data) {
    try {
      const parsed = JSON.parse(data);
      const ltp = parsed?.feeds?.[SYMBOL_NAME]?.ltpc?.ltp;
      if (ltp !== undefined) {
        console.log('LTP:', ltp);
        _tradeDelegate.setLtp(ltp);
      } else {
        console.log('LTP not available in data');
      }
    } catch (error) {
      console.error('Error parsing market data:', error);
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

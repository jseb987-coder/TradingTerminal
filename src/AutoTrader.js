import React from "react";
import TradeDelegate from "./TradeDelegate";

const _tradeDelegate = new TradeDelegate();

class AutoTrader extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isConnected: navigator.onLine
    };
    this.token = props.token;
    this.handleOnline = this.handleOnline.bind(this);
    this.handleOffline = this.handleOffline.bind(this);
    this.handleBuy = this.handleBuy.bind(this);
    this.handleSell = this.handleSell.bind(this);
    this.handleCloseAll = this.handleCloseAll.bind(this);
    this.handleReverse = this.handleReverse.bind(this);
    this.marketDataFeed = null;
  }

  async componentDidMount() {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    _apiManager.initialize(this.token, SYMBOL_NAME);
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

  async handleBuy() {
    try {
      // Placeholder: need to provide actual instrument_token and quantity
      const instrument_token = 'NSE_FO|58717'; // Example
      const quantity = 75;
      const response = await _tradeDelegate.buyOrder(instrument_token, quantity);
      console.log('Buy order response:', response);
    } catch (error) {
      console.error('Buy order failed:', error);
    }
  }

  async handleSell() {
    try {
      // Placeholder: need to provide actual instrument_token and quantity
      const instrument_token = 'NSE_FO|58717'; // Example
      const quantity = 75;
      const response = await _tradeDelegate.sellOrder(instrument_token, quantity);
      console.log('Sell order response:', response);
    } catch (error) {
      console.error('Sell order failed:', error);
    }
  }

  async handleCloseAll() {
    try {
      const response = await _tradeDelegate.closeAllPositions();
      console.log('Close all positions response:', response);
    } catch (error) {
      console.error('Close all positions failed:', error);
    }
  }

  async handleReverse() {
    try {
      // Placeholder: reverse logic, e.g., if current position is CALL, sell (PUT), else buy (CALL)
      const currentPos = _tradeDelegate.currentPosition;
      if (currentPos === 'CALL') {
        await this.handleSell();
      } else if (currentPos === 'PUT') {
        await this.handleBuy();
      } else {
        console.log('No position to reverse');
      }
    } catch (error) {
      console.error('Reverse failed:', error);
    }
  }

  render() {
    const backgroundStyle = `@keyframes backgroundShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }`;
    const glowStyle = `@keyframes glow { 0% { text-shadow: 0 0 5px ${this.state.isConnected ? 'limegreen' : 'red'}, 0 0 10px ${this.state.isConnected ? 'limegreen' : 'red'}, 0 0 15px ${this.state.isConnected ? 'limegreen' : 'red'}; } 50% { text-shadow: 0 0 10px ${this.state.isConnected ? 'limegreen' : 'red'}, 0 0 20px ${this.state.isConnected ? 'limegreen' : 'red'}, 0 0 30px ${this.state.isConnected ? 'limegreen' : 'red'}; } 100% { text-shadow: 0 0 5px ${this.state.isConnected ? 'limegreen' : 'red'}, 0 0 10px ${this.state.isConnected ? 'limegreen' : 'red'}, 0 0 15px ${this.state.isConnected ? 'limegreen' : 'red'}; } }`;
    const statusText = this.state.isConnected ? 'printing money' : 'disconnected';
    const statusColor = this.state.isConnected ? 'limegreen' : 'red';
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
        <style>{backgroundStyle}</style>
        <style>{glowStyle}</style>
        <span
          style={{
            color: statusColor,
            fontSize: "10vw",
            fontWeight: "bold",
            fontFamily: "monospace",
            animation: "glow 2s ease-in-out infinite alternate",
            zIndex: 1,
            textTransform: "uppercase",
            letterSpacing: "0.2em",
          }}
        >
          {statusText}
        </span>
        <div
          style={{
            marginTop: "2rem",
            fontSize: "2vw",
            color: "#888",
            fontFamily: "monospace",
            zIndex: 1,
          }}
        >
          Trading Bot Status
        </div>
        <div
          style={{
            marginTop: "2rem",
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
            justifyContent: "center",
            zIndex: 1,
          }}
        >
          <button
            onClick={this.handleBuy}
            style={{
              padding: "0.5rem 1rem",
              fontSize: "1.2vw",
              backgroundColor: "limegreen",
              color: "black",
              border: "none",
              borderRadius: "0.25rem",
              cursor: "pointer",
              minWidth: "80px",
            }}
          >
            Buy
          </button>
          <button
            onClick={this.handleSell}
            style={{
              padding: "0.5rem 1rem",
              fontSize: "1.2vw",
              backgroundColor: "red",
              color: "white",
              border: "none",
              borderRadius: "0.25rem",
              cursor: "pointer",
              minWidth: "80px",
            }}
          >
            Sell
          </button>
          <button
            onClick={this.handleCloseAll}
            style={{
              padding: "0.5rem 1rem",
              fontSize: "1.2vw",
              backgroundColor: "orange",
              color: "black",
              border: "none",
              borderRadius: "0.25rem",
              cursor: "pointer",
              minWidth: "80px",
            }}
          >
            Close All
          </button>
          <button
            onClick={this.handleReverse}
            style={{
              padding: "0.5rem 1rem",
              fontSize: "1.2vw",
              backgroundColor: "blue",
              color: "white",
              border: "none",
              borderRadius: "0.25rem",
              cursor: "pointer",
              minWidth: "80px",
            }}
          >
            Reverse
          </button>
        </div>
      </div>
    );
  }
}

export default AutoTrader;

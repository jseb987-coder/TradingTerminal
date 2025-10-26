class RiskManager {
  constructor(initialBalance) {
    this.balance = initialBalance;
    this._initialBalance = initialBalance;
    this.maxDrawdown = 0.2; // 20% max drawdown
  }

  unrealizedPL(currentPrice, entryPrice, quantity) {
    return (currentPrice - entryPrice) * quantity;
  }

  updateBalance(profitOrLoss) { 
    this.balance += profitOrLoss;
  }
 
    shouldHaltTrading() {

    const drawdown = (this.balance - this._initialBalance) / this._initialBalance;
    return drawdown <= -this.maxDrawdown;
  }
}   

export default RiskManager;
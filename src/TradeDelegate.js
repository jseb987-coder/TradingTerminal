import APIManager from './APIManager';


class TradeDelegate {
  
    initialize(token) {
        this.apiManager = new APIManager();
        this.apiManager.initialize(token);
    }

  
    async closeAllPositions() {
        return this.apiManager.closeAllPositions();
    }

    async buyOrder(instrument_token, quantity) {
        return this.apiManager.buyOrder(instrument_token, quantity);
    }

    async sellOrder(instrument_token, quantity) {
        return this.apiManager.sellOrder(instrument_token, quantity);
    }

    async getAccountBalance(segment = null) {
        return this.apiManager.getAccountBalance(segment);
    }

}

export default TradeDelegate;
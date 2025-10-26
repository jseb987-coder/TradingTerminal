import APIManager from './APIManager';


class TradeDelegate {
  
    initialize(token,symbol) {
        this.apiManager = new APIManager();
        this.apiManager.initialize(token,symbol);
        this._symbolName = symbol;
    }

      async setupCalls() {
        try {

            const expiryOk = await this.calculateNearestExpiryDate();
            if (expiryOk === false) return false;

            // Calculate and store position details
            const posOk = await this.calculatePositionDetails();
            if (posOk === false) return false;

            const balanceOk = await this.getAccountBalance();
            if (balanceOk === false) return false;


            return true;
        } catch (error) {
            // Only return false for non-network errors (i.e., error has a response)
            if (error && error.response) {
                console.error("[TradeDelegate] Initialization failed (non-network error):", error);
                return false;
            }

        }
        
    }


    async calculatePositionDetails() {
        try {
            const positions = await this.apiManager.getPositions();
            if (positions && positions.data && positions.data.length > 0) {
                const openPositions = positions.data.filter(p => p.quantity !== 0);
                if (openPositions.length > 0) {
                    console.log('[TradeDelegate] Open positions found:', openPositions);
                    const firstPosition = openPositions[0];
                    if (firstPosition.tradingsymbol && firstPosition.tradingsymbol.includes('CE')) {
                        this._currentPosition = 'CALL';
                    } else if (firstPosition.tradingsymbol && firstPosition.tradingsymbol.includes('PE')) {
                        this._currentPosition = 'PUT';
                    } else {
                        this._currentPosition = 'UNKNOWN';
                    }
                    console.log('[TradeDelegate] Current position set to:', this._currentPosition);
                    return true;
                } else {
                    console.log('[TradeDelegate] No open positions found.');
                    this._currentPosition = null;
                    return true;
                }
            } else {
                console.log('[TradeDelegate] No positions data available.');
                this._currentPosition = null;
                return true;
            }
        } catch (error) {
            console.error('[TradeDelegate] Error fetching positions:', error.message);
            this._currentPosition = null;
            return false;
        }
    }


    async calculateNearestExpiryDate() {
        try {
            const optionChainData = await this.apiManager.getOptionChain();
            const contracts = optionChainData?.data;

            if (!Array.isArray(contracts) || contracts.length === 0) {
                console.warn('[TradeDelegate] Option chain is empty or invalid.');
                return false;
            }

            let nearestDate = null;
            let nearestOptions = [];

            for (const contract of contracts) {
                if (contract.expiry) {
                    if (!nearestDate || contract.expiry < nearestDate) {
                        nearestDate = contract.expiry;
                        nearestOptions = [contract];
                    } else if (contract.expiry === nearestDate) {
                        nearestOptions.push(contract);
                    }
                }
            }

            this._expiryDate = nearestDate;
            this._optionDataOfNearestExpiry = nearestOptions;

            if(this._expiryDate) {
                console.log(`[TradeDelegate] Nearest expiry option data loaded for date: ${this._expiryDate}`);
                return true;
            } else {
                console.warn('[TradeDelegate] Could not determine nearest expiry date.');
                return false;
            }
        } catch (error) {
            console.error('[TradeDelegate.calculateNearestExpiryDate] Error:', error.message);
            return false;
        }
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
        try {
            this._balance = await this.apiManager.getAccountBalance(segment);
            console.log('[TradeDelegate] Account balance fetched:', this._balance);
            return true;
        } catch (error) {
            console.error('[TradeDelegate] Error fetching account balance:', error.message);
            return false;
        }
    }

}

export default TradeDelegate;
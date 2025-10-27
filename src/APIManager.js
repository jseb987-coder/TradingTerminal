import axios from 'axios';

class APIManager {
    initialize(token,symbol) {
        this._accessToken = token;
        this._symbol = symbol;
    }

    async postUrl(url, data, options = {}) {
        const headers = this.buildHeaders(this._accessToken);
        const maxRetries = options.maxRetries ?? Infinity;
        const baseDelay = options.baseDelay ?? 1000; // ms
        const factor = options.factor ?? 2;
        const maxDelay = options.maxDelay ?? 60000; // 1 minute

        let attempt = 0;
        while (attempt < maxRetries) {
            try {
                const response = await axios.post(url, data, { headers, ...options });
                console.log(response.data);
                return response.data;
            } catch (error) {
                const isNetworkError = !error.response;
                if (!isNetworkError) {
                    // Not a network error, fail fast
                    console.error(error?.response?.status ? `Error: ${error.response.status} - ${error.response.data}` : error.message);
                    throw error;
                }
                
                attempt++;
                const delay = Math.min(baseDelay * Math.pow(factor, attempt - 1), maxDelay);
                console.warn(`[APIManager] Network error on POST ${url}. Retrying attempt ${attempt} in ${delay}ms...`);
                await this._sleep(delay);
            }
        }
        throw new Error(`[APIManager] GET ${url} failed after ${maxRetries} attempts.`);
    }

     async getUrl(url, callback = null, options = {}) {
        const headers = this.buildHeaders(this._accessToken);
        const maxRetries = options.maxRetries ?? Infinity;
        const baseDelay = options.baseDelay ?? 1000; // ms
        const factor = options.factor ?? 2;
        const maxDelay = options.maxDelay ?? 30000; // 30 seconds
        const cancelToken = options.cancelToken;

        let attempt = 0;
        while (attempt < maxRetries) {
            try {
                const axiosConfig = { headers };
                if (cancelToken) {
                    axiosConfig.cancelToken = cancelToken;
                }
                const response = await axios.get(url, axiosConfig);
                if (callback) callback(response.data);
                return response.data;
            } catch (error) {
                if (axios.isCancel(error)) {
                    console.log('[APIManager.getUrl] Request cancelled:', error.message);
                    throw error; // Re-throw cancellation
                }
                const isNetworkError = !error.response;
                if (!isNetworkError) {
                    // Not a network error, so fail fast
                    console.error(error?.response?.status ? `Error: ${error.response.status} - ${error.response.data}` : error.message);
                    throw error;
                }

                attempt++;
                const delay = Math.min(baseDelay * Math.pow(factor, attempt - 1), maxDelay);
                console.warn(`[APIManager] Network error on GET ${url}. Retrying attempt ${attempt} in ${delay}ms...`);
                await this._sleep(delay);
            }
        }
        throw new Error(`[APIManager] GET ${url} failed after ${maxRetries} attempts.`);
    }

   
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async getOptionChain() {
        const instrumentKey = encodeURIComponent(this._symbol);
        const url = `https://api.upstox.com/v2/option/contract?instrument_key=${instrumentKey}`;
        return this.getUrl(url);
    }

    async getPositions() {
    const url = 'https://api.upstox.com/v2/portfolio/short-term-positions';
    return this.getUrl(url);
  }

    buildHeaders(accessToken) {
        return {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + accessToken
        };
    }

    getAccountBalance(segment = null) {
        let url = 'https://api.upstox.com/v2/user/get-funds-and-margin';
        if (segment) {
            url += `?segment=${segment}`;
        }
        return this.getUrl(url);
    }

     async closeAllPositions() {
        const url = 'https://api.upstox.com/v2/order/positions/exit';
        const data = {};
        try {
            const result = await this.postUrl(url, data);
            return result;
        } catch (error) {
            if (error.response && error.response.data && Array.isArray(error.response.data.errors)) {
                const errObj = error.response.data.errors[0];
                if (errObj && errObj.errorCode === 'UDAPI1111') {
                    // Suppress console.error for this specific error
                    console.warn('[APIManager.closeAllPositions] No open position available to exit.');
                    return { status: 'no_positions', message: 'No open position available to exit.' };
                }
            }
            if (error.response) {
                // Only log error if not the specific 'no positions' error
                if (!(error.response.data && Array.isArray(error.response.data.errors) && error.response.data.errors[0]?.errorCode === 'UDAPI1111')) {
                    console.error('[APIManager.closeAllPositions] Error response:', error.response.data);
                }
            } else {
                console.error('[APIManager.closeAllPositions] Error:', error.message);
            }
            throw error;
        }
    }

   

    
    async placeOrder(instrument_token, quantity, transaction_type, options = {}) {
        const url = 'https://api-hft.upstox.com/v3/order/place';
        const data = {
            "quantity": quantity,
            "product": "I", // I for Intraday
            "validity": "DAY",
            "instrument_token": instrument_token,
            "order_type": "MARKET",
            "price": 0,
            "transaction_type": transaction_type,
            "disclosed_quantity": 0,
            "trigger_price": 0,
            "is_amo": false
        };
        try {
            const response = await this.postUrl(url, data, options);
            return response;
        } catch (error) {
            if (error.response) {
                console.error('[APIManager.placeOrder] Error response:', error.response.data);
            } else {
                console.error('[APIManager.placeOrder] Error:', error.message);
            }
            throw error;
        }
    }

    async buyOrder(instrument_token, quantity) {
        return this.placeOrder(instrument_token, quantity, "BUY");
    }

    async sellOrder(instrument_token, quantity) {
        return this.placeOrder(instrument_token, quantity, "SELL");
    }

   
}

export default APIManager;
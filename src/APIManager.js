import axios from 'axios';

class APIManager {
    initialize(token, symbol) {
        this._accessToken = token;
        this._symbol = symbol;
        // Point this to your backend server
        this._proxyBaseUrl = 'http://161.118.186.232:3000/api'; 
    }

    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    buildHeaders(accessToken) {
        return {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + accessToken
        };
    }

    async postUrl(url, data, options = {}) {
        const headers = this.buildHeaders(this._accessToken);
        const maxRetries = options.maxRetries ?? Infinity;
        const baseDelay = options.baseDelay ?? 1000;
        const factor = options.factor ?? 2;
        const maxDelay = options.maxDelay ?? 60000;

        let attempt = 0;
        while (attempt < maxRetries) {
            try {
                // Send to proxy instead of direct Upstox URL
                const response = await axios.post(url, data, { headers, ...options });
                return response.data;
            } catch (error) {
                const isNetworkError = !error.response;
                if (!isNetworkError) {
                    console.error(error?.response?.status ? `Error: ${error.response.status}` : error.message);
                    throw error;
                }
                
                attempt++;
                const delay = Math.min(baseDelay * Math.pow(factor, attempt - 1), maxDelay);
                console.warn(`[APIManager] Network error on POST. Retrying attempt ${attempt}...`);
                await this._sleep(delay);
            }
        }
    }

    async getUrl(url, callback = null, options = {}) {
        const headers = this.buildHeaders(this._accessToken);
        const maxRetries = options.maxRetries ?? Infinity;
        const baseDelay = options.baseDelay ?? 1000;
        const factor = options.factor ?? 2;
        const maxDelay = options.maxDelay ?? 30000;

        let attempt = 0;
        while (attempt < maxRetries) {
            try {
                const response = await axios.get(url, { headers, ...options });
                if (callback) callback(response.data);
                return response.data;
            } catch (error) {
                const isNetworkError = !error.response;
                if (!isNetworkError) throw error;

                attempt++;
                const delay = Math.min(baseDelay * Math.pow(factor, attempt - 1), maxDelay);
                await this._sleep(delay);
            }
        }
    }

    // --- Redirection to Proxy ---

    async getOptionChain() {
        const url = `${this._proxyBaseUrl}/option-chain/${encodeURIComponent(this._symbol)}`;
        return this.getUrl(url);
    }

    async getPositions() {
        const url = `${this._proxyBaseUrl}/positions`;
        return this.getUrl(url);
    }

    async getAccountBalance(segment = null) {
        let url = `${this._proxyBaseUrl}/balance`;
        if (segment) url += `?segment=${segment}`;
        return this.getUrl(url);
    }

    async closeAllPositions() {
        const url = `${this._proxyBaseUrl}/close-all`;
        const data = {};
        try {
            const result = await this.postUrl(url, data);
            return result;
        } catch (error) {
            if (error.response?.data?.errors?.[0]?.errorCode === 'UDAPI1111') {
                return { status: 'no_positions', message: 'No open position available to exit.' };
            }
            throw error;
        }
    }

    async placeOrder(instrument_token, quantity, transaction_type, options = {}) {
        const url = `${this._proxyBaseUrl}/order`;
        // Construct the full payload here as your backend expects it
        const data = {
            "quantity": quantity,
            "product": "I",
            "validity": "DAY",
            "instrument_token": instrument_token,
            "order_type": "MARKET",
            "price": 0,
            "transaction_type": transaction_type,
            "disclosed_quantity": 0,
            "trigger_price": 0,
            "is_amo": false
        };
        return this.postUrl(url, data, options);
    }

    // --- Restored Original Helper Functions ---

    async buyOrder(instrument_token, quantity) {
        return this.placeOrder(instrument_token, quantity, "BUY");
    }

    async sellOrder(instrument_token, quantity) {
        // Kept exactly as your original code (both use "BUY" per your logic)
        return this.placeOrder(instrument_token, quantity, "BUY");
    }
}

export default APIManager;
import axios from 'axios';
const API_BASE =  'http://localhost:4000';

class APIManager {
    constructor() {
        // Track pending POST requests which may be retrying due to network errors
        this._pendingPostRequests = new Set();
    }
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

        // create a cancel token source for this POST flow so it can be cancelled externally
        const cancelSource = axios.CancelToken ? axios.CancelToken.source() : null;
        const requestRecord = { cancelSource, cancelled: false };
        if (cancelSource) this._pendingPostRequests.add(requestRecord);

        let attempt = 0;
        while (attempt < maxRetries) {
            try {
                const axiosConfig = { headers, ...options };
                if (cancelSource) axiosConfig.cancelToken = cancelSource.token;
                const response = await axios.post(url, data, axiosConfig);
                console.log(response.data);
                // finished successfully -- remove tracking
                if (cancelSource) this._pendingPostRequests.delete(requestRecord);
                return response.data;
            } catch (error) {
                // If request was cancelled via cancelAllPendingRequests, rethrow cancellation so callers can handle it
                if (axios.isCancel && axios.isCancel(error)) {
                    console.log('[APIManager.postUrl] Request cancelled:', error.message);
                    if (cancelSource) this._pendingPostRequests.delete(requestRecord);
                    throw error;
                }
                const isNetworkError = !error.response;
                if (!isNetworkError) {
                    // Not a network error, fail fast
                    console.error(error?.response?.status ? `Error: ${error.response.status} - ${error.response.data}` : error.message);
                    if (cancelSource) this._pendingPostRequests.delete(requestRecord);
                    throw error;
                }
                
                attempt++;
                const delay = Math.min(baseDelay * Math.pow(factor, attempt - 1), maxDelay);
                console.warn(`[APIManager] Network error on POST ${url}. Retrying attempt ${attempt} in ${delay}ms...`);
                await this._sleep(delay);
                // If this request was cancelled while sleeping, abort the retry loop
                if (requestRecord.cancelled) {
                    if (cancelSource) this._pendingPostRequests.delete(requestRecord);
                    const cancelErr = new Error('Request cancelled');
                    cancelErr.__CANCEL__ = true;
                    throw cancelErr;
                }
            }
        }
        if (cancelSource) this._pendingPostRequests.delete(requestRecord);
        throw new Error(`[APIManager] POST ${url} failed after ${maxRetries} attempts.`);
    }

    // Cancel any pending POST requests that are currently retrying due to network errors.
    // This will call axios CancelToken.cancel() for each tracked request and mark them cancelled.
    cancelAllPendingRequests(message = 'cancelled by cancelAllPendingRequests') {
        for (const rec of Array.from(this._pendingPostRequests)) {
            try {
                if (rec.cancelSource && typeof rec.cancelSource.cancel === 'function') {
                    rec.cancelSource.cancel(message);
                }
            } catch (e) {
                // ignore
            }
            rec.cancelled = true;
            this._pendingPostRequests.delete(rec);
        }
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

    async getHistoricData(interval, fromDate, toDate) {
        const instrumentKeyEsc = encodeURIComponent(this._symbol);
        const intervalEsc = encodeURIComponent(interval);
        const toDateEsc = encodeURIComponent(toDate);
        const fromDateEsc = encodeURIComponent(fromDate);
        const url = `https://api.upstox.com/v2/historical-candle/${instrumentKeyEsc}/${intervalEsc}/${toDateEsc}/${fromDateEsc}`;
        return this.getUrl(url);
    }

    async getExpiredHistoricalCandles(instrumentKey, interval, toDate, fromDate) {
        const instrumentKeyEsc = encodeURIComponent(instrumentKey);
        const intervalEsc = encodeURIComponent(interval);
        const toDateEsc = encodeURIComponent(toDate);
        const fromDateEsc = encodeURIComponent(fromDate);
        const url = `https://api.upstox.com/v2/expired-instruments/historical-candle/${instrumentKeyEsc}/${intervalEsc}/${toDateEsc}/${fromDateEsc}`;
        return this.getUrl(url);
    }

    async getExpiredFutureContract(instrumentKey, expiryDate) {
        const instrumentKeyEsc = encodeURIComponent(instrumentKey);
        const expiryDateEsc = encodeURIComponent(expiryDate);
        const url = `https://api.upstox.com/v2/expired-instruments/future/contract?instrument_key=${instrumentKeyEsc}&expiry_date=${expiryDateEsc}`;
        return this.getUrl(url);
    }

    async getExpiredOptionContract(instrumentKey, expiryDate) {
        const instrumentKeyEsc = encodeURIComponent(instrumentKey);
        const expiryDateEsc = encodeURIComponent(expiryDate);
        const url = `https://api.upstox.com/v2/expired-instruments/option/contract?instrument_key=${instrumentKeyEsc}&expiry_date=${expiryDateEsc}`;
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
        return this.placeOrder(instrument_token, quantity, "BUY");   //BOTH ARE buy ONLY. One is call other put
    }

     

    async fetchNearestNiftyFutureName(options = {}) {
        const url = `${API_BASE}/api/nifty-future`;
        try {
            const response = await this.getUrl(url, null, options);
            return response ? response : null;
        } catch (error) {
            console.error('[APIManager.fetchNearestNiftyFutureName] Error:', error.message);
            return null;
        }
    }

    // Fetch the current trade configuration from the local API and log the data
    async fetchTradeConfig(options = {}) {
        const url = `${API_BASE}/api/trade-config`;
        try {
            const response = await this.getUrl(url, null, options);
            return response ? response : null;
        } catch (error) {
            console.error('[APIManager.fetchTradeConfig] Error:', error.message || error);
            return null;
        }
    }

    // Post/Update trade configuration to the local API
    async postTradeConfig(data = {}, options = {}) {
        const url = `${API_BASE}/api/trade-config`;
        try {
            const response = await this.postUrl(url, data, options);
            console.log('[APIManager.postTradeConfig] response:', response);
            return response;
        } catch (error) {
            // Mirror other POST error handling: log details and re-throw so callers
            // can observe the failure (postUrl contains retry/cancel logic).
            if (error.response) {
                console.error('[APIManager.postTradeConfig] Error response:', error.response.data);
            } else {
                console.error('[APIManager.postTradeConfig] Error:', error.message || error);
            }
            throw error;
        }
    }

    async isMarketHoliday(date = null) {
        try {
            let url = 'https://api.upstox.com/v2/market/holidays';
            if (date) {
                url += `?date=${encodeURIComponent(date)}`;
            }
            const response = await this.getUrl(url);
            
            if (!response || !response.data) {
                console.warn('[APIManager.isMarketHoliday] No data returned from holidays endpoint.');
                return null;
            }

            // If date was provided, check if the response contains that date as a holiday
            if (date) {
                // Response should contain array of holidays; check if our date is in it
                const holidays = Array.isArray(response.data) ? response.data : [];
                const isHoliday = holidays.some(h => h.date === date || h.trading_date === date);
                console.log(`[APIManager.isMarketHoliday] Date ${date} is ${isHoliday ? 'a holiday' : 'not a holiday'}.`);
                return isHoliday;
            } else {
                // If no date provided, just return the full list (caller can inspect)
                //console.log('[APIManager.isMarketHoliday] All holidays:', response.data);
                return response.data;
            }
        } catch (error) {
            console.error('[APIManager.isMarketHoliday] Error:', error.message || error);
            return null;
        }
    }

   
}

export default APIManager;
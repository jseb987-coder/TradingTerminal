import APIManager from './APIManager';


class TradeDelegate {
  
    initialize(token,symbol) {
        this.apiManager = new APIManager();
        this.apiManager.initialize(token,symbol);
        this._symbolName = symbol;
        this._ltp = null;
    }

      async setupCalls() {
        try {

            const niftyFutureData = await this.apiManager.fetchNearestNiftyFutureName();
            if (!(niftyFutureData && niftyFutureData.data)) {
                console.warn('[TradeDelegate] Unable to fetch nearest NIFTY future contract; using default symbol.');
                return false;
            }
            this._futureSymbol = niftyFutureData.data.instrument_key;
            console.log('[TradeDelegate] Nearest NIFTY future contract set to:', niftyFutureData.data.instrument_key);


            this._positionConfig = await this.apiManager.fetchTradeConfig();
            if (!(this._positionConfig && this._positionConfig.data)) {
                console.warn('[TradeDelegate] Unable to fetch trade configuration; using default settings.');
                return false;
            }

            let startDate = await this.calculateHistoricDataStartDate(5);
            if (!startDate) {
                console.warn('[TradeDelegate] Unable to calculate historic data start date.');
                return false;
            }

            // Fetch historic data from startDate to current date
            this._historicData = await this.getHistoricData(this._futureSymbol, 'minutes', '1', startDate);
            if (!this._historicData) {
                console.warn('[TradeDelegate] Failed to fetch historic data');
                return false;
            }
           // console.log('[TradeDelegate] Historic data fetched successfully:', this._historicData);

           this._bufferData = await this.getBufferData(startDate);
           if (!this._bufferData) {
                console.warn('[TradeDelegate] Failed to fetch buffer data');
                return false;
            }

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

    async calculateHistoricDataStartDate(callback = 5, startDate = null) {

        const baseDate = startDate ? new Date(startDate) : new Date();
        let checkDate = new Date(baseDate);
        let validTradingDays = 0;

        // Keep going back until we have enough valid trading days
        while (validTradingDays < callback) {
            checkDate.setDate(checkDate.getDate() - 1);

            // Skip weekends (Saturday = 6, Sunday = 0)
            const dayOfWeek = checkDate.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                continue; // Skip weekends
            }

            // Check if it's a holiday
            const dateString = checkDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
            try {
                const isHoliday = await this.apiManager.isMarketHoliday(dateString);
                if (isHoliday) {
                    continue; // Skip holidays
                }
            } catch (error) {
                console.warn(`[TradeDelegate] Could not check holiday status for ${dateString}:`, error.message);
                return false; // Exit on error
            }

            // If we reach here, it's a valid trading day
            validTradingDays++;
        }

        // Format the final date as YYYY-MM-DD
        const calculatedStartDate = checkDate.toISOString().split('T')[0];
        const referenceDate = startDate ? startDate : 'today';
        console.log(`[TradeDelegate] Calculated historic data start date: ${calculatedStartDate} (${callback} trading days back from ${referenceDate})`);

        return calculatedStartDate;
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

    get currentPosition() {
        return this._currentPosition;
    }

    get balance() {
        return this._balance;
    }

    get positionConfig() {
        return this._positionConfig;
    }

    setPositionConfig(config) {
        this._positionConfig = { data: config };
    }

    async postTradeConfig() {
        try {
            await this.apiManager.postTradeConfig(this._positionConfig.data);
            console.log('[TradeDelegate] Trade configuration posted to server successfully.');
        } catch (error) {
            console.error('[TradeDelegate] Error posting trade configuration:', error.message);
        }
    }

    async fetchPositionConfig() {
        try {
            const fetched = await this.apiManager.fetchTradeConfig();
            if (fetched && fetched.data) {
                this._positionConfig = fetched;
                console.log('[TradeDelegate] Trade configuration refetched:', this._positionConfig.data);
                return true;
            } else {
                console.warn('[TradeDelegate] Unable to fetch trade configuration.');
                return false;
            }
        } catch (error) {
            console.error('[TradeDelegate] Error refetching trade configuration:', error.message);
            return false;
        }
    }

    setLtp(ltp) {
        this._ltp = ltp;
    }

    getLtp() {
        return this._ltp;
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

            // Precompute sorted ATM options for efficiency
            this.atmCalls = nearestOptions.filter(o => o.instrument_type === 'CE').sort((a, b) => a.strike_price - b.strike_price);
            this.atmPuts = nearestOptions.filter(o => o.instrument_type === 'PE').sort((a, b) => a.strike_price - b.strike_price);

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
            if (this._balance && this._balance.errors && Array.isArray(this._balance.errors) && this._balance.errors.length > 0) {
                const error = this._balance.errors[0];
                if (error.errorCode === 'UDAPI100072') {
                    console.log('[TradeDelegate] Funds service unavailable:', error.message);
                    this._balance = { serviceUnavailable: true, message: error.message };
                    return true;
                }
            }
            if (this._balance && this._balance.locked) {
                console.log('[TradeDelegate] Account balance: Account is locked.');
                return true;
            }
            console.log('[TradeDelegate] Account balance fetched:', this._balance);
            return true;
        } catch (error) {
            console.error('[TradeDelegate] Error fetching account balance:', error.message);
            return false;
        }
    }

    getATMOption(type, currentLTP) {
        const options = type === 'CALL' ? this.atmCalls : this.atmPuts;
        if (!options || options.length === 0) return null;

        if (type === 'CALL') {
            // Find the CE with strike_price >= currentLTP, closest (smallest difference)
            for (let i = 0; i < options.length; i++) {
                if (options[i].strike_price >= currentLTP) {
                    return options[i];
                }
            }
            // If none >=, return the highest strike
            return options[options.length - 1];
        } else {
            // Find the PE with strike_price <= currentLTP, closest (largest strike)
            for (let i = options.length - 1; i >= 0; i--) {
                if (options[i].strike_price <= currentLTP) {
                    return options[i];
                }
            }
            // If none <=, return the lowest strike
            return options[0];
        }
    }

    async getHistoricData(instrumentKey, intervalType, intervalValue, startDate) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const currentDate = yesterday.toISOString().split('T')[0];
        const historicData = await this.apiManager.getHistoricDataV3(instrumentKey, intervalType, intervalValue, currentDate, startDate);
        if (!historicData) {
                console.warn('[TradeDelegate] Failed to fetch historic data');
                return false;
        }
        const intradayData = await this.apiManager.getIntradayCandles(instrumentKey, intervalType, intervalValue);
        if (!intradayData) {
            console.warn('[TradeDelegate] Failed to fetch intraday data');
            return false;
        }
        console.log('[TradeDelegate] Merging historic and intraday data');
        // Merge intraday data first, then historic data, avoiding duplicates
        const mergedDataMap = new Map();
        if (intradayData.data && intradayData.data.candles) {
            intradayData.data.candles.forEach(candle => {
                const key = candle.timestamp || candle[0];
                mergedDataMap.set(key, candle);
            });
        }
        if (historicData.data && historicData.data.candles) {
            historicData.data.candles.forEach(candle => {
                const key = candle.timestamp || candle[0];
                if (!mergedDataMap.has(key)) {
                    mergedDataMap.set(key, candle);
                }
            });
        }
        return Array.from(mergedDataMap.values());
    }

    get historicData() {
        return this._historicData;
    }

    setHistoricData(data) {
        this._historicData = data;
    }

    async getBufferData(startDate) {
        try {
            // Calculate the previous trading day from startDate
            const previousTradingDay = await this.calculateHistoricDataStartDate(1, startDate);
            if (!previousTradingDay) {
                console.warn('[TradeDelegate] Unable to calculate previous trading day for buffer data.');
                return null;
            }

            // Fetch historic data for that specific day
            const bufferData = await this.apiManager.getHistoricDataV3(
                this._futureSymbol,
                'minutes',
                '1',
                previousTradingDay,
                previousTradingDay
            );

            if (!bufferData || !bufferData.data || !bufferData.data.candles) {
                console.warn('[TradeDelegate] Failed to fetch buffer data for date:', previousTradingDay);
                return null;
            }

            console.log(`[TradeDelegate] Buffer data fetched for ${previousTradingDay}:`, bufferData.data.candles.length, 'candles');
            return bufferData.data.candles;
        } catch (error) {
            console.error('[TradeDelegate] Error fetching buffer data:', error.message);
            return null;
        }
    }

}

export default TradeDelegate;
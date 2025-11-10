const TRADEDIRECTION = {
    NONE: 'NONE',
    BUY: 'BUY',
    SELL: 'SELL'
};

class LiveTrader {
    constructor(tradeDelegate) {
        this._tradeDelegate = tradeDelegate;
        this._tradeDirection = TRADEDIRECTION.NONE;
        this._dashingYellow = 0;
    }

    async initialize(historicData,bufferData) {
        // Store or use the historicData as needed
        this._historicData = historicData;
        this._bufferData = bufferData ? bufferData.slice(0, 20) : null;
        this.setUpData();
        
        this._mergedData = [];
        if (this._historicData) {
            this._mergedData = this._mergedData.concat(this._historicData);
        }
        if (this._bufferData) {
            this._mergedData = this._mergedData.concat(this._bufferData);
        }
        
        this._mergedData.reverse();
        this._index = this._mergedData.length - 1 - this._index;

    }

    setUpData() {
        if (!this._historicData || this._historicData.length === 0) {
            return { high: null, low: null, highIndex: -1, lowIndex: -1 };
        }

        let high = -Infinity;
        let low = Infinity;
        let highIndex = -1;
        let lowIndex = -1;

        this._historicData.forEach((candle, index) => {
            const candleHigh = candle[2]; // high
            const candleLow = candle[3];  // low

            if (candleHigh > high) {
                high = candleHigh;
                highIndex = index;
            }

            if (candleLow < low) {
                low = candleLow;
                lowIndex = index;
            }
        });

        // Set trade direction based on high/low sequence
        if (highIndex !== -1 && lowIndex !== -1) {
            if (highIndex < lowIndex) {
                this._tradeDirection = TRADEDIRECTION.SELL;
                this._dashingYellow = high;
                this._index = highIndex;
            } else {
                this._tradeDirection = TRADEDIRECTION.BUY;
                this._dashingYellow = low;
                this._index = lowIndex;
         
            }
        }

        return { high, low, highIndex, lowIndex };
    }

    
}

export default LiveTrader;
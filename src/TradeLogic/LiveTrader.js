import EMAIndicator from './EMAIndicator';

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
        
        // Initialize EMA indicators
        this._greenEma = new EMAIndicator({ emaLength: 10 });
        this._yellowEma = new EMAIndicator({ emaLength: 20 });
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
        this._historicData = this._mergedData;

        // Initialize green EMA with historical data up to the index
        const emaLength = this._greenEma.emaLength; // 10
        const startIndex = Math.max(0, this._index - emaLength + 1);
        const emaData = this._mergedData.slice(startIndex, this._index + 1).map(candle => candle[4]);
        this._greenEma.setCurrentEma(emaData);

        // Initialize yellow EMA with historical data up to the index
        const yellowEmaLength = this._yellowEma.emaLength; // 20
        const yellowStartIndex = Math.max(0, this._index - yellowEmaLength + 1);
        const yellowEmaData = this._mergedData.slice(yellowStartIndex, this._index + 1).map(candle => candle[4]);
        this._yellowEma.setCurrentEma(yellowEmaData);

        // Remove all values before this._index from this._historicData so that this._index becomes zero
        this._historicData = this._historicData.slice(this._index);
        this._index = 0;

        // Iterate through this._historicData and update yellow EMA
        for (let i = 0; i < this._historicData.length; i++) {
            this._yellowEma.update(this._historicData[i][4]);
            this._greenEma.update(this._historicData[i][4]);
        }

        console.log('20 EMA array:', this._yellowEma._emaArray);
        console.log('10 EMA array:', this._greenEma._emaArray);
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
            if (highIndex > lowIndex) {
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

class LiveTrader {
    constructor(tradeDelegate) {
        this._tradeDelegate = tradeDelegate;
    }

    async initialize(historicData) {
        // Store or use the historicData as needed
        this._historicData = historicData;
        console.log(this.findHighLow());
    }

    findHighLow() {
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

        return { high, low, highIndex, lowIndex };
    }

    
}

export default LiveTrader;
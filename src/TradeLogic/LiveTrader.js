import EMAIndicator from './EMAIndicator.js';

class LiveTrader {
    constructor(apiManager) {
        this.apiManager = apiManager;
        this.isRunning = false;
        this.candles = [];
        this.ema10Values = [];
        this.ema20Values = [];
        this.lastProcessedCandleCount = 0;
        this.marketHolidays = new Set();
    }

    async initialize() {
        // Common initialization logic
        console.log('[TradeLogic] Initializing...');
    }

    async start() {
        this.isRunning = true;
        console.log('[TradeLogic] Starting trading logic...');
    }

    async stop() {
        this.isRunning = false;
        console.log('[TradeLogic] Stopping trading logic...');
    }

    async executeTrade(signal) {
        // Common trade execution logic
        console.log('[TradeLogic] Executing trade:', signal);
    }

    BuySignalGenerated(price) {
        // Override in child classes
    }

    SellSignalGenerated(price) {
        // Override in child classes
    }

    async init(marketData) {
        this.candles = marketData;
        const closes = this.candles.map(c => c.close);

        const ema10Indicator = new EMAIndicator({ emaLength: 10 });
        const ema20Indicator = new EMAIndicator({ emaLength: 20 });

        const ema10Result = ema10Indicator.calculate(closes);
        const ema20Result = ema20Indicator.calculate(closes);

        if (ema10Result.error || ema20Result.error) {
            console.log('[TradeLogic.init] Error calculating EMAs:', ema10Result.error || ema20Result.error);
            return;
        }

        this.ema10Values = ema10Result.ema;
        this.ema20Values = ema20Result.ema;

        console.log('[TradeLogic] Initialized with market data');
    }

    setMarketHolidays(holidays) {
        this.marketHolidays = holidays;
    }

    async getLastTwoDaysOneMinuteData(symbol, interval = '1minute', openDays) {
        if (!openDays) {
            openDays = await this.apiManager.getLastTwoMarketOpenDays(30, this.marketHolidays);
        }
        return this.apiManager.getLastTwoDaysOneMinuteData(symbol, interval, openDays);
    }

    async getCandleDataAndSignals() {
       
        return;
    }

    pushLatestCandle(candle) {
        this.candles.push(candle);
        const closes = this.candles.map(c => c.close);

        const ema10Indicator = new EMAIndicator({ emaLength: 10 });
        const ema20Indicator = new EMAIndicator({ emaLength: 20 });

        const ema10Result = ema10Indicator.calculate(closes);
        const ema20Result = ema20Indicator.calculate(closes);

        if (ema10Result.error || ema20Result.error) {
            console.log('[TradeLogic] Error calculating EMAs:', ema10Result.error || ema20Result.error);
            return null;
        }

        this.ema10Values = ema10Result.ema;
        this.ema20Values = ema20Result.ema;

        // Check for EMA cross signals
        if (this.ema10Values.length < 2 || this.ema20Values.length < 2) return;

        const latest10 = this.ema10Values[this.ema10Values.length - 1];
        const latest20 = this.ema20Values[this.ema20Values.length - 1];
        const prev10 = this.ema10Values[this.ema10Values.length - 2];
        const prev20 = this.ema20Values[this.ema20Values.length - 2];

        if (prev10 <= prev20 && latest10 > latest20) {
            this.BuySignalGenerated(candle.close);
        } else if (prev10 >= prev20 && latest10 < latest20) {
            this.SellSignalGenerated(candle.close);
        }

        return; // No longer returns signal
    }

    async processCandleData(candles) {
        if (candles.length > this.lastProcessedCandleCount) {
            const newCandles = candles.slice(this.lastProcessedCandleCount);
            for (const candle of newCandles) {
                this.pushLatestCandle(candle);
            }
            this.lastProcessedCandleCount = candles.length;
        }
    }
}

export default LiveTrader;
class Button {
  constructor(tradeDelegate, setPositionStatus, setBusy) {
    this.tradeDelegate = tradeDelegate;
    this.setPositionStatus = setPositionStatus;
    this.setBusy = setBusy;
  }

  async execute() {
    throw new Error('execute method must be implemented by subclass');
  }

  getLabel() {
    throw new Error('getLabel method must be implemented by subclass');
  }

  getStyle() {
    return {
      padding: "1rem 2rem",
      fontSize: "2.4vw",
      border: "none",
      borderRadius: "0.25rem",
      minWidth: "160px",
    };
  }

  isDisabled(positionStatus) {
    return false;
  }

  getCursor(positionStatus, isBusy = false) {
    return (this.isDisabled(positionStatus) || isBusy) ? 'not-allowed' : 'pointer';
  }
}

class BuyButton extends Button {
  async execute() {
    try {
      this.setBusy(true);
      const atmCall = this.tradeDelegate.getATMOption('CALL', this.tradeDelegate.getLtp());
      if (atmCall) {
        const quantity = atmCall.lot_size;
        const response = await this.tradeDelegate.buyOrder(atmCall.instrument_token, quantity);
        console.log('Buy order response:', response);
        
        // Only update position status if order was successful
        if (response && response.status === 'success') {
          this.setPositionStatus(1);
        } else {
          console.error('Buy order failed, not updating position status');
        }
      } else {
        console.error('No ATM CALL option found');
      }
    } catch (error) {
      console.error('Buy order failed:', error);
    } finally {
      this.setBusy(false);
    }
  }

  getLabel() {
    return 'Buy';
  }

  getStyle() {
    return {
      ...super.getStyle(),
      backgroundColor: "limegreen",
      color: "black",
    };
  }

  isDisabled(positionStatus) {
    return positionStatus !== 0;
  }
}

class SellButton extends Button {
  async execute() {
    try {
      this.setBusy(true);
      const atmPut = this.tradeDelegate.getATMOption('PUT', this.tradeDelegate.getLtp());
      if (atmPut) {
        const quantity = atmPut.lot_size;
        const response = await this.tradeDelegate.buyOrder(atmPut.instrument_token, quantity);
        console.log('Sell order response:', response);
        
        // Only update position status if order was successful
        if (response && response.status === 'success') {
          this.setPositionStatus(2);
        } else {
          console.error('Sell order failed, not updating position status');
        }
      } else {
        console.error('No ATM PUT option found');
      }
    } catch (error) {
      console.error('Sell order failed:', error);
    } finally {
      this.setBusy(false);
    }
  }

  getLabel() {
    return 'Sell';
  }

  getStyle() {
    return {
      ...super.getStyle(),
      backgroundColor: "red",
      color: "white",
    };
  }

  isDisabled(positionStatus) {
    return positionStatus !== 0;
  }
}

class CloseButton extends Button {
  async execute() {
    try {
      this.setBusy(true);
      const response = await this.tradeDelegate.closeAllPositions();
      console.log('Close all positions response:', response);
      
      // Only update position status if close operation was successful
      if (response && response.status === 'success') {
        this.setPositionStatus(0);
      } else {
        console.error('Close all positions failed, not updating position status');
      }
    } catch (error) {
      console.error('Close all positions failed:', error);
    } finally {
      this.setBusy(false);
    }
  }

  getLabel() {
    return 'Close All';
  }

  getStyle() {
    return {
      ...super.getStyle(),
      backgroundColor: "orange",
      color: "black",
    };
  }
}

class ReverseButton extends Button {
  constructor(tradeDelegate, setPositionStatus, getPositionStatus, setBusy) {
    super(tradeDelegate, setPositionStatus, setBusy);
    this.getPositionStatus = getPositionStatus;
  }

  async execute() {
    try {
      this.setBusy(true);
      await this.tradeDelegate.closeAllPositions();
      const currentPosition = this.getPositionStatus();
      if (currentPosition === 1) {
        const atmPut = this.tradeDelegate.getATMOption('PUT', this.tradeDelegate.getLtp());
        if (atmPut) {
          const quantity = atmPut.lot_size;
          const response = await this.tradeDelegate.buyOrder(atmPut.instrument_token, quantity);
          console.log('Reverse to PUT buy order response:', response);
          
          // Only update position status if order was successful
          if (response && response.status === 'success') {
            this.setPositionStatus(2);
          } else {
            console.error('Reverse to PUT order failed, not updating position status');
          }
        } else {
          console.error('No ATM PUT option found for reverse');
        }
      } else if (currentPosition === 2) {
        const atmCall = this.tradeDelegate.getATMOption('CALL', this.tradeDelegate.getLtp());
        if (atmCall) {
          const quantity = atmCall.lot_size;
          const response = await this.tradeDelegate.buyOrder(atmCall.instrument_token, quantity);
          console.log('Reverse to CALL buy order response:', response);
          
          // Only update position status if order was successful
          if (response && response.status === 'success') {
            this.setPositionStatus(1);
          } else {
            console.error('Reverse to CALL order failed, not updating position status');
          }
        } else {
          console.error('No ATM CALL option found for reverse');
        }
      } else {
        console.log('No position to reverse');
      }
    } catch (error) {
      console.error('Reverse failed:', error);
    } finally {
      this.setBusy(false);
    }
  }

  getLabel() {
    return 'Reverse';
  }

  getStyle() {
    return {
      ...super.getStyle(),
      backgroundColor: "blue",
      color: "white",
    };
  }

  isDisabled(positionStatus) {
    return positionStatus === 0;
  }
}

export { Button, BuyButton, SellButton, CloseButton, ReverseButton };
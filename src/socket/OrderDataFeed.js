// OrderDataFeed - simple WebSocket wrapper for Upstox order/portfolio feed
// Similar shape to MarketDataFeed but without protobuf decoding

const getUrl = async (token) => {
  const apiUrl = "https://api.upstox.com/v2/feed/portfolio-stream-feed/authorize";
  const headers = {
    "Content-type": "application/json",
    Authorization: "Bearer " + token,
  };
  const response = await fetch(apiUrl, { method: "GET", headers });
  if (!response.ok) throw new Error("Network response was not ok");
  const res = await response.json();
  // The API returns the authorized redirect URI in res.data.authorized_redirect_uri or similar
  const url = res?.data?.authorized_redirect_uri || res?.data?.authorizedRedirectUri || res?.data?.authorized_redirect_uri;
  console.log('Order feed authorized redirect URI:', url);
  return url;
};

class OrderDataFeed {
  constructor(token, onMessageCallback, onConnect, onDisconnect) {
    this.token = token;
    this.onMessageCallback = onMessageCallback;
    this.onConnect = onConnect;
    this.onDisconnect = onDisconnect;
    this.ws = null;
    this.init();
  }

  async init() {
    await this.connect();
  }

  async connect() {
    try {
      const wsUrl = await getUrl(this.token);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('Order feed connected');
        if (this.onConnect) this.onConnect();
      };

      this.ws.onmessage = (event) => {
        // event.data is usually a string; pass through to callback
        if (this.onMessageCallback) this.onMessageCallback(event.data);
      };

      this.ws.onclose = () => {
        console.log('Order feed closed');
        if (this.onDisconnect) this.onDisconnect();
      };

      this.ws.onerror = (error) => {
        console.error('Order feed error:', error);
        if (this.onDisconnect) this.onDisconnect();
      };
    } catch (error) {
      console.error('Order feed connection error:', error);
    }
  }

  disconnect() {
    if (this.ws) this.ws.close();
  }
}

export default OrderDataFeed;

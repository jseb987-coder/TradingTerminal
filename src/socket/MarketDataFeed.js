import proto from "./MarketDataFeedV3.proto";
import { Buffer } from "buffer";
const protobuf = require("protobufjs");

// Initialize Protobuf root
let protobufRoot = null;
const initProtobuf = async () => {
  protobufRoot = await protobuf.load(proto);
  console.log("Protobuf part initialization complete");
};

// Function to get WebSocket URL
const getUrl = async (token) => {
  const apiUrl = "https://api.upstox.com/v3/feed/market-data-feed/authorize";
  let headers = {
    "Content-type": "application/json",
    Authorization: "Bearer " + token,
  };
  const response = await fetch(apiUrl, {
    method: "GET",
    headers: headers,
  });
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  const res = await response.json();
  console.log('Authorized redirect URI:', res.data.authorizedRedirectUri);
  return res.data.authorizedRedirectUri;
};

// Helper functions for handling Blob and ArrayBuffer
const blobToArrayBuffer = async (blob) => {
  if ("arrayBuffer" in blob) return await blob.arrayBuffer();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject();
    reader.readAsArrayBuffer(blob);
  });
};

// Decode Protobuf messages
const decodeProfobuf = (buffer) => {
  if (!protobufRoot) {
    console.warn("Protobuf part not initialized yet!");
    return null;
  }
  const FeedResponse = protobufRoot.lookupType(
    "com.upstox.marketdatafeederv3udapi.rpc.proto.FeedResponse"
  );
  return FeedResponse.decode(buffer);
};

// MarketDataFeed class
class MarketDataFeed {
  constructor(token, onMessageCallback, instrumentKeys, onConnect, onDisconnect) {
    this.token = token;
    this.onMessageCallback = onMessageCallback;
    this.instrumentKeys = instrumentKeys;
    this.onConnect = onConnect;
    this.onDisconnect = onDisconnect;
    this.ws = null;
    this.init();
  }

  async init() {
    await initProtobuf();
    this.connect();
  }

  async connect() {
    try {
      const wsUrl = await getUrl(this.token);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log("Connected");
        if (this.onConnect) this.onConnect();
        const data = {
          guid: "someguid",
          method: "sub",
          data: {
            mode: "full",
            instrumentKeys: this.instrumentKeys,
          },
        };
        console.log('Sending subscription:', data);
        this.ws.send(Buffer.from(JSON.stringify(data)));
      };

      this.ws.onclose = () => {
        console.log("WebSocket closed");
        if (this.onDisconnect) this.onDisconnect();
      };

      this.ws.onmessage = async (event) => {
        const arrayBuffer = await blobToArrayBuffer(event.data);
        let buffer = Buffer.from(arrayBuffer);
        let response = decodeProfobuf(buffer);
        if (this.onMessageCallback) {
          this.onMessageCallback(JSON.stringify(response));
        }
      };

      this.ws.onerror = (error) => {
        console.log("WebSocket error:", error);
        if (this.onDisconnect) this.onDisconnect();
      };
    } catch (error) {
      console.error("WebSocket connection error:", error);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

export default MarketDataFeed;

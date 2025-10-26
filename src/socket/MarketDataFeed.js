// No React import needed
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
function decodeProfobuf(buffer) {
  if (!protobufRoot) {
    console.warn("Protobuf part not initialized yet!");
    return null;
  }
  const FeedResponse = protobufRoot.lookupType(
    "com.upstox.marketdatafeederv3udapi.rpc.proto.FeedResponse"
  );
  return FeedResponse.decode(buffer);
}

class MarketDataFeed {
  static decodeProfobuf(buffer) {
    return decodeProfobuf(buffer);
  }
  constructor() {
    this.isConnected = false;
    this.feedData = [];
    this.ws = null;
    this.instrumentKeys = [];
  }

  async init(token, instrumentKeys = []) {
    await initProtobuf();
    this.instrumentKeys = instrumentKeys;
    await this.connectWebSocket(token);
  }

  close() {
    if (this.ws) {
      this.ws.close();
    }
  }

  async connectWebSocket(token) {
    try {
      const wsUrl = await getUrl(token);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        const data = {
          guid: "someguid",
          method: "sub",
          data: {
            mode: "ltpc",
            instrumentKeys: this.instrumentKeys.length > 0 ? this.instrumentKeys : ["NSE_EQ|INE669E01016"],
          },
        };
        this.ws.send(Buffer.from(JSON.stringify(data)));
      };

      this.ws.onclose = () => {
        this.isConnected = false;
      };

      this.ws.onmessage = async (event) => {
        const arrayBuffer = await blobToArrayBuffer(event.data);
        let buffer = Buffer.from(arrayBuffer);
        let response = decodeProfobuf(buffer);
        this.feedData.push(JSON.stringify(response));
      };

      this.ws.onerror = (error) => {
        this.isConnected = false;
      };
    } catch (error) {
      // Optionally keep a single error log
      console.error('[MarketDataFeed] WebSocket connection error:', error);
    }
  }
}

export default MarketDataFeed;

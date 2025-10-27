import { useEffect, useState } from "react";
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

// MarketDataFeed class for OOP approach
class MarketDataFeed {
  constructor(token, onDataCallback, instrumentKeys, onConnect, onDisconnect) {
    this.token = token;
    this.onData = onDataCallback;
    this.instrumentKeys = instrumentKeys;
    this.onConnect = onConnect;
    this.onDisconnect = onDisconnect;
    this.ws = null;
    this.isConnected = false;
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
        this.isConnected = true;
        console.log("Connected");
        this.onConnect?.();
        const data = {
          guid: "someguid",
          method: "sub",
          data: {
            mode: "ltpc",
            instrumentKeys: this.instrumentKeys,
          },
        };
        this.ws.send(Buffer.from(JSON.stringify(data)));
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        console.log("Disconnected");
        this.onDisconnect?.();
      };

      this.ws.onmessage = (event) => this.handleMessage(event);

      this.ws.onerror = (error) => {
        this.isConnected = false;
        console.log("WebSocket error:", error);
        this.onDisconnect?.();
      };
    } catch (error) {
      console.error("WebSocket connection error:", error);
    }
  }

  async handleMessage(event) {
    const arrayBuffer = await blobToArrayBuffer(event.data);
    let buffer = Buffer.from(arrayBuffer);
    let response = decodeProfobuf(buffer);
    if (this.onData) {
      this.onData(JSON.stringify(response));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Hook to use the MarketDataFeed class
function useMarketDataFeed(token, instrumentKeys) {
  const [feedData, setFeedData] = useState([]);

  useEffect(() => {
    const manager = new MarketDataFeed(token, (data) => {
      setFeedData((currentData) => [...currentData, data]);
    }, instrumentKeys);

    return () => manager.disconnect();
  }, [token, instrumentKeys]);

  return { feedData };
}

export default useMarketDataFeed;
export { MarketDataFeed };

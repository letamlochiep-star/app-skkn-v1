// Vitest setup for Node.js environment
if (typeof globalThis.WebSocket === "undefined") {
  class MockWebSocket {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;

    readyState = MockWebSocket.CLOSED;
    send() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
  }
  // @ts-expect-error - polyfill for tests
  globalThis.WebSocket = MockWebSocket;
}

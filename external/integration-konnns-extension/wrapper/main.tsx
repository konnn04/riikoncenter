// 1. Chrome API Polyfill via Proxy
const mockEvent = {
  addListener: () => { },
  removeListener: () => { },
  hasListener: () => false,
};

// Proxy generator: Automatically returns mockEvent for any property starting with 'on'
// and returns an empty function for any unknown method to mock browser APIs safely.
const createMockApi = (base: Record<string, unknown>) => new Proxy(base, {
  get(target, prop) {
    if (typeof prop === 'string' && prop in target) return target[prop];
    if (typeof prop === 'string' && prop.startsWith('on')) return mockEvent;
    return async () => ({});
  }
});

(window as unknown as Record<string, unknown>).chrome = {
  runtime: createMockApi({
    id: 'riikon-center-mock',
    getManifest: () => ({ version: '0.4.0' }),
    getURL: (path: string) => {
      const origin = window.location.origin;
      if (path.includes('site.html')) return `${origin}/?page=site`;
      return origin + path;
    },
    sendMessage: async (msg: Record<string, unknown>) => {
      if (msg && msg.type === "site:open") {
        const route = typeof msg.route === 'string' ? msg.route : '/';
        const targetPath = `/apps/konnns-extension?path=${encodeURIComponent(route.startsWith('#') ? route : '#' + route)}`;
        window.parent.postMessage({ type: 'NAVIGATE', path: targetPath }, '*');
      }
      return {};
    }
  }),
  tabs: createMockApi({
    query: async () => [],
    create: async ({ url }: { url: string }) => {
      // Use postMessage to send navigation commands to RiikonCenter (Next.js)
      const hash = new URL(url).hash || '#/';
      const targetPath = `/apps/konnns-extension?path=${encodeURIComponent(hash)}`;
      window.parent.postMessage({ type: 'NAVIGATE', path: targetPath }, '*');
      return {};
    }
  }),
  storage: createMockApi({
    local: createMockApi({}),
    sync: createMockApi({}),
  }),
  scripting: createMockApi({}),
};

// Ensure WXT/Browser API also receives the mock
(window as unknown as Record<string, unknown>).browser = (window as unknown as Record<string, unknown>).chrome;

// 2. Fetch API Proxy for CORS workaround
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  let url = typeof input === 'string' ? input : (input instanceof Request ? input.url : '');
  if (url.startsWith('https://wallhaven.cc/api')) {
    url = url.replace('https://wallhaven.cc/api', '/wallhaven-api');
    if (typeof input === 'string') {
      input = url;
    } else if (input instanceof Request) {
      input = new Request(url, init);
    }
  } else if (url.startsWith('https://w.wallhaven.cc')) {
    // Redirect image domain requests
    url = url.replace('https://w.wallhaven.cc', '/wallhaven-img');
    if (typeof input === 'string') {
      input = url;
    } else if (input instanceof Request) {
      input = new Request(url, init);
    }
  }
  return originalFetch(input, init);
};

// 3. Lightweight router for multi-app wrapping
const urlParams = new URLSearchParams(window.location.search);
const page = urlParams.get('page');

if (page === 'popup') {
  // Force dark mode to prevent white flash
  document.documentElement.classList.add('dark');
  document.documentElement.style.setProperty('background', 'transparent', 'important');
  document.body.style.setProperty('background', 'transparent', 'important');

  // Inject CSS to style the Popup as a floating Card
  const style = document.createElement('style');
  style.innerHTML = `
    html, body {
      background-color: transparent !important;
      color-scheme: dark;
      margin: 0;
      padding: 0;
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: flex-end; /* Push menu to the bottom, near the trigger */
      align-items: flex-start;
    }
    #root {
      background-color: #0f172a; /* Original popup background */
      border-radius: 16px !important; /* Stronger border radius */
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      width: fit-content;
      height: fit-content;
      overflow: hidden;
      margin: 20px; /* Add spacing to prevent clipping the shadow */
    }
  `;
  document.head.appendChild(style);

  // Return Tools & Apps Menu if URL has ?page=popup
  import("@/entrypoints/popup/main.tsx");
} else if (page === 'site') {
  // Return tool interfaces (Whiteboard, Audio Editor...)
  import("@/entrypoints/site/main.tsx");
} else {
  // Return the default New Tab interface if no page is specified
  import("@/entrypoints/newtab/main.tsx");
}




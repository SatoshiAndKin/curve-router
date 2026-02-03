import http from "node:http";
import curve from "@curvefi/api";

const RPC_URL = process.env.RPC_URL || "http://ski-nuc-3a:8545";
const PORT = parseInt(process.env.PORT || "3000", 10);
const HOST = process.env.HOST || "0.0.0.0";

const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

const symbolCache = new Map<string, string>();

async function getTokenSymbol(address: string): Promise<string> {
  const lower = address.toLowerCase();
  const cached = symbolCache.get(lower);
  if (cached !== undefined) {
    return cached;
  }
  try {
    const symbol = await curve.getCoinsData([address]).then((data) => data[0]?.symbol || "");
    symbolCache.set(lower, symbol);
    return symbol;
  } catch {
    symbolCache.set(lower, "");
    return "";
  }
}

interface RouteResult {
  from: string;
  from_symbol: string;
  to: string;
  to_symbol: string;
  amount: string;
  output: string;
  route: unknown[];
  router_address: string;
  calldata: string;
  approval_target?: string;
  approval_calldata?: string;
}

async function initCurve() {
  console.log(`Connecting to Ethereum at ${RPC_URL}...`);
  await curve.init("JsonRpc", { url: RPC_URL }, { chainId: 1 });

  console.log("Fetching pools...");
  await Promise.all([
    curve.factory.fetchPools(),
    curve.crvUSDFactory.fetchPools(),
    curve.cryptoFactory.fetchPools(),
    curve.twocryptoFactory.fetchPools(),
    curve.tricryptoFactory.fetchPools(),
    curve.stableNgFactory.fetchPools(),
  ]);
  console.log("Curve API initialized");
}

async function findRoute(
  from: string,
  to: string,
  amount: string,
  sender?: string
): Promise<RouteResult> {
  const [{ route, output }, fromSymbol, toSymbol] = await Promise.all([
    curve.router.getBestRouteAndOutput(from, to, amount),
    getTokenSymbol(from),
    getTokenSymbol(to),
  ]);

  const swapTx = await curve.router.populateSwap(from, to, amount);

  if (!swapTx.to || !swapTx.data) {
    throw new Error("Failed to generate swap transaction");
  }

  const result: RouteResult = {
    from,
    from_symbol: fromSymbol,
    to,
    to_symbol: toSymbol,
    amount,
    output,
    route,
    router_address: swapTx.to,
    calldata: swapTx.data,
  };

  if (sender && ADDRESS_REGEX.test(sender)) {
    const isApproved = await curve.hasAllowance([from], [amount], sender, swapTx.to);
    if (!isApproved) {
      const approveTxs = await curve.router.populateApprove(from, amount, false, sender);
      const approveTx = approveTxs[0];
      if (approveTx?.to && approveTx?.data) {
        result.approval_target = approveTx.to;
        result.approval_calldata = approveTx.data;
      }
    }
  }

  return result;
}

function sendJson(res: http.ServerResponse, status: number, data: object) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function sendError(res: http.ServerResponse, status: number, message: string) {
  sendJson(res, status, { error: message });
}

function sendHtml(res: http.ServerResponse, html: string) {
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(html);
}

const INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Curve Route Finder</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
    h1 { margin-bottom: 20px; color: #333; }
    form { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; }
    .form-group { margin-bottom: 16px; }
    label { display: block; font-weight: 600; margin-bottom: 6px; color: #555; }
    input { width: 100%; padding: 10px; font-size: 14px; font-family: monospace; border: 1px solid #ddd; border-radius: 4px; }
    input:focus { outline: none; border-color: #0066cc; }
    button { padding: 12px 24px; font-size: 16px; cursor: pointer; background: #0066cc; color: white; border: none; border-radius: 4px; }
    button:hover { background: #0052a3; }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
    #result { background: #1e1e1e; color: #d4d4d4; padding: 20px; border-radius: 8px; display: none; }
    #result.show { display: block; }
    #result pre { margin: 0; white-space: pre-wrap; word-break: break-all; font-size: 13px; }
    .error { color: #e74c3c; }
    .result-header { color: #888; margin-bottom: 12px; font-size: 14px; }
    .field { margin-bottom: 12px; }
    .field-label { color: #888; font-size: 12px; text-transform: uppercase; }
    .field-value { color: #4ec9b0; word-break: break-all; }
    .field-value.number { color: #b5cea8; }
    .route-step { background: #2d2d2d; padding: 10px; border-radius: 4px; margin: 8px 0; }
    .route-step-header { color: #dcdcaa; margin-bottom: 6px; }
  </style>
</head>
<body>
  <h1>Curve Route Finder</h1>
  
  <form id="form">
    <div class="form-group">
      <label for="from">From (token address)</label>
      <input type="text" id="from" placeholder="0x..." value="0x6B175474E89094C44Da98b954EedeAC495271d0F">
    </div>
    <div class="form-group">
      <label for="to">To (token address)</label>
      <input type="text" id="to" placeholder="0x..." value="0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48">
    </div>
    <div class="form-group">
      <label for="amount">Input Amount</label>
      <input type="text" id="amount" value="1000" style="width: 200px;">
    </div>
    <div class="form-group">
      <label for="sender">Sender (optional, for approval check)</label>
      <input type="text" id="sender" placeholder="0x...">
    </div>
    <button type="submit" id="submit">Find Route</button>
  </form>
  
  <div id="result"></div>

  <script>
    const form = document.getElementById('form');
    const result = document.getElementById('result');
    const submit = document.getElementById('submit');

    function formatRoute(route) {
      if (!route || route.length === 0) return '<div class="field-value">No route found</div>';
      return route.map((step, i) => \`
        <div class="route-step">
          <div class="route-step-header">Step \${i + 1}: \${step.poolId || 'Unknown Pool'}</div>
          <div class="field-label">Input</div>
          <div class="field-value">\${step.inputCoin ? step.inputCoin + ' ' : ''}<span style="color: #888; font-size: 11px;">\${step.inputCoinAddress}</span></div>
          <div class="field-label">Output</div>
          <div class="field-value">\${step.outputCoin ? step.outputCoin + ' ' : ''}<span style="color: #888; font-size: 11px;">\${step.outputCoinAddress}</span></div>
        </div>
      \`).join('');
    }

    function showResult(data) {
      result.className = 'show';
      result.innerHTML = \`
        <div class="result-header">Route Found</div>
        <div class="field">
          <div class="field-label">From</div>
          <div class="field-value">\${data.from_symbol ? data.from_symbol + ' ' : ''}<span style="color: #888; font-size: 11px;">\${data.from}</span></div>
        </div>
        <div class="field">
          <div class="field-label">To</div>
          <div class="field-value">\${data.to_symbol ? data.to_symbol + ' ' : ''}<span style="color: #888; font-size: 11px;">\${data.to}</span></div>
        </div>
        <div class="field">
          <div class="field-label">Input Amount</div>
          <div class="field-value number">\${data.amount}</div>
        </div>
        <div class="field">
          <div class="field-label">Output Amount</div>
          <div class="field-value number">\${data.output}</div>
        </div>
        <div class="field">
          <div class="field-label">Route (\${data.route.length} steps)</div>
          \${formatRoute(data.route)}
        </div>
        <div class="field">
          <div class="field-label">Router Address</div>
          <div class="field-value">\${data.router_address}</div>
        </div>
        <div class="field">
          <div class="field-label">Calldata</div>
          <div class="field-value" style="font-size: 11px;">\${data.calldata}</div>
        </div>
        \${data.approval_target ? \`
        <div class="field">
          <div class="field-label">Approval Target</div>
          <div class="field-value">\${data.approval_target}</div>
        </div>
        <div class="field">
          <div class="field-label">Approval Calldata</div>
          <div class="field-value" style="font-size: 11px;">\${data.approval_calldata}</div>
        </div>
        \` : ''}
      \`;
    }

    function showError(msg) {
      result.className = 'show';
      result.innerHTML = '<div class="error">' + msg + '</div>';
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const from = document.getElementById('from').value.trim();
      const to = document.getElementById('to').value.trim();
      const amount = document.getElementById('amount').value.trim();
      const sender = document.getElementById('sender').value.trim();

      submit.disabled = true;
      submit.textContent = 'Finding Route...';
      result.className = 'show';
      result.innerHTML = '<div class="result-header">Finding best route...</div>';

      try {
        const params = new URLSearchParams({ from, to, amount });
        if (sender) params.set('sender', sender);
        
        const res = await fetch('/route?' + params.toString());
        const data = await res.json();
        
        if (data.error) {
          showError(data.error);
        } else {
          showResult(data);
          const url = new URL(window.location.href);
          url.searchParams.set('from', from);
          url.searchParams.set('to', to);
          url.searchParams.set('amount', amount);
          if (sender) url.searchParams.set('sender', sender);
          else url.searchParams.delete('sender');
          window.history.replaceState({}, '', url.toString());
        }
      } catch (err) {
        showError('Request failed: ' + err.message);
      } finally {
        submit.disabled = false;
        submit.textContent = 'Find Route';
      }
    });

    // Auto-fill from URL params
    const params = new URLSearchParams(window.location.search);
    if (params.get('from')) document.getElementById('from').value = params.get('from');
    if (params.get('to')) document.getElementById('to').value = params.get('to');
    if (params.get('amount')) document.getElementById('amount').value = params.get('amount');
    if (params.get('sender')) document.getElementById('sender').value = params.get('sender');
  </script>
</body>
</html>`;

async function handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || "/", `http://${req.headers.host}`);

  if (url.pathname === "/" && req.method === "GET") {
    sendHtml(res, INDEX_HTML);
    return;
  }

  if (url.pathname === "/health") {
    sendJson(res, 200, { status: "ok" });
    return;
  }

  if (url.pathname === "/route" && req.method === "GET") {
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const amount = url.searchParams.get("amount") || "1";
    const sender = url.searchParams.get("sender") || undefined;

    if (!from || !to) {
      sendError(res, 400, "Missing required parameters: from, to");
      return;
    }

    if (!ADDRESS_REGEX.test(from) || !ADDRESS_REGEX.test(to)) {
      sendError(res, 400, "Invalid address format");
      return;
    }

    if (sender && !ADDRESS_REGEX.test(sender)) {
      sendError(res, 400, "Invalid sender address format");
      return;
    }

    try {
      const result = await findRoute(from, to, amount, sender);
      sendJson(res, 200, result);
    } catch (err) {
      console.error("Route error:", err);
      sendError(res, 500, err instanceof Error ? err.message : "Unknown error");
    }
    return;
  }

  sendError(res, 404, "Not found");
}

async function main() {
  await initCurve();

  const server = http.createServer(handleRequest);
  server.listen(PORT, HOST, () => {
    console.log(`Server listening on http://${HOST}:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

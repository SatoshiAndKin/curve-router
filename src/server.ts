import http from "node:http";
import curve from "@curvefi/api";

const RPC_URL = process.env.RPC_URL || "http://ski-nuc-3a:8545";
const PORT = parseInt(process.env.PORT || "3000", 10);
const HOST = process.env.HOST || "0.0.0.0";

const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

interface RouteResult {
  from: string;
  to: string;
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
  const { route, output } = await curve.router.getBestRouteAndOutput(from, to, amount);

  const swapTx = await curve.router.populateSwap(from, to, amount);

  if (!swapTx.to || !swapTx.data) {
    throw new Error("Failed to generate swap transaction");
  }

  const result: RouteResult = {
    from,
    to,
    amount,
    output,
    route,
    router_address: swapTx.to,
    calldata: swapTx.data,
  };

  if (sender && ADDRESS_REGEX.test(sender)) {
    const isApproved = await curve.router.isApproved(from, amount);
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

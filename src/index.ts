import { createServer } from "node:http";
import curve from "@curvefi/api";
import { parseRouteParams, type RouteParams } from "./route.js";

const RPC_URL = process.env.RPC_URL ?? "http://ski-nuc-3a:8545";
const PORT = Number(process.env.PORT ?? 3000);

async function initCurve() {
  console.log("Initializing Curve API...");
  await curve.init("JsonRpc", { url: RPC_URL }, { chainId: 1 });
  console.log("Curve API initialized on chain:", curve.chainId);

  await Promise.all([
    curve.factory.fetchPools(),
    curve.crvUSDFactory.fetchPools(),
    curve.cryptoFactory.fetchPools(),
    curve.twocryptoFactory.fetchPools(),
    curve.tricryptoFactory.fetchPools(),
    curve.stableNgFactory.fetchPools(),
  ]);
  console.log("Pools fetched");
}

export async function getRoute(params: RouteParams) {
  const { route, output } = await curve.router.getBestRouteAndOutput(
    params.from,
    params.to,
    params.amount
  );
  const gasEstimate = await curve.router.estimateGas.swap(
    params.from,
    params.to,
    params.amount
  );
  return { ...params, output, gasEstimate, route };
}

const server = createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "GET") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  if (url.pathname !== "/route") {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: "Not found. Use GET /route?from=ADDRESS&to=ADDRESS&amount=AMOUNT" }));
    return;
  }

  const parsed = parseRouteParams(url.searchParams);
  if (!parsed.success) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: parsed.error }));
    return;
  }

  try {
    const result = await getRoute(parsed.data);
    res.statusCode = 200;
    res.end(JSON.stringify(result, null, 2));
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: String(err) }));
  }
});

const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

initCurve().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Example: http://localhost:${PORT}/route?from=${DAI}&to=${USDC}&amount=1000`);
  });
}).catch(console.error);

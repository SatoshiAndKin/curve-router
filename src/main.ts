import curve from "@curvefi/api";

const RPC_URL = "http://ski-nuc-3a:8545";
const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

const statusEl = document.getElementById("status")!;
const formEl = document.getElementById("form")!;
const submitEl = document.getElementById("submit") as HTMLButtonElement;
const resultEl = document.getElementById("result")!;
const fromInput = document.getElementById("from") as HTMLInputElement;
const toInput = document.getElementById("to") as HTMLInputElement;
const amountInput = document.getElementById("amount") as HTMLInputElement;

async function initCurve() {
  statusEl.textContent = "Connecting to Ethereum...";
  await curve.init("JsonRpc", { url: RPC_URL }, { chainId: 1 });

  statusEl.textContent = "Fetching pools...";
  await Promise.all([
    curve.factory.fetchPools(),
    curve.crvUSDFactory.fetchPools(),
    curve.cryptoFactory.fetchPools(),
    curve.twocryptoFactory.fetchPools(),
    curve.tricryptoFactory.fetchPools(),
    curve.stableNgFactory.fetchPools(),
  ]);
}

async function findRoute(from: string, to: string, amount: string) {
  const { route, output } = await curve.router.getBestRouteAndOutput(from, to, amount);
  return { from, to, amount, output, route };
}

function showResult(data: object) {
  resultEl.textContent = JSON.stringify(data, null, 2);
}

function showError(msg: string) {
  resultEl.innerHTML = `<span class="error">${msg}</span>`;
}

async function handleQueryParams() {
  const params = new URLSearchParams(window.location.search);
  const from = params.get("from");
  const to = params.get("to");
  const amount = params.get("amount") ?? "1";

  if (!from || !to) return false;

  if (!ADDRESS_REGEX.test(from) || !ADDRESS_REGEX.test(to)) {
    showError("Invalid address format in query params");
    return true;
  }

  fromInput.value = from;
  toInput.value = to;
  amountInput.value = amount;

  resultEl.textContent = "Finding best route...";

  try {
    const result = await findRoute(from, to, amount);
    showResult(result);
  } catch (err) {
    showError(`Error: ${err instanceof Error ? err.message : err}`);
  }

  return true;
}

async function init() {
  try {
    await initCurve();
    statusEl.textContent = "Ready";
    submitEl.disabled = false;

    await handleQueryParams();
  } catch (err) {
    statusEl.innerHTML = `<span class="error">Init failed: ${err instanceof Error ? err.message : err}</span>`;
  }
}

formEl.addEventListener("submit", async (e) => {
  e.preventDefault();

  const from = fromInput.value.trim();
  const to = toInput.value.trim();
  const amount = amountInput.value.trim();

  if (!ADDRESS_REGEX.test(from) || !ADDRESS_REGEX.test(to)) {
    showError("Invalid address format");
    return;
  }

  submitEl.disabled = true;
  resultEl.textContent = "Finding best route...";

  try {
    const result = await findRoute(from, to, amount);
    showResult(result);

    // Update URL for sharing
    const url = new URL(window.location.href);
    url.searchParams.set("from", from);
    url.searchParams.set("to", to);
    url.searchParams.set("amount", amount);
    window.history.replaceState({}, "", url.toString());
  } catch (err) {
    showError(`Error: ${err instanceof Error ? err.message : err}`);
  } finally {
    submitEl.disabled = false;
  }
});

init();

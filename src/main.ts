import curve from "@curvefi/api";

const RPC_URL = "http://ski-nuc-3a:8545";

const statusEl = document.getElementById("status")!;
const formEl = document.getElementById("form")!;
const submitEl = document.getElementById("submit") as HTMLButtonElement;
const resultEl = document.getElementById("result")!;

async function init() {
  try {
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

    statusEl.textContent = "Ready";
    submitEl.disabled = false;
  } catch (err) {
    statusEl.innerHTML = `<span class="error">Init failed: ${err instanceof Error ? err.message : err}</span>`;
  }
}

formEl.addEventListener("submit", async (e) => {
  e.preventDefault();

  const from = (document.getElementById("from") as HTMLInputElement).value.trim();
  const to = (document.getElementById("to") as HTMLInputElement).value.trim();
  const amount = (document.getElementById("amount") as HTMLInputElement).value.trim();

  const addressRegex = /^0x[a-fA-F0-9]{40}$/;
  if (!addressRegex.test(from) || !addressRegex.test(to)) {
    resultEl.innerHTML = `<span class="error">Invalid address format</span>`;
    return;
  }

  submitEl.disabled = true;
  resultEl.textContent = "Finding best route...";

  try {
    const { route, output } = await curve.router.getBestRouteAndOutput(from, to, amount);

    resultEl.textContent = JSON.stringify(
      {
        from,
        to,
        amount,
        output,
        route,
      },
      null,
      2
    );
  } catch (err) {
    resultEl.innerHTML = `<span class="error">Error: ${err instanceof Error ? err.message : err}</span>`;
  } finally {
    submitEl.disabled = false;
  }
});

init();

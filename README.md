# flashprofits-curve-api

Static web app for finding optimal swap routes on Curve Finance. Runs entirely in the browser using [@curvefi/api](https://www.npmjs.com/package/@curvefi/api).

## Usage

Visit the deployed site and enter:
- **From**: Source token address (e.g., DAI)
- **To**: Destination token address (e.g., USDC)
- **Amount**: Amount to swap

The app will find the best route across all Curve pools.

**Common Token Addresses (Ethereum Mainnet):**

| Token | Address |
|-------|---------|
| DAI | `0x6B175474E89094C44Da98b954EedeAC495271d0F` |
| USDC | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` |
| USDT | `0xdAC17F958D2ee523a2206206994597C13D831ec7` |
| WETH | `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2` |
| CRV | `0xD533a949740bb3306d119CC777fa900bA034cd52` |

## Development

### Requirements

- Node.js >= 20

### Setup

```bash
curl -fsSL https://fnm.vercel.app/install | bash
# Add `fnm env | source` to your shell config, then restart terminal
fnm install
npm install
```

### Run locally

```bash
npm run dev
```

Opens a local server at http://localhost:3000

### Testing

```bash
npm test
npm run test:coverage
```

## Deployment

Automatically deploys to GitHub Pages on push to `main` via GitHub Actions.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Serve public/ locally |
| `npm run typecheck` | Type check src/ |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |
| `npm test` | Run tests |
| `npm run test:coverage` | Run tests with coverage |

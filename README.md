# flashprofits-curve-api

HTTP service for finding optimal swap routes on Curve Finance.

## API

### `GET /route`

Find the best swap route between two tokens.

**Query Parameters:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `from` | Yes | Source token address (0x...) |
| `to` | Yes | Destination token address (0x...) |
| `amount` | No | Amount to swap (default: 1) |

**Example Request:**

```bash
curl "http://localhost:3000/route?from=0x6B175474E89094C44Da98b954EedeAC495271d0F&to=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&amount=1000"
```

**Example Response:**

```json
{
  "from": "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  "to": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  "amount": "1000",
  "output": "999.85",
  "gasEstimate": 150000,
  "route": [
    {
      "poolId": "3pool",
      "poolAddress": "0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7",
      "inputCoinAddress": "0x6b175474e89094c44da98b954eedeac495271d0f",
      "outputCoinAddress": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
    }
  ]
}
```

**Common Token Addresses (Ethereum Mainnet):**

| Token | Address |
|-------|---------|
| DAI | `0x6B175474E89094C44Da98b954EedeAC495271d0F` |
| USDC | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` |
| USDT | `0xdAC17F958D2ee523a2206206994597C13D831ec7` |
| WETH | `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2` |
| CRV | `0xD533a949740bb3306d119CC777fa900bA034cd52` |

## Requirements

- Node.js >= 20

## Setup

### Install fnm (Fast Node Manager)

```bash
curl -fsSL https://fnm.vercel.app/install | bash
```

Add to your shell config:

**Fish** (`~/.config/fish/config.fish`):
```fish
fnm env | source
```

**Bash** (`~/.bashrc`):
```bash
eval "$(fnm env)"
```

**Zsh** (`~/.zshrc`):
```zsh
eval "$(fnm env)"
```

Restart your terminal, then:

```bash
fnm install
```

This will automatically install the Node.js version specified in `.node-version`.

### Install dependencies

```bash
npm install
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `RPC_URL` | `http://ski-nuc-3a:8545` | Ethereum JSON-RPC endpoint |
| `PORT` | `3000` | HTTP server port |

## Running

### Development (with watch mode)

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

## Testing

```bash
npm test
```

With coverage report:

```bash
npm run test:coverage
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Run with tsx in watch mode |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled JavaScript |
| `npm run typecheck` | Type check without emitting |
| `npm test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |

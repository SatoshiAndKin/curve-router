# flashprofits-curve-api

Node.js HTTP service for finding optimal swap routes on Curve Finance using [@curvefi/api](https://www.npmjs.com/package/@curvefi/api).

## Usage

### API Endpoint

```
GET /route?from=<address>&to=<address>&amount=<amount>&sender=<address>
```

**Parameters:**
- `from` (required): Source token address
- `to` (required): Destination token address
- `amount` (optional, default: 1): Amount to swap
- `sender` (optional): Sender address for approval check

**Response:**
```json
{
  "from": "0x...",
  "from_symbol": "DAI",
  "to": "0x...",
  "to_symbol": "USDC",
  "amount": "1000",
  "output": "999.85",
  "route": [...],
  "router_address": "0x...",
  "calldata": "0x...",
  "approval_target": "0x...",
  "approval_calldata": "0x..."
}
```

### Web UI

Visit `http://localhost:3000` for a web interface.

### Common Token Addresses (Ethereum Mainnet)

| Token | Address |
|-------|---------|
| DAI | `0x6B175474E89094C44Da98b954EedeAC495271d0F` |
| USDC | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` |
| USDT | `0xdAC17F958D2ee523a2206206994597C13D831ec7` |
| WETH | `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2` |
| CRV | `0xD533a949740bb3306d119CC777fa900bA034cd52` |

## Running

### With Docker

```bash
cp .env.example .env  # Edit as needed
docker compose up --build
```

### Without Docker

```bash
npm install
npm start
```

## Configuration

Environment variables (via `.env` file or environment):

| Variable | Default | Description |
|----------|---------|-------------|
| `RPC_URL` | `http://ski-nuc-3a:8545` | Ethereum JSON-RPC endpoint |
| `PORT` | `3000` | HTTP server port |
| `HOST` | `0.0.0.0` | HTTP server host |

## Development

```bash
npm run dev      # Run with auto-reload
npm run typecheck
npm run lint
npm test
```

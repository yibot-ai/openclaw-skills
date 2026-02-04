# Morpho Vault Liquidity Monitor

Monitor Morpho Blue vault liquidity in real-time and get alerts when liquidity falls below your threshold.

## Features

- 🔍 **Real-time Monitoring** - Check Morpho vault liquidity on-demand
- ⚠️ **Smart Alerts** - Get notified when liquidity drops below threshold
- 📊 **Multi-Vault Support** - Monitor multiple vaults simultaneously
- 🔔 **Flexible Notifications** - Console, Telegram, or iMessage alerts
- 🤖 **OpenClaw Integration** - Works seamlessly with OpenClaw cron

## Installation

```bash
cd ~/clawd/skills/morpho-monitor
npm install
chmod +x cli.js
npm link  # Optional: make globally available
```

## Quick Start

### 1. Auto-Discover Your Vaults (Recommended)

```bash
# Discover all vaults you participate in across chains
node cli.js discover 0xYourAddress

# Auto-add them to monitoring
node cli.js discover 0xYourAddress --auto-add --threshold 1000000
```

This will:
- Scan Ethereum, Base, Polygon, and Arbitrum
- Find all Morpho vaults where you hold shares
- Automatically add them to monitoring
- Set intelligent thresholds (80% of current liquidity)

### 2. Or Manually Add a Vault

```bash
node cli.js add 0xYourVaultAddress 1000000 ethereum
```

Parameters:
- Vault address (required)
- Threshold in asset units (required)
- Chain (optional, default: ethereum)

### 3. Check Liquidity Status

```bash
node cli.js check
```

This checks all monitored vaults and alerts if any are below threshold.

### 3. View Status

```bash
node cli.js status
```

Shows all monitored vaults and their configurations.

## Use with OpenClaw Cron

Set up automated monitoring every hour:

```bash
# In OpenClaw, create a cron job:
openclaw cron add \
  --schedule "0 * * * *" \
  --command "cd ~/clawd/skills/morpho-monitor && node cli.js check" \
  --name "morpho-liquidity-check"
```

## Configuration

Config file: `~/.config/morpho-monitor/config.json`

```json
{
  "rpcUrl": "https://eth.llamarpc.com",
  "vaults": [
    {
      "address": "0x...",
      "threshold": 1000000,
      "chain": "ethereum",
      "name": "Morpho Vault",
      "assetSymbol": "USDC"
    }
  ],
  "alertChannels": {
    "telegram": "YOUR_CHAT_ID",
    "console": true
  }
}
```

## Environment Variables

- `ETH_RPC_URL` - Ethereum RPC endpoint (default: LlamaRPC)
- `TELEGRAM_CHAT_ID` - Your Telegram chat ID for alerts

## Commands

| Command | Description |
|---------|-------------|
| `add <address> <threshold>` | Add a vault to monitor |
| `remove <address>` | Remove a vault |
| `check` | Check all vaults now |
| `status` | Show monitoring status |
| `info <address>` | Get detailed vault info |
| `history <address> [days]` | View historical data |

## Example Output

```
📊 Liquidity Check Results

✅ Morpho USDC Vault (mUSDC)
   Liquidity: 1,500,000.00 USDC
   Threshold: 1,000,000 USDC
   Status: 150% of threshold

🔴 Morpho DAI Vault (mDAI)
   Liquidity: 800,000.00 DAI
   Threshold: 1,000,000 DAI
   Status: 80% of threshold

⚠️ Alert: mDAI vault is below threshold!
```

## Integration with OpenClaw

### Option 1: Direct Alerts via Message Tool

Modify config to send alerts through OpenClaw's message tool:

```javascript
// In your alert handler
const { exec } = require('child_process');
exec(`openclaw message send "Morpho liquidity alert: ${message}"`);
```

### Option 2: Cron + Heartbeat

Add to your `HEARTBEAT.md`:

```markdown
## Morpho Liquidity Check (every 6 hours)
If 6+ hours since last check:
1. Run `cd ~/clawd/skills/morpho-monitor && node cli.js check`
2. Update lastMorphoCheck timestamp
```

## Advanced Usage

### Get Real-time Vault Info

```bash
node cli.js info 0xVaultAddress
```

Returns:
- Total Assets (liquidity)
- Total Supply (shares)
- Asset type
- Current utilization rate

### Monitor Multiple Chains

```bash
node cli.js add 0xVault1 1000000 ethereum
node cli.js add 0xVault2 500000 polygon
node cli.js add 0xVault3 2000000 arbitrum
```

## Troubleshooting

**RPC Errors**: Set custom RPC via `ETH_RPC_URL` env var or in config.json

**Permission Denied**: Run `chmod +x cli.js`

**Module Not Found**: Run `npm install` in the skill directory

## Development

```bash
# Test with a specific vault
node cli.js info 0xYourTestVault

# Check without alerts (dry run)
node cli.js check --dry-run
```

## License

MIT

## Author

YiBot (@yworks_io) - Built for Denny to monitor Morpho vault liquidity

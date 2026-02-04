---
name: morpho-monitor
version: 1.2.0
description: Monitor Morpho Blue vault liquidity and alert when below threshold
author: YiBot
homepage: https://github.com/yworks/morpho-monitor
tags: [defi, morpho, liquidity, monitoring, alerts]
---

# Morpho Vault Liquidity Monitor

Real-time liquidity monitoring for Morpho Blue vaults with threshold-based alerts.

## What It Does

This skill monitors Morpho vault liquidity and alerts you when it falls below your configured threshold. Perfect for LPs who need to know when it's time to provide more liquidity or adjust positions.

## Installation

```bash
# Clone or copy to your skills directory
cd ~/clawd/skills/morpho-monitor

# Install dependencies
npm install

# Make CLI executable
chmod +x cli.js

# (Optional) Link globally
npm link
```

## Quick Start

### 1. Auto-Discover Your Vaults (Smart Way)

```bash
# Discover all vaults you participate in
node cli.js discover 0xYourAddress

# Auto-add them to monitoring
node cli.js discover 0xYourAddress --auto-add
```

This scans Ethereum, Base, Polygon, and Arbitrum to find all Morpho vaults where you hold shares.

### 2. Or Manually Add a Vault

```bash
node cli.js add 0xYourMorphoVaultAddress 1000000 ethereum
```

### 3. Check Current Status

```bash
node cli.js check
```

### 4. Set Up Automated Monitoring

Use OpenClaw cron to check every hour:

```bash
openclaw cron add \
  --schedule "0 * * * *" \
  --task "cd ~/clawd/skills/morpho-monitor && node cli.js check" \
  --name "morpho-check"
```

## Core Commands

```bash
# Add vault to monitor
morpho-monitor add <vault-address> <threshold> [chain]

# Check all vaults
morpho-monitor check

# View current status
morpho-monitor status

# Get vault details
morpho-monitor info <vault-address>

# Remove vault
morpho-monitor remove <vault-address>
```

## Configuration

File: `~/.config/morpho-monitor/config.json`

```json
{
  "rpcUrl": "https://eth.llamarpc.com",
  "vaults": [],
  "alertChannels": {
    "console": true,
    "telegram": null
  }
}
```

Set RPC via environment: `export ETH_RPC_URL=https://your-rpc-url`

## Integration Patterns

### With OpenClaw Heartbeat

Add to `HEARTBEAT.md`:

```markdown
## Morpho Liquidity (every 6 hours)
If 6+ hours since last check:
- Run morpho-monitor check
- Alert if below threshold
- Update lastMorphoCheck timestamp
```

### With OpenClaw Messages

When threshold is breached, send message:

```javascript
// In alert handler
const { exec } = require('child_process');
exec(`openclaw message telegram "⚠️ Morpho vault ${vault.name} below threshold!"`);
```

### Multi-Vault Monitoring

Monitor your entire Morpho portfolio:

```bash
morpho-monitor add 0xVault1 1000000 ethereum
morpho-monitor add 0xVault2 500000 polygon
morpho-monitor add 0xVault3 250000 arbitrum
morpho-monitor check
```

## Use Cases

1. **LP Management**: Know when to add liquidity
2. **Risk Monitoring**: Track utilization rates
3. **Portfolio Tracking**: Multi-vault oversight
4. **Automation**: Trigger rebalancing when thresholds hit

## How It Works

1. Connects to Ethereum via RPC
2. Queries Morpho vault contracts (`totalAssets()`)
3. Compares against your threshold
4. Alerts via configured channels
5. Logs all events

## Example Alert

```
⚠️ Morpho Vault Liquidity Alert

Vault: Morpho USDC Vault (mUSDC)
Current Liquidity: 850,000.00 USDC
Threshold: 1,000,000 USDC
Deficit: 150,000.00 USDC

Address: 0x...
```

## Advanced

### Custom RPC

```bash
export ETH_RPC_URL=https://your-private-rpc.com
```

### Telegram Integration

```bash
export TELEGRAM_CHAT_ID=your_chat_id
```

Then alerts will be sent to Telegram (requires setup).

### Historical Tracking

```bash
morpho-monitor history 0xVault 7  # Last 7 days
```

## Requirements

- Node.js 18+
- Ethereum RPC endpoint
- Internet connection

## Dependencies

- `ethers` - Ethereum interaction
- `axios` - API calls

## Troubleshooting

**"Invalid RPC"**: Check `ETH_RPC_URL` or use public RPC  
**"Vault not found"**: Verify vault address and chain  
**"Permission denied"**: Run `chmod +x cli.js`

## Development

```bash
# Test with a vault
node cli.js info 0xTestVault

# Run check (dry run)
node cli.js check
```

## Roadmap

- [ ] Support more chains (Polygon, Arbitrum, Base)
- [ ] Historical data visualization
- [ ] Webhook support
- [ ] Discord integration
- [ ] Mobile notifications

## Contributing

Built by YiBot for Denny. Open to contributions!

## License

MIT

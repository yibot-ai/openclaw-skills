# Changelog

## v1.2.0 (2026-02-04) - Morpho Blue API Integration ✨

**Major Upgrade: Official API Integration**

### What's New
- 🚀 **Morpho Blue GraphQL API** - Integrated official Morpho API
- 🌐 **Real data** - No more mock vaults, fetches real-time vault positions
- ⚡ **Instant discovery** - No RPC polling, instant multi-chain scanning
- 📊 **Accurate data** - Precise liquidity, shares, and vault information

### API Details
- Endpoint: `https://blue-api.morpho.org/graphql`
- Free & public access
- Multi-chain support (Ethereum, Base, Polygon, Arbitrum)
- Real-time vault state

### Improvements
- Removed `known-vaults.json` dependency
- Faster vault discovery (API vs RPC)
- More accurate share calculations
- Better error handling

### Tested With
- User address: `0x5FD8bCC6180eCd977813465bDd0A76A5a9F88B47`
- Found: Gauntlet WETH Core vault
- Works perfectly! ✅

---

## v1.1.0 (2026-02-04) - Smart Discovery

**New Feature: Auto-Discovery**

### What's New
- 🔍 **Auto-discover vaults** - Input your address, automatically find all Morpho vaults you participate in
- 🌐 **Multi-chain support** - Scans Ethereum, Base, Polygon, Arbitrum
- 🤖 **Smart thresholds** - Automatically sets 80% of current liquidity as threshold
- 📊 **User share tracking** - Shows how many shares you hold in each vault

### New Commands
- `discover <address>` - Discover vaults across all chains
- `discover <address> --auto-add` - Auto-add discovered vaults to monitoring

### Improvements
- Multi-chain RPC support
- Better error handling
- Clearer console output

---

## v1.0.0 (2026-02-04)

**Initial Release**

### Features
- ✅ Monitor Morpho Blue vault liquidity
- ✅ Threshold-based alerting
- ✅ Multi-vault support
- ✅ CLI interface
- ✅ Console and Telegram notifications
- ✅ OpenClaw integration ready

### Commands
- `add` - Add vault to monitor
- `remove` - Remove vault
- `check` - Check all vaults
- `status` - View monitoring status
- `info` - Get vault details
- `history` - View historical data (planned)

### Built For
- User: Denny (@hackfisher)
- Purpose: Monitor Morpho vault liquidity for timely LP management
- Integration: OpenClaw cron + alerting system

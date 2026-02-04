#!/usr/bin/env node

const MorphoMonitor = require('./index');

const monitor = new MorphoMonitor();

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'add':
        if (args.length < 3) {
          console.error('Usage: morpho-monitor add <vault-address> <threshold> [chain]');
          process.exit(1);
        }
        const info = await monitor.addVault(args[1], parseFloat(args[2]), args[3] || 'ethereum');
        console.log('✅ Vault added successfully!');
        console.log(JSON.stringify(info, null, 2));
        break;

      case 'remove':
        if (args.length < 2) {
          console.error('Usage: morpho-monitor remove <vault-address>');
          process.exit(1);
        }
        await monitor.removeVault(args[1]);
        console.log('✅ Vault removed');
        break;

      case 'check':
        const results = await monitor.checkAll();
        console.log('\n📊 Liquidity Check Results\n');
        results.forEach(r => {
          const status = r.belowThreshold ? '🔴' : '✅';
          console.log(`${status} ${r.name} (${r.symbol})`);
          console.log(`   Liquidity: ${r.liquidity.toFixed(2)} ${r.assetSymbol}`);
          console.log(`   Threshold: ${r.threshold} ${r.assetSymbol}`);
          console.log(`   Status: ${r.percentOfThreshold}% of threshold`);
          console.log('');
        });
        break;

      case 'status':
        const status = await monitor.getStatus();
        console.log('\n📋 Monitoring Status\n');
        console.log(`Tracked Vaults: ${status.vaults.length}`);
        console.log('\nVaults:');
        status.vaults.forEach((v, i) => {
          console.log(`  ${i+1}. ${v.name} (${v.symbol})`);
          console.log(`     Address: ${v.address}`);
          console.log(`     Threshold: ${v.threshold} ${v.assetSymbol}`);
        });
        break;

      case 'info':
        if (args.length < 2) {
          console.error('Usage: morpho-monitor info <vault-address>');
          process.exit(1);
        }
        await monitor.loadConfig();
        const vaultInfo = await monitor.getVaultInfo(args[1]);
        console.log('\n📊 Vault Information\n');
        console.log(JSON.stringify(vaultInfo, null, 2));
        break;

      case 'history':
        if (args.length < 2) {
          console.error('Usage: morpho-monitor history <vault-address> [days]');
          process.exit(1);
        }
        const history = await monitor.getHistory(args[1], parseInt(args[2]) || 7);
        console.log(JSON.stringify(history, null, 2));
        break;

      case 'discover':
        if (args.length < 2) {
          console.error('Usage: morpho-monitor discover <user-address> [--auto-add] [--threshold <amount>]');
          process.exit(1);
        }
        
        const autoAdd = args.includes('--auto-add');
        const thresholdIdx = args.indexOf('--threshold');
        const threshold = thresholdIdx > -1 ? parseFloat(args[thresholdIdx + 1]) : 1000000;
        
        if (autoAdd) {
          const vaults = await monitor.autoAddDiscovered(args[1], threshold);
          console.log(`\n✅ Discovery complete! Added ${vaults.length} vault(s) to monitoring.`);
        } else {
          const vaults = await monitor.discoverVaults(args[1]);
          console.log('\n📊 Discovered Vaults:\n');
          if (vaults.length === 0) {
            console.log('  No vaults found for this address.');
          } else {
            vaults.forEach((v, i) => {
              console.log(`  ${i+1}. ${v.name} (${v.symbol}) on ${v.chain}`);
              console.log(`     Address: ${v.address}`);
              console.log(`     Your shares: ${v.userShares.toFixed(4)}`);
              console.log(`     Liquidity: ${v.liquidity.toFixed(2)} ${v.assetSymbol}`);
              console.log('');
            });
            console.log('💡 Tip: Add --auto-add to automatically monitor all discovered vaults');
          }
        }
        break;

      default:
        console.log(`
Morpho Vault Liquidity Monitor

Usage:
  morpho-monitor discover <address> [--auto-add] [--threshold <amount>]
                                                            Discover vaults for an address
  morpho-monitor add <vault-address> <threshold> [chain]    Add a vault to monitor
  morpho-monitor remove <vault-address>                     Remove a vault
  morpho-monitor check                                       Check all vaults now
  morpho-monitor status                                      Show monitoring status
  morpho-monitor info <vault-address>                       Get vault info
  morpho-monitor history <vault-address> [days]             View historical data

Examples:
  # Discover all vaults for your address
  morpho-monitor discover 0xYourAddress

  # Auto-add discovered vaults to monitoring
  morpho-monitor discover 0xYourAddress --auto-add --threshold 1000000

  # Manually add a specific vault
  morpho-monitor add 0x123... 1000000 ethereum

  # Check all monitored vaults
  morpho-monitor check

Configuration: ~/.config/morpho-monitor/config.json
        `);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

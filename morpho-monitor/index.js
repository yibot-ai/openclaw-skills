#!/usr/bin/env node

const { ethers } = require('ethers');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Morpho Blue Vault ABI (simplified - key functions)
const MORPHO_VAULT_ABI = [
  'function totalAssets() view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function asset() view returns (address)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function balanceOf(address) view returns (uint256)'
];

const ERC20_ABI = [
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)'
];

// Chain configurations
const CHAINS = {
  ethereum: {
    rpc: 'https://eth.llamarpc.com',
    chainId: 1,
    name: 'Ethereum'
  },
  base: {
    rpc: 'https://mainnet.base.org',
    chainId: 8453,
    name: 'Base'
  },
  polygon: {
    rpc: 'https://polygon-rpc.com',
    chainId: 137,
    name: 'Polygon'
  },
  arbitrum: {
    rpc: 'https://arb1.arbitrum.io/rpc',
    chainId: 42161,
    name: 'Arbitrum'
  }
};

class MorphoMonitor {
  constructor(configPath = '~/.config/morpho-monitor/config.json') {
    this.configPath = configPath.replace('~', process.env.HOME);
    this.config = null;
    this.chains = CHAINS;
  }

  async loadConfig() {
    try {
      const data = await fs.readFile(this.configPath, 'utf8');
      this.config = JSON.parse(data);
    } catch (err) {
      // Default config
      this.config = {
        rpcUrl: process.env.ETH_RPC_URL || 'https://eth.llamarpc.com',
        vaults: [],
        alertChannels: {
          telegram: process.env.TELEGRAM_CHAT_ID || null,
          console: true
        }
      };
    }
    return this.config;
  }

  async saveConfig() {
    const dir = path.dirname(this.configPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2));
  }

  async getVaultInfo(vaultAddress, rpcUrl = null) {
    const provider = new ethers.JsonRpcProvider(rpcUrl || this.config.rpcUrl);
    const vault = new ethers.Contract(vaultAddress, MORPHO_VAULT_ABI, provider);
    
    try {
      const [totalAssets, totalSupply, assetAddress, name, symbol] = await Promise.all([
        vault.totalAssets(),
        vault.totalSupply(),
        vault.asset(),
        vault.name(),
        vault.symbol()
      ]);

      const asset = new ethers.Contract(assetAddress, ERC20_ABI, provider);
      const [assetSymbol, decimals] = await Promise.all([
        asset.symbol(),
        asset.decimals()
      ]);

      const liquidity = parseFloat(ethers.formatUnits(totalAssets, decimals));
      const shares = parseFloat(ethers.formatUnits(totalSupply, 18)); // Shares are typically 18 decimals

      return {
        address: vaultAddress,
        name,
        symbol,
        asset: assetAddress,
        assetSymbol,
        liquidity,
        shares,
        utilizationRate: shares > 0 ? (liquidity / shares * 100).toFixed(2) : 0,
        timestamp: Date.now()
      };
    } catch (error) {
      throw new Error(`Failed to fetch vault info: ${error.message}`);
    }
  }

  async addVault(vaultAddress, threshold, chain = 'ethereum') {
    await this.loadConfig();
    
    // Validate it's a valid Morpho vault
    const info = await this.getVaultInfo(vaultAddress);
    
    this.config.vaults.push({
      address: vaultAddress,
      chain,
      threshold,
      name: info.name,
      symbol: info.symbol,
      assetSymbol: info.assetSymbol,
      addedAt: Date.now()
    });
    
    await this.saveConfig();
    return info;
  }

  async removeVault(vaultAddress) {
    await this.loadConfig();
    this.config.vaults = this.config.vaults.filter(v => v.address.toLowerCase() !== vaultAddress.toLowerCase());
    await this.saveConfig();
  }

  async checkAll() {
    await this.loadConfig();
    
    const results = [];
    for (const vault of this.config.vaults) {
      try {
        const info = await this.getVaultInfo(vault.address);
        const belowThreshold = info.liquidity < vault.threshold;
        
        results.push({
          ...info,
          threshold: vault.threshold,
          belowThreshold,
          percentOfThreshold: ((info.liquidity / vault.threshold) * 100).toFixed(2)
        });

        if (belowThreshold) {
          await this.sendAlert(vault, info);
        }
      } catch (error) {
        console.error(`Error checking vault ${vault.address}:`, error.message);
      }
    }
    
    return results;
  }

  async sendAlert(vault, info) {
    const message = `⚠️ Morpho Vault Liquidity Alert\n\n` +
      `Vault: ${vault.name} (${vault.symbol})\n` +
      `Current Liquidity: ${info.liquidity.toFixed(2)} ${vault.assetSymbol}\n` +
      `Threshold: ${vault.threshold} ${vault.assetSymbol}\n` +
      `Deficit: ${(vault.threshold - info.liquidity).toFixed(2)} ${vault.assetSymbol}\n\n` +
      `Address: ${vault.address}`;

    if (this.config.alertChannels.console) {
      console.log('\n' + message + '\n');
    }

    if (this.config.alertChannels.telegram) {
      // Could integrate with Telegram API or use OpenClaw's message tool
      console.log('Telegram alert would be sent here');
    }
    
    // Save alert to log
    const alertLog = path.join(path.dirname(this.configPath), 'alerts.log');
    await fs.appendFile(alertLog, `${new Date().toISOString()} - ${message}\n\n`);
  }

  async getStatus() {
    await this.loadConfig();
    return {
      vaults: this.config.vaults,
      alertChannels: this.config.alertChannels
    };
  }

  async getHistory(vaultAddress, days = 7) {
    // This would query historical data from a data source
    // For now, return mock structure
    return {
      vault: vaultAddress,
      period: `${days} days`,
      dataPoints: []
    };
  }

  async discoverVaults(userAddress, chains = null) {
    console.log(`🔍 Discovering Morpho vaults for ${userAddress}...`);
    
    const defaultChains = ['ethereum', 'base', 'polygon', 'arbitrum'];
    const scanChains = chains || defaultChains;
    
    const discovered = [];
    
    for (const chainName of scanChains) {
      const chain = this.chains[chainName];
      if (!chain) continue;
      
      console.log(`\n📡 Scanning ${chain.name}...`);
      
      try {
        const vaults = await this.scanChainForVaults(userAddress, chainName, chain.rpc);
        discovered.push(...vaults);
        
        if (vaults.length > 0) {
          console.log(`  ✅ Found ${vaults.length} vault(s)`);
        } else {
          console.log(`  ℹ️  No vaults found`);
        }
      } catch (error) {
        console.log(`  ⚠️  Error scanning ${chain.name}: ${error.message}`);
      }
    }
    
    return discovered;
  }

  async scanChainForVaults(userAddress, chainName, rpcUrl) {
    // Use Morpho Blue GraphQL API to find user positions
    const chainIdMap = {
      ethereum: 1,
      base: 8453,
      polygon: 137,
      arbitrum: 42161
    };
    
    const chainId = chainIdMap[chainName];
    if (!chainId) {
      console.log(`    ⚠️  Chain ${chainName} not supported by Morpho API`);
      return [];
    }
    
    try {
      const query = `
        query {
          vaultPositions(
            where: { 
              userAddress_in: ["${userAddress}"], 
              chainId_in: [${chainId}]
            }, 
            first: 100
          ) {
            items {
              vault {
                address
                name
                symbol
                asset {
                  address
                  symbol
                  decimals
                }
                state {
                  totalAssets
                  totalSupply
                }
              }
              shares
            }
          }
        }
      `;
      
      const response = await axios.post('https://blue-api.morpho.org/graphql', {
        query
      }, {
        headers: {
          'content-type': 'application/json'
        }
      });
      
      if (response.data.errors) {
        throw new Error(response.data.errors[0].message);
      }
      
      const positions = response.data.data.vaultPositions.items;
      const userVaults = [];
      
      for (const position of positions) {
        const vault = position.vault;
        const totalAssets = parseFloat(vault.state.totalAssets);
        const totalSupply = parseFloat(vault.state.totalSupply);
        const userShares = parseFloat(position.shares);
        
        // Calculate user's share of total assets
        const sharePrice = totalSupply > 0 ? totalAssets / totalSupply : 0;
        const userAssetsValue = userShares * sharePrice;
        
        // Format based on decimals
        const decimals = vault.asset.decimals;
        const liquidity = totalAssets / Math.pow(10, decimals);
        
        userVaults.push({
          chain: chainName,
          address: vault.address,
          name: vault.name,
          symbol: vault.symbol,
          assetSymbol: vault.asset.symbol,
          assetDecimals: decimals,
          userShares: userShares / Math.pow(10, 18), // Shares are 18 decimals
          userAssetsValue: userAssetsValue / Math.pow(10, decimals),
          liquidity
        });
      }
      
      return userVaults;
    } catch (error) {
      console.log(`    ⚠️  API Error: ${error.message}`);
      return [];
    }
  }

  async autoAddDiscovered(userAddress, defaultThreshold = 1000000, chains = null) {
    await this.loadConfig();
    
    const vaults = await this.discoverVaults(userAddress, chains);
    
    console.log(`\n📋 Auto-adding ${vaults.length} vault(s) to monitoring...\n`);
    
    for (const vault of vaults) {
      // Calculate smart threshold based on current liquidity
      const threshold = vault.liquidity > 0 
        ? vault.liquidity * 0.8  // Alert at 80% of current
        : defaultThreshold;
      
      // Check if already added
      const exists = this.config.vaults.some(v => 
        v.address.toLowerCase() === vault.address.toLowerCase()
      );
      
      if (!exists) {
        this.config.vaults.push({
          address: vault.address,
          chain: vault.chain,
          threshold,
          name: vault.name,
          symbol: vault.symbol,
          assetSymbol: vault.assetSymbol,
          userShares: vault.userShares,
          addedAt: Date.now(),
          autoDiscovered: true
        });
        
        console.log(`  ✅ Added: ${vault.name} on ${vault.chain}`);
        console.log(`     Threshold: ${threshold.toFixed(2)} ${vault.assetSymbol}`);
      } else {
        console.log(`  ℹ️  Already monitoring: ${vault.name}`);
      }
    }
    
    await this.saveConfig();
    
    return vaults;
  }
}

module.exports = MorphoMonitor;

import { defineStore } from 'pinia'

import { Wallet } from '../lib/near-wallet';
import { SmartCity } from '../lib/near-interface';

export const wallet = new Wallet({ createAccessKeyFor: process.env.CONTRACT_NAME });
export const contract = new SmartCity({ contractId: process.env.CONTRACT_NAME, walletToUse: wallet });

export const useMainStore = defineStore('main', {
  state: () => (
    {
      isLoggedIn: false,
      energyGenerators: [],
      accountInfo: null,
      tokensBalance: 0
    }),
  getters: {
    // doubleCount: (state) => state.count * 2,
  },
  actions: {
    async startUp() {
      const result = await wallet.startUp();
      this.isLoggedIn = result;
      this.refresh();
    },
    async refresh() {
      if (this.isLoggedIn) {
        this.fetchUserInfo();
        this.fetchTokensBalance();
      }
      this.fetchEnergyGenerators();
    },
    async fetchUserInfo() {
      try {
        this.accountInfo = await contract.getAccountInfo(); 
      } catch(err) {
        console.error("Error while getting account info", err);
      }
    },
    async fetchEnergyGenerators() {
      try {
        this.energyGenerators = await contract.getEnergyGenerators(); 
      } catch(err) {
        console.error("Error while getting energy generators", err);
      }
    },
    async fetchTokensBalance() {
      try {
        this.tokensBalance = await contract.balanceOf(wallet.accountId); 
      } catch(err) {
        console.error("Error while getting balance", err);
      }
    }
  },
})

import { defineStore } from 'pinia'
import { useToast } from 'vue-toastification'

import { Wallet } from '../lib/near-wallet';
import { SmartCity } from '../lib/near-interface';

const CONTRACT_NAME = "dev-1664289608809-71577605147570";

export const wallet = new Wallet({ createAccessKeyFor: CONTRACT_NAME });
export const contract = new SmartCity({ contractId: CONTRACT_NAME, walletToUse: wallet });

const toast = useToast();

export const useMainStore = defineStore('main', {
  state: () => (
    {
      isLoggedIn: false,
      energyGenerators: [],
      accountInfo: null,
      tokensBalance: 0,
      loadingEnergyGenerators: false,
      loadingAccountInfo: false,
      loadingTokensBalance: false,
    }),
  getters: {},
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
        this.loadingAccountInfo = true;
        this.accountInfo = await contract.getAccountInfo();
        this.loadingAccountInfo = false;
      } catch(err) {
        toast.error("Error while getting account info");
        console.error("Error while getting account info", err);
      }
    },
    async fetchEnergyGenerators() {
      try {
        this.loadingEnergyGenerators = true;
        this.energyGenerators = await contract.getEnergyGenerators();
        this.loadingEnergyGenerators = false;
      } catch(err) {
        toast.error("Error while getting energy generators");
        console.error("Error while getting energy generators", err);
      }
    },
    async fetchTokensBalance() {
      try {
        this.loadingTokensBalance = true;
        this.tokensBalance = await contract.balanceOf(wallet.accountId); 
        this.loadingTokensBalance = false;
      } catch(err) {
        toast.error("Error while getting tokens balance");
        console.error("Error while getting balance", err);
      }
    }
  },
})

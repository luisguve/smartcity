/* Talking with a contract often involves transforming data, we recommend you to encapsulate that logic into a class */

export class SmartCity {
  constructor({ contractId, walletToUse }) {
    this.contractId = contractId;
    this.wallet = walletToUse;    
  }

  async getEnergyGenerators() {
    return await this.wallet.viewMethod({ contractId: this.contractId, method: 'getEnergyGenerators' });
  }

  async getAccountInfo() {
    return await this.wallet.viewMethod(
      {
        contractId: this.contractId,
        method: 'getAccountInfo',
        args: { accountId: this.wallet.accountId }
      }
    );
  }
}

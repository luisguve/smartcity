/* Talking with a contract often involves transforming data, we recommend you to encapsulate that logic into a class */

const ONE_NEAR = BigInt('1000000000000000000000000');

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

  async buySolarFarm(farmSize, deposit) {
    return await this.wallet.callMethod(
      {
        contractId: this.contractId,
        method: 'buySolarFarm',
        args: { farmSize },
        deposit: (BigInt(deposit) * ONE_NEAR).toString()
      }
    );
  }
}

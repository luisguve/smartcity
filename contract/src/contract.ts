import {
  NearBindgen,
  call,
  view,
  initialize,
  near,
  LookupMap,
  assert
} from "near-sdk-js";

/*
suponiendo que hay un maximo de 5 horas de sol pico al dia y que este valor
se mantiene constante:

granja 1 (100 NEAR):  80 paneles de 400W -> 160kwh al dia

granja 2 (160 NEAR): 140 paneles de 400W -> 280kwh al dia

granja 3 (250 NEAR): 210 paneles de 400W -> 420kwh al dia

para recuperar la inversion en 3 a#os,
el valor de cada token sera de 0.0006 $NEAR
*/

const ONE_NEAR: bigint = BigInt('1000000000000000000000000');

// Valor de tokens de KWh equivalente en NEAR
const NEAR_KWH_RATE = BigInt('600000000000000000000');

type farmNames = "small" | "medium" | "big"

const farmNamesPricesMapping: Record<farmNames, bigint> = {
  "small": BigInt(100) * ONE_NEAR,
  "medium": BigInt(160) * ONE_NEAR,
  "big": BigInt(250) * ONE_NEAR
}

interface Farm {
  name: string
  powerRate: number
  panels: number
}

const FARMS: Record<farmNames, Farm> = {
  "small": {
    name: "small",
    powerRate: 160,
    panels: 80
  },
  "medium": {
    name: "big",
    powerRate: 280,
    panels: 140
  },
  "big": {
    name: "small",
    powerRate: 420,
    panels: 210
  },
}

interface SolarFarmParams {
  account_id: string
  initialFarm: Farm
}

@NearBindgen({})
class EnergyGeneratorAccount {
  accountId: string;

  lastWithdrawal: Date;
  totalPowerRate: number = 0;

  farms: Farm[] = [];

  constructor(props: SolarFarmParams) {
    const { account_id, initialFarm } = props
    this.accountId = account_id;
    this.farms = [initialFarm];
    this.lastWithdrawal = new Date();
  }

  addFarm(farm: Farm) {
    this.farms.push(farm);
    const powerRate = this.farms.reduce((total, farm) => total + farm.powerRate, 0);
    this.totalPowerRate = powerRate;
  }

  calculateProduction(): bigint {
    const now = new Date();

    // Get the number of hours between last withdrawal and now
    const hours = Math.floor(now.getHours() - this.lastWithdrawal.getHours());

    return BigInt(hours * this.totalPowerRate);
  }
}

@NearBindgen({})
class FungibleToken {

  accounts = new LookupMap("tokens");
  totalSupply = "200000000";

  energyGenerators = new LookupMap("energy_generators");

  @initialize({})
  init (): void {
    this.accounts.set(near.currentAccountId(), this.totalSupply);
  }

  internalDeposit({ accountId, amount }: { accountId: string, amount: string }): void {
    let balance: string = (this.accounts.get(accountId) as string) || "0";
    let newBalance = BigInt(balance) + BigInt(amount);
    this.accounts.set(accountId, newBalance.toString());
    this.totalSupply = (BigInt(this.totalSupply) + BigInt(amount)).toString();
  }

  internalWithdraw({ accountId, amount }: { accountId: string, amount: string }): void {
    let balance = (this.accounts.get(accountId) as string) || "0";
    let newBalance = BigInt(balance) - BigInt(amount);
    assert(newBalance >= 0, "The account doesn't have enough balance");
    this.accounts.set(accountId, newBalance.toString());
    let newSupply = BigInt(this.totalSupply) - BigInt(amount);
    assert(newSupply >= 0, "Total supply overflow");
    this.totalSupply = newSupply.toString();
  }

  internalTransfer({ senderId, receiverId, amount, memo }: { senderId: string, receiverId: string, amount: string, memo?: string }): void {
    assert(senderId != receiverId, "Sender and receiver should be different");
    let amountInt = BigInt(amount);
    assert(amountInt > 0, "The amount should be a positive number");
    this.internalWithdraw({ accountId: senderId, amount });
    this.internalDeposit({ accountId: receiverId, amount });
  }

  @call({})
  ftTransfer({ receiverId, amount, memo }: { receiverId: string, amount: string, memo?: string }): void {
    let senderId = near.predecessorAccountId();
    this.internalTransfer({ senderId, receiverId, amount, memo });
  }

  @call({})
  ftTransferCall({ receiverId, amount, memo, msg }: { receiverId: string, amount: string, memo?: string, msg?: string }) {
    let senderId = near.predecessorAccountId();
    this.internalTransfer({ senderId, receiverId, amount, memo });
    const promise = near.promiseBatchCreate(receiverId);
    const params = {
      senderId: senderId,
      amount: amount,
      msg: msg,
      receiverId: receiverId,
    };
    near.promiseBatchActionFunctionCall(
      promise,
      "ftOnTransfer",
      JSON.stringify(params),
      0,
      30000000000000
    );
    return near.promiseReturn(promise);
  }

  @view({})
  ftTotalSupply(): string {
    return this.totalSupply;
  }

  @view({})
  ftBalanceOf({ accountId }: { accountId: string }): string {
    return (this.accounts.get(accountId) as string) || "0";
  }

  @call({ payableFunction: true })
  buySolarFarm({ farmSize }: { farmSize: farmNames }): void {
    const accountId = near.predecessorAccountId();
    const attachedDeposit: bigint = near.attachedDeposit() as bigint;

    const farmPrice = farmNamesPricesMapping[farmSize];

    assert(attachedDeposit >= farmPrice, `Attached deposit ${attachedDeposit} is not greater than or equal to farm price ${farmPrice}.`)

    const newFarm: Farm = FARMS[farmSize]

    let energyGeneratorAccount = this.energyGenerators.get(accountId)

    if (energyGeneratorAccount instanceof EnergyGeneratorAccount) {
      // Account alredy exists - add farm
      energyGeneratorAccount.addFarm(newFarm)
    } else {
      // New account - create account
      energyGeneratorAccount = new EnergyGeneratorAccount({account_id: accountId, initialFarm: newFarm})
    }

    this.energyGenerators.set(accountId, energyGeneratorAccount)
  }

  @call({})
  withdraw(): void {
    const accountId = near.predecessorAccountId();
    let energyGeneratorAccount = this.energyGenerators.get(accountId)

    if (!(energyGeneratorAccount instanceof EnergyGeneratorAccount)) {
      // Make sure the user already has at least one farm
      assert(false, "Account does not have any farms");
      return;
    }

    const totalTokens = energyGeneratorAccount.calculateProduction()

    assert(totalTokens > 0, "No tokens to withdraw");

    const params = {
      senderId: near.currentAccountId(),
      receiverId: accountId,
      amount: totalTokens.toString(),
      memo: ""
    }

    this.internalTransfer(params);
  }

  @call({})
  redeem(): void {
    const accountId = near.predecessorAccountId();
    const accountTokens = BigInt(this.ftBalanceOf({ accountId }));

    assert(accountTokens > 0, "Insufficient tokens");

    // Send tokens from account to contract
    const params = {
      senderId: accountId,
      receiverId: near.currentAccountId(),
      amount: accountTokens.toString(),
      memo: ""
    }
    this.internalTransfer(params);

	// Send NEAR to account
    let promise = near.promiseBatchCreate(accountId)
    near.promiseBatchActionTransfer(promise, (accountTokens * NEAR_KWH_RATE))
  }
}

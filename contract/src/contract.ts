import {
  NearBindgen,
  call,
  view,
  initialize,
  near,
  UnorderedMap,
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
  "small": BigInt(10) * ONE_NEAR,
  "medium": BigInt(16) * ONE_NEAR,
  "big": BigInt(25) * ONE_NEAR
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
    name: "medium",
    powerRate: 280,
    panels: 140
  },
  "big": {
    name: "big",
    powerRate: 420,
    panels: 210
  },
}

interface INewAccount {
  accountId: string
  initialFarm: Farm
  timestamp: bigint
};

interface IAlreadyExistentAccount {
  accountId: string
  totalPowerRate: number
  lastWithdrawal: number
  farms: Farm[]
};

@NearBindgen({})
class EnergyGeneratorAccount {
  accountId: string;

  lastWithdrawal: number; // timestamp in seconds
  totalPowerRate: number = 0;

  farms: Farm[] = [];

  constructor(props: INewAccount | IAlreadyExistentAccount) {
    if (props instanceof INewAccount) {
      // This is a new account
      const { accountId, initialFarm, timestamp } = props;

      this.accountId = accountId;
      this.farms = [initialFarm];

      // Timestamp comes as nanoseconds.
      // We need to convert it to seconds.
      const timestampSeconds = this.nanosecondsToSeconds(timestamp);

      this.totalPowerRate = initialFarm.powerRate;
      this.lastWithdrawal = timestampSeconds;

    } else {
      // Account already exists - set old data
      const { accountId, totalPowerRate, lastWithdrawal, farms } = props
      this.accountId = accountId;
      this.lastWithdrawal = lastWithdrawal;
      this.totalPowerRate = totalPowerRate;
      this.farms = farms;
      return;
    }
  }

  addFarm(farm: Farm) {
    this.farms.push(farm);
    this.totalPowerRate = this.totalPowerRate + farm.powerRate;
  }

  calculateProduction(now: bigint): bigint {

    // Timestamp now comes as nanoseconds.
    // We need to convert it to seconds.
    const timestampSeconds = this.nanosecondsToSeconds(now);

    const diffSeconds = timestampSeconds - this.lastWithdrawal;

    // Get the number of hours between last withdrawal and now
    const hours = Math.floor(diffSeconds / (60 * 60)); // converting seconds to hours

    return BigInt(hours * this.totalPowerRate);
  }

  nanosecondsToSeconds(ns: bigint): number {
    // We convert nanoseconds to seconds by dividing it by 1,000,000,000.
    // Then, the resulting bigint is converted to String.
    // Once we've got the seconds as a string, we get rid of the decimals with Math.floor.
    return Math.floor(
      Number(
        (ns / BigInt(1000000000)).toString()
      )
    );
  }
}

@NearBindgen({})
class FungibleToken {

  accounts = new LookupMap("tokens");
  totalSupply = "200000000";

  energyGenerators = new UnorderedMap("energy_generators");

  @initialize({})
  init(): void {
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

  @view({})
  getEnergyGenerators(): [string, unknown][] {
    return this.energyGenerators.toArray();
  }

  @call({ payableFunction: true })
  buySolarFarm({ farmSize }: { farmSize: farmNames }): void {
    const accountId = near.predecessorAccountId();
    const attachedDeposit: bigint = near.attachedDeposit() as bigint;

    const farmPrice = farmNamesPricesMapping[farmSize];

    assert(attachedDeposit >= farmPrice, `Attached deposit ${attachedDeposit} is not greater than or equal to farm price ${farmPrice}.`)

    const newFarm: Farm = FARMS[farmSize]

    let energyGeneratorAccount: EnergyGeneratorAccount;
    const accountData: any = this.energyGenerators.get(accountId);

    const accountAlreadyExists = (accountData as boolean);

    if (accountAlreadyExists) {
      // Account alredy exists.
      // Add farm.
      energyGeneratorAccount = new EnergyGeneratorAccount(accountData as IAlreadyExistentAccount);
      energyGeneratorAccount.addFarm(newFarm)
    } else {
      // New account - create account
      const props: INewAccount = {
        accountId,
        initialFarm: newFarm,
        timestamp: near.blockTimestamp()
      }
      energyGeneratorAccount = new EnergyGeneratorAccount(props)
    }

    this.energyGenerators.set(accountId, energyGeneratorAccount)
  }

  @call({})
  withdraw(): string {
    const accountId = near.predecessorAccountId();
    let accountData: any = this.energyGenerators.get(accountId)

    // Make sure the user already has at least one farm
    if (!(accountData as boolean)) {
      assert(false, "Account does not have any farms");
      return;
    }
    const energyGeneratorAccount = new EnergyGeneratorAccount(accountData as IAlreadyExistentAccount);

    const totalTokens = energyGeneratorAccount.calculateProduction(near.blockTimestamp())

    assert(totalTokens > 0, "No tokens to withdraw");

    const params = {
      senderId: near.currentAccountId(),
      receiverId: accountId,
      amount: totalTokens.toString(),
      memo: ""
    }

    this.internalTransfer(params);

    return totalTokens.toString();
  }

  @call({})
  redeem(): string {
    const accountId = near.predecessorAccountId();
    const accountTokens = BigInt(this.ftBalanceOf({ accountId }));

    assert(accountTokens > 0, "Insufficient tokens");

    // Send tokens from account to contract
    const params = {
      senderId: accountId,
      receiverId: near.currentAccountId(),
      amount: accountTokens.toString(),
      memo: ""
    };
    this.internalTransfer(params);

    const nearAmount: bigint = accountTokens * NEAR_KWH_RATE;

    // Send NEAR to account
    let promise = near.promiseBatchCreate(accountId);
    near.promiseBatchActionTransfer(promise, nearAmount);

    return nearAmount.toString();
  }
}

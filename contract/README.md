# Hello NEAR Contract

The smart contract exposes two methods to enable storing and retrieving a greeting in the NEAR network.

```ts
@NearBindgen({})
class HelloNear {
  greeting: string = "Hello";

  @view // This method is read-only and can be called for free
  get_greeting(): string {
    return this.greeting;
  }

  @call // This method changes the state, for which it cost gas
  set_greeting({ greeting }: { greeting: string }): void {
    // Record a log permanently to the blockchain!
    near.log(`Saving greeting ${greeting}`);
    this.greeting = greeting;
  }
}
```

<br />

# Quickstart

1. Make sure you have installed [node.js](https://nodejs.org/en/download/package-manager/) >= 16.
2. Install the [`NEAR CLI`](https://github.com/near/near-cli#setup)

<br />

## 1. Build and Deploy the Contract
You can automatically compile and deploy the contract in the NEAR testnet by running:

```bash
npm run deploy
```

Once finished, set the CONTRACT_NAME environment variable from `neardev/dev-account.env` file to get the address in which the contract was deployed:

```bash
source ./neardev/dev-account.env
```

<br />

## 2. Init the contract

```bash
near call $CONTRACT_NAME init --accountId $CONTRACT_NAME
```

<br />

## 3. Get the total supply

```bash
near view $CONTRACT_NAME ftTotalSupply
# result: "200000000"
```

<br />

## 4. Get balance of account.

```bash
near view $CONTRACT_NAME ftBalanceOf '{"accountId": "<account>.testnet"}'
# result: "0"
```

<br />


## 5. Buy a solar farm to start generating tokens
`buySolarFarm` receives one parameter, `farmSize` which is either `small`, `medium` or `big`.

This method requires to send NEAR.

- 10 NEAR if `farmSize` is `small`, 
- 16 NEAR if `farmSize` is `medium`
- 25 NEAR if `farmSize` is `big`

```bash
near call $CONTRACT_NAME buySolarFarm --accountId <accountId>.testnet --deposit 10 '{"farmSize": "small"}'
```


<br />

## 6. Get the list of farms

```bash
near view $CONTRACT_NAME getEnergyGenerators
```

Result:

```json
[
  [
    'luisguve.testnet',
    {
      totalPowerRate: 160,
      farms: [
        { name: 'small', powerRate: 160, panels: 80 }
      ],
      accountId: 'luisguve.testnet',
      lastWithdrawal: 1664290021
    }
  ]
]
```
<br />

## 7. Get energy generated (KWh).
The energy generated in KWh is calculated by multiplying the amount of hours since the last withdrawal by the totalPowerRate of the account.

The totalPowerRate is the sum of the farms' powerRate.

```bash
near view $CONTRACT_NAME getEnergyGenerated '{"accountId": "<accountId>.testnet"}'
```

## 8. Account info.
Thet Total power rate, farms and last withdrawal timestamp.

The totalPowerRate is the sum of the farms' powerRate.

```bash
near view $CONTRACT_NAME getAccountInfo '{"accountId": "luisguve.testnet"}'
```

Example result:

```json
{
  totalPowerRate: 440,
  farms: [
    { name: 'small', powerRate: 160, panels: 80 },
    { name: 'medium', powerRate: 280, panels: 140 }
  ],
  accountId: 'luisguve.testnet',
  lastWithdrawal: 1664290021
}
```

## 9. Get tokens from energy generated.
1 KWh generated is equal to 1 token.

```bash
near call $CONTRACT_NAME withdraw --accountId <accountId>.testnet
# this call returns the amount of tokens
```

<br />

## 10. Swap tokens for NEAR.

```bash
near call $CONTRACT_NAME redeem --accountId <accountId>.testnet
# this call returns the amount of NEAR received
```

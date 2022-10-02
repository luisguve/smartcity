<template>
  <!-- No active session -->
  <section v-if="!isLoggedIn" class="signed-out-flow">
    <button @click="login" id="sign-in-button">Sign in with NEAR Wallet</button>
  </section>
  <!-- Active session -->
  <section v-else class="signed-in-flow">

    <button id="sign-out-button" @click="logout">
      Sign out <span>{{accountId}}</span>
    </button>

    <section data-behavior="dashboard">
      <h3>{{tokensBalanceText}}</h3>

      <h4 v-if="accountInfo != null">
        Total power rate of your farms: {{accountInfo.totalPowerRate}} KWh
      </h4>

      <p>Last withdrawal: {{lastWithdrawal}}</p>

      <button v-if="KWhGenerated > 0" @click="withdraw">Withdraw {{KWhGenerated}} tokens</button>
      <p v-else>0 tokens to withdraw</p>

      <button v-if="NearValue > 0" @click="redeem">Redeem {{NearValue}} NEAR</button>
      <p v-else>0 tokens to redeem</p>
    </section>
  </section>
</template>

<script>
  import { mapState, mapActions } from "pinia";

  import { useMainStore, wallet, contract } from "../store";

  const NEAR_KWH_RATE = 0.0006;

  export default {
    data() {
      return {
        farmsInfoMapping: {
          small: {
            panels: 80,
            powerRate: 160,
            price: 100
          },
          medium: {
            panels: 140,
            powerRate: 280,
            price: 160
          },
          big: {
            panels: 210,
            powerRate: 420,
            price: 250
          }
        }
      };
    },
    computed: {
      ...mapState(useMainStore, ["isLoggedIn", "accountInfo", "tokensBalance"]),
      accountId() {
        return wallet.accountId;
      },
      classifiedFarms() {
        const data = this.accountInfo;
        if (data == null) {
          return null;
        }
        return data.farms.reduce((farms, farm) => {
          farms[farm.name] = farms[farm.name].concat(farm);
          return farms;
        }, {small: [], medium: [], big: []});
      },
      lastWithdrawal() {
        const data = this.accountInfo;
        if (data == null) {
          return null;
        }
        const lastWithdrawalDate = new Date(data.lastWithdrawal * 1000).toLocaleString();
        const diffSeconds = Math.floor(Date.now() / 1000) - data.lastWithdrawal;

        const hours = Math.floor(diffSeconds / 3600);
        const days = Math.floor(hours / 24);

        let daysStr = "";
        if (days > 0) {
          daysStr = days + ((days > 1) ? " days, " : " day, ");
        }

        let hoursStr = (hours % 24) + " hours";
        if ((hours % 24) == 1) {
          hoursStr = "1 hour"
        }
        const timeElapsed = `${daysStr}${hoursStr} ago`;

        return `${lastWithdrawalDate} (${timeElapsed})`;
      },
      KWhGenerated() {
        const data = this.accountInfo;
        if (data == null) {
          return 0;
        }
        const diffSeconds = Math.floor(Date.now() / 1000) - data.lastWithdrawal;
        const hours = Math.floor(diffSeconds / 3600);

        return hours * data.totalPowerRate;
      },
      NearValue() {
        return Number((this.tokensBalance * NEAR_KWH_RATE).toFixed(2));
      },
      tokensBalanceText() {
        const tokens = this.tokensBalance;
        let NearValue = ""
        if (tokens > 0) {
          NearValue = `, equivalent to ${this.NearValue} NEAR`;
        }
        return `${tokens} tokens (KWh) in your wallet${NearValue}`;
      }
    },
    methods: {
      ...mapActions(useMainStore, ["refresh"]),
      login() {
        wallet.signIn();
      },
      logout() {
        wallet.signOut();
      },
      async withdraw() {
        try {
          await contract.withdraw();
          this.refresh();
        } catch(err) {
          console.error("Error while withdrawing", err);
        }
      },
      async redeem() {
        try {
          await contract.redeem();
          this.refresh();
        } catch(err) {
          console.error("Error while redeeming", err);
        }
      }
    }
  };
</script>

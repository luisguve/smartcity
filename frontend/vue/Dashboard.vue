<template>
  <!-- Active session -->
  <section v-if="isLoggedIn" class="signed-in-flow">

    <section data-behavior="dashboard">
      <h4>{{tokensBalanceText}}</h4>

      <ul v-if="accountInfo != null">
        <li>
          Total capacity your farms: <strong>{{accountInfo.totalPowerRate}} KWh</strong>
        </li>
        <li>
          Last withdrawal: {{lastWithdrawal}}
        </li>
      </ul>

      <div class="d-flex">
        <button
          class="w-50 me-1 btn btn-primary"
          :disabled="disabledWithdrawButton"
          @click="withdraw"
        >{{withdrawButtonText}}</button>
        <button
          class="w-50 ms-1 btn btn-success"
          :disabled="disabledRedeemButton"
          @click="redeem"
        >{{redeemButtonText}}</button>
      </div>

    </section>
  </section>
</template>

<script>
  import { mapState, mapActions } from "pinia";
  import { useToast } from "vue-toastification";

  import { useMainStore, wallet, contract } from "../store";

  const NEAR_KWH_RATE = 0.0006;

  export default {
    data() {
      const toast = useToast();
      return {
        toast,
        loading: false,
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
      ...mapState(useMainStore,
        ["isLoggedIn", "accountInfo", "loadingAccountInfo", "tokensBalance", "loadingTokensBalance"]),
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
        const diffSeconds = this.timestamp() - data.lastWithdrawal;

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
        const diffSeconds = this.timestamp() - data.lastWithdrawal;
        const hours = Math.floor(diffSeconds / 3600);

        return hours * data.totalPowerRate;
      },
      withdrawButtonText() {
        if (this.KWhGenerated > 0) {
          return `Withdraw ${this.KWhGenerated} tokens`;
        }
        return "0 tokens to withdraw";
      },
      NearValue() {
        return Number((this.tokensBalance * NEAR_KWH_RATE).toFixed(2));
      },
      redeemButtonText() {
        if (this.NearValue > 0) {
          return `Redeem ${this.NearValue} NEAR`;
        }
        return "0 tokens to redeem";
      },
      tokensBalanceText() {
        if (this.loadingTokensBalance) {
          return "Loading data";
        }
        const tokens = this.tokensBalance;
        let NearValue = ""
        if (tokens > 0) {
          NearValue = `, equivalent to ${this.NearValue} NEAR`;
        }
        return `${tokens} tokens (KWh) in your wallet${NearValue}`;
      },
      disabledWithdrawButton() {
        return (!(this.KWhGenerated > 0) || this.loading)
      },
      disabledRedeemButton() {
        return (!(this.NearValue > 0) || this.loading)
      }
    },
    methods: {
      ...mapActions(useMainStore, ["refresh"]),
      async withdraw() {
        const tokens = this.KWhGenerated;
        try {
          this.loading = true;
          await contract.withdraw();
          this.toast.success(`${tokens} tokens sent to your wallet`);
          await this.refresh();
          this.loading = false;
        } catch(err) {
          this.toast.error("Could not witdraw tokens");
          console.error("Error while withdrawing", err);
        }
      },
      async redeem() {
        const value = this.NearValue;
        try {
          this.loading = true;
          await contract.redeem();
          this.toast.success(`${value} NEAR transferred to your wallet`);
          await this.refresh();
          this.loading = false;
        } catch(err) {
          this.toast.error("Could not redeem NEAR");
          console.error("Error while redeeming", err);
        }
      },
      timestamp() {
        return (Math.floor(Date.now() / 1000) + 60); // add 1 minute
      }
    }
  };
</script>

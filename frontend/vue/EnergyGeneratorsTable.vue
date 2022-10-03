<template>
  <h4
    v-if="loadingEnergyGenerators"
    class="text-center"
  >Loading data</h4>
  <h4
    v-else-if="energyGenerators.length == 0"
    class="text-center"
  >There are still no farms</h4>
  <template v-else>
    <h4 class="text-center">{{solarFarmsCountText}}</h4>
    <div class="table-container">
      <table class="table table-sm table-success table-hover mb-0">
        <thead>
          <tr>
            <th scope="col">Account</th>
            <th scope="col">Farms</th>
            <th scope="col">Capacity</th>
            <th scope="col">KWh generated</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="element in tableRows">
            <th scope="row">{{element.accountId}}</th>
            <td>{{element.farms}}</td>
            <td>{{element.totalPowerRate}} KWh</td>
            <td>{{element.KWhGenerated}}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
</template>

<script>
  import { mapState, mapActions } from "pinia";
  import { useMainStore } from "../store";
  export default {
    data() {
      return {};
    },
    computed: {
      ...mapState(useMainStore, ["energyGenerators", "loadingEnergyGenerators"]),
      totalPowerRate() {
        return this.energyGenerators.reduce((total, [, account]) => total + account.totalPowerRate, 0);
      },
      solarFarmsCount() {
        return this.energyGenerators.reduce((total, [, account]) => total + account.farms.length, 0);
      },
      solarFarmsCountText() {
        return `${this.solarFarmsCount} solar ${(this.solarFarmsCount > 1) ? "farms are" : "farm is"} producing ${this.totalPowerRate} KWh`
      },
      tableRows() {
        return this.energyGenerators.map(rowDataArr => {
          const rowData = rowDataArr[1];
          const element = {};
          element.accountId = rowData.accountId;
          element.farms = rowData.farms.length;
          element.totalPowerRate = rowData.totalPowerRate;
          element.lastWithdrawal = new Date(rowData.lastWithdrawal * 1000).toLocaleString();

          const diffSeconds = this.timestamp() - rowData.lastWithdrawal;
          const hours = Math.floor(diffSeconds / 3600);

          element.KWhGenerated = hours * rowData.totalPowerRate;

          return element;
        });
      }
    },
    methods: {
      timestamp() {
        return (Math.floor(Date.now() / 1000) + 60); // add 1 minute
      }
    }
  };
</script>

<style scoped>
  @media screen and (min-width: 768px) {
    .table-container {
      max-height: 25vh;
      overflow-y: auto;
    }
    /* width */
    ::-webkit-scrollbar {
      width: 10px;
    }

    /* Track */
    ::-webkit-scrollbar-track {
      background: #f1f1f1;
    }

    /* Handle */
    ::-webkit-scrollbar-thumb {
      background: #888;
    }

    /* Handle on hover */
    ::-webkit-scrollbar-thumb:hover {
      background: #555;
    }
  }
</style>

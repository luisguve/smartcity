<template>
  <h3 v-if="energyGenerators.length == 0">There are still no farms</h3>
  <template v-else>
    <h3>{{solarFarmsCountText}}</h3>
    <table>
      <tr>
        <th>Account</th>
        <th>Farms</th>
        <th>Total Power Rate</th>
        <th>Last withdrawal</th>
        <th>KWh generated</th>
      </tr>
      <tr v-for="element in tableRows">
        <td>{{element.accountId}}</td>
        <td>{{element.farms}}</td>
        <td>{{element.totalPowerRate}}</td>
        <td>{{element.lastWithdrawal}}</td>
        <td>{{element.KWhGenerated}}</td>
      </tr>
    </table>
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
      ...mapState(useMainStore, ["energyGenerators"]),
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

          const diffSeconds = Math.floor(Date.now() / 1000) - rowData.lastWithdrawal;
          const hours = Math.floor(diffSeconds / 3600);

          element.KWhGenerated = hours * rowData.totalPowerRate;

          return element;
        });
      }
    }
  };
</script>

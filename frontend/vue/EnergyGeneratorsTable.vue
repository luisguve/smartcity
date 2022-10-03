<template>
  <h4 v-if="energyGenerators.length == 0">There are still no farms</h4>
  <template v-else>
    <h4 class="text-center">{{solarFarmsCountText}}</h4>
    <table class="table table-sm table-success table-hover">
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

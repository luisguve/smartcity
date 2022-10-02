<template>
  <main>
    <h1>Smart city simulator: decentralized energy</h1>
    <p>Buy solar farms, produce and supply energy to the grid, get tokens</p>
    <EnergyGeneratorsTable />
    <Dashboard />
    <ClassifiedFarms />
  </main>
</template>

<script>
  import { mapActions } from "pinia";

  import EnergyGeneratorsTable from "./EnergyGeneratorsTable.vue";
  import Dashboard from "./Dashboard.vue";
  import ClassifiedFarms from "./ClassifiedFarms.vue";
  import { useMainStore } from "../store";

  export default {
    data() {
      return {};
    },
    components: {
      EnergyGeneratorsTable,
      Dashboard,
      ClassifiedFarms
    },
    methods: {
      ...mapActions(useMainStore, ["startUp"])
    },
    mounted() {
      this.startUp();
    }
  };
</script>

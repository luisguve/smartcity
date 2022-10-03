<template>
  <div class="container">
    <header class="d-flex flex-column align-items-center">
      <h1>Smart city simulator: decentralized energy</h1>
      <p>Buy solar farms, produce and supply energy to the grid, get tokens</p>
    </header>
    <AuthButton />
    <main class="row mt-4">
      <aside :class="asideClass">
        <EnergyGeneratorsTable />
      </aside>
      <div class="col-12 col-lg-6 ps-5">
        <Dashboard />
      </div>
      <div class="col-12 mt-4">
        <ClassifiedFarms />
      </div>
    </main>
  </div>
</template>

<script>
  import { mapActions, mapState } from "pinia";

  import EnergyGeneratorsTable from "./EnergyGeneratorsTable.vue";
  import Dashboard from "./Dashboard.vue";
  import ClassifiedFarms from "./ClassifiedFarms.vue";
  import AuthButton from "./AuthButton.vue";
  import { useMainStore } from "../store";

  export default {
    data() {
      return {};
    },
    components: {
      EnergyGeneratorsTable,
      AuthButton,
      Dashboard,
      ClassifiedFarms
    },
    computed: {
      ...mapState(useMainStore, ["isLoggedIn"]),
      asideClass() {
        if (this.isLoggedIn) {
          return "col-12 col-lg-6 pe-5";
        }
        return "col-12";
      }
    },
    methods: {
      ...mapActions(useMainStore, ["startUp"])
    },
    mounted() {
      this.startUp();
    }
  };
</script>

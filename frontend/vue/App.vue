<template>
  <div class="top container-fluid">
    <div class="container">
      <header class="d-flex flex-column align-items-center">
        <h1>Smart city simulator: decentralized energy</h1>
        <span class="d-flex align-items-center">
          <p class="mb-0">Buy solar farms, produce and supply energy to the grid, get tokens</p>
          <button
            type="button"
            class="btn btn-light btn-sm ms-2"
            data-bs-toggle="modal" data-bs-target="#infoModal"
          ><i class="fa fa-info-circle" aria-hidden="true"></i></button>
          <a
            href="https://github.com/luisguve/smartcity"
            target="blank"
            rel="noreferrer"
            class="btn btn-link btn-sm ms-2"
          ><i class="fa fa-github" aria-hidden="true"></i></a>
        </span>
        <InfoModal />
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
      <Attribution />
    </div>
  </div>
</template>

<script>
  import { mapActions, mapState } from "pinia";

  import EnergyGeneratorsTable from "./EnergyGeneratorsTable.vue";
  import Dashboard from "./Dashboard.vue";
  import ClassifiedFarms from "./ClassifiedFarms.vue";
  import AuthButton from "./AuthButton.vue";
  import InfoModal from "./InfoModal.vue";
  import Attribution from "./Attribution.vue";
  import { useMainStore } from "../store";

  export default {
    data() {
      return {};
    },
    components: {
      EnergyGeneratorsTable,
      AuthButton,
      Attribution,
      InfoModal,
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

<style scoped>
  @media screen and (min-width: 768px) {
    .top.container-fluid {
      min-height: 100vh;
      background-image: url("../assets/solar-panels-g2ae1d0103_1280.jpg");
      background-size: cover;
      background-position: center;
    }
  }
</style>

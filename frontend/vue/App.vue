<template>
  <button @click="increment()">increment {{count}}!</button>
</template>

<script>
  import { mapState, mapActions } from "pinia";
  import { useMainStore } from "../store";
  export default {
    data() {
      return {};
    },
    computed: {
      ...mapState(useMainStore, ["count"])
    },
    methods: {
      ...mapActions(useMainStore, ["increment"])
    }
  };
</script>

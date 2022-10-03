<template>
  <!-- No active session -->
  <section v-if="!isLoggedIn" class="d-flex justify-content-center">
    <button @click="login" class="btn btn-primary">Sign in with NEAR Wallet</button>
  </section>
  <!-- Active session -->
  <section v-else class="logout-container">
    <button @click="logout" class="logout btn btn-secondary">
      Sign out <span>{{accountId}}</span>
    </button>
  </section>
</template>

<script>
  import { mapState } from "pinia";

  import { useMainStore, wallet, contract } from "../store";

  export default {
    data() {
      return {};
    },
    computed: {
      ...mapState(useMainStore, ["isLoggedIn"]),
      accountId() {
        return wallet.accountId;
      }
    },
    methods: {
      login() {
        wallet.signIn();
      },
      logout() {
        wallet.signOut();
      }
    }
  };
</script>

<style scoped>
  button.logout {
    position: absolute;
    bottom: 40px;
    right: 40px;
    z-index: 10;
  }
  @media screen and (max-width: 768px) {
    .logout-container {
      display: flex;
      justify-content: center;
    }
    button.logout {
      position: initial;
    }
  }
</style>

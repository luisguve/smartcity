<template>
  <article v-for="(farms, farmSize) in classifiedFarms" :key="farmSize">
    <h4>{{farmSize}}: {{farmsInfoMapping[farmSize].powerRate}} KWh</h4>
    <h6 v-if="isLoggedIn">{{farms.length}} {{(farms.length !== 1) ? "farms" : "farm"}}</h6>
    <p v-if="farms.length > 0">
      Total power rate: {{farms.length * farmsInfoMapping[farmSize].powerRate}} KWh
    </p>
    <strong>Price: {{farmsInfoMapping[farmSize].price}} NEAR</strong>
    <button
      :disabled="!isLoggedIn"
      @click="buyFarm(farmSize)"
    >{{ isLoggedIn ? "Buy farm" : "Signin to buy" }}</button>
  </article>
</template>

<script>
  import { mapState, mapActions } from "pinia";
  import { useMainStore, contract } from "../store";

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
      ...mapState(useMainStore, ["isLoggedIn", "accountInfo"]),
      classifiedFarms() {
        const data = this.accountInfo;
        const emptyFarms = {small: [], medium: [], big: []};

        if (data == null) {
          return emptyFarms;
        }

        return data.farms.reduce((farms, farm) => {
          farms[farm.name] = farms[farm.name].concat(farm);
          return farms;
        }, emptyFarms);
      }
    },
    methods: {
      async buyFarm(farmSize) {
        try {
          await contract.buySolarFarm(farmSize, this.farmsInfoMapping[farmSize].price);
        } catch(err) {
          console.error("Error while buy farm", err);
        }
      }
    }
  };
</script>

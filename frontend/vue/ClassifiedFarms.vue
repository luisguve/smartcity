<template>
  <section class="row">
    <article v-for="(farms, farmSize) in classifiedFarms" :key="farmSize" class="col-lg-4">
      <div class="card">
        <div class="card-body d-flex flex-column align-items-center">
          <h5 class="card-title">{{farmSize}} farm</h5>

          <ul>
            <li>
              Power rate: {{farmsInfoMapping[farmSize].powerRate}} KWh
            </li>
            <li v-if="isLoggedIn">
              You have: {{farms.length}} {{(farms.length !== 1) ? "farms" : "farm"}}
            </li>
            <li v-if="isLoggedIn">
              Total power rate: {{farms.length * farmsInfoMapping[farmSize].powerRate}} KWh
            </li>
            <li>
              Price: {{farmsInfoMapping[farmSize].price}} NEAR
            </li>
          </ul>

          <button
            class="btn btn-success"
            :disabled="!isLoggedIn"
            @click="buyFarm(farmSize)"
          >{{ isLoggedIn ? "Buy farm" : "Signin to buy" }}</button>
        </div>
      </div>
    </article>
  </section>
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

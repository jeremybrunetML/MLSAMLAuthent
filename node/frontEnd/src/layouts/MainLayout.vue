<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title>
          <img src="../assets/MarkLogic_logo.png" width="150"  />
        
        </q-toolbar-title>

        &nbsp;&nbsp;
        <q-btn dense flat round icon="account_box">
          <q-menu fit anchor="top left" self="bottom left">
            <q-item clickable @click="logout()">
              <q-item-section>{{ this.account.login }}</q-item-section>
            </q-item>
          </q-menu>
          <q-tooltip
              anchor="bottom middle" 
              self="center middle"
              :offset="[10, 20]"
            >
              User
            </q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>


import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'MainLayout',


  setup () {

    return {

    }
  },
  created() {
    this.getAccount();
  },
  data() {
    return {
      account: {},
    };
  },
  methods: {
    getAccount() {
      this.$axios
        .get("/api/resources/account")
        .then(response => {
          if (response.status == 200) {
            this.account = response.data;

            return;
          } else {
            alert("Login failed. Please try logging in again!");
            return;
          }
        })
        .catch(error => {
          alert(error.message);
        });
    },
    logout() {
      this.$axios.delete("/api/resources/account");
      this.$router.push("/");
      location.reload();
    }
  }
})
</script>

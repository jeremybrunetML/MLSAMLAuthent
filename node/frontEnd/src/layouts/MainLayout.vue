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
               <q-item-section>{{ this.saml }}</q-item-section>
                 <q-item-section>{{ this.dateWillExpire }}</q-item-section>
                   <q-item-section>{{ this.currentDate }}</q-item-section>
                     <q-item-section>{{ this.samlNotOnOrAfter }}</q-item-section>
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
    this.checkSAMLExpirationDate();
     this.timer = setInterval(this.checkSAMLExpirationDate, 10000);
  },  beforeUnmount() {
    clearInterval(this.timer);
  },
  data() {
    return {
      account: {},
      saml: {},
      dateWillExpire : null,
      currentDate: null,
      samlNotOnOrAfter:null
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
    },
    checkSAMLExpirationDate(){
      this.$axios
              .get("/samlResponseInfo")
              .then(response => {
               
                  this.saml = response.data;
                 if(this.saml){
                  this.samlNotOnOrAfter = new Date(this.saml.notOnOrAfter)
                  this.currentDate = new Date() 
                  this.samlNotOnOrAfter.setMinutes(this.samlNotOnOrAfter.getMinutes() - 5 )
                  this.dateWillExpire = this.currentDate > this.samlNotOnOrAfter

                  if(this.dateWillExpire){
                    var win = window.open("/login/sso", '_blank');
                    setTimeout(function() { win.close();}, 5000);
                  }
                 }

              })
              .catch(error => {
                alert(error.message);
              });
    }
  }
})
</script>

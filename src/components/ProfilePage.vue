<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" sm="8" md="6">
        <v-card>
          <v-card-title>
            <span class="text-h6">Profile</span>
            <v-spacer />
          </v-card-title>

          <v-card-text>
            <div v-if="isAuthenticated">
              <v-list dense>
                <v-list-item>
                  <v-list-item-content>
                    <v-list-item-title>{{ display.name }}</v-list-item-title>
                    <v-list-item-subtitle>{{ display.email }}</v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </div>

            <div v-else>
              <v-tabs v-model="tab">
                <v-tab value="login">Login</v-tab>
                <v-tab value="signup">Signup</v-tab>
              </v-tabs>

              <v-tabs-items v-model="tab">
                <v-tab-item value="login" v-if="tab === 'login'">
                  <v-form ref="loginForm" @submit.prevent="doLogin">
                    <v-text-field v-model="loginEmail" label="Email" required />
                    <v-text-field v-model="loginPassword" label="Password" type="password" required />
                    <v-row>
                      <v-col>
                        <v-btn color="primary" @click="doLogin">Login</v-btn>
                      </v-col>
                    </v-row>
                  </v-form>
                </v-tab-item>

                <v-tab-item value="signup" v-if="tab === 'signup'">
                  <v-form ref="signupForm" @submit.prevent="doSignup">
                    <v-text-field v-model="signupName" label="Name (optional)" />
                    <v-text-field v-model="signupEmail" label="Email" required />
                    <v-text-field v-model="signupPassword" label="Password" type="password" required />
                    <v-text-field v-model="signupRepassword" label="Confirm password" type="password" required />

                    <v-row>
                      <v-col>
                        <v-btn color="primary" @click="doSignup">Signup</v-btn>
                      </v-col>
                    </v-row>
                  </v-form>
                </v-tab-item>
              </v-tabs-items>
            </div>
          </v-card-text>

          <v-card-actions>
            <v-spacer />
            <v-btn v-if="isAuthenticated" color="error" @click="logout">Logout</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: "ProfilePage",
  data: () => ({
    tab: "login",
    loginEmail: "",
    loginPassword: "",
    signupName: "",
    signupEmail: "",
    signupPassword: "",
    signupRepassword: "",
  }),
  computed: {
    isAuthenticated() {
      return this.$store.getters["auth/isAuthenticated"];
    },
    display() {
      return this.$store.getters["auth/userDisplay"] || {};
    },
  },
  methods: {
    async doLogin() {
      this.$store.commit("clearAlert");
      try {
        await this.$store.dispatch("auth/login", { email: this.loginEmail, password: this.loginPassword });
        this.$store.commit("setAlert", { type: "success", text: "Logged in" });
      } catch (err) {
        this.$store.commit("setAlert", { type: "error", text: err.message });
      }
    },
    async doSignup() {
      this.$store.commit("clearAlert");
      if (this.signupPassword !== this.signupRepassword) {
        this.$store.commit("setAlert", { type: "error", text: "Passwords do not match" });
        return;
      }

      try {
        await this.$store.dispatch("auth/register", { email: this.signupEmail, password: this.signupPassword, name: this.signupName });
        this.$store.commit("setAlert", { type: "success", text: "Registered and logged in" });
      } catch (err) {
        this.$store.commit("setAlert", { type: "error", text: err.message });
      }
    },
    logout() {
      this.$store.dispatch("auth/logout");
      this.$store.commit("setAlert", { type: "info", text: "Logged out" });
    },
  },
  mounted() {
    // Clear alert when opening the profile page
    this.$store.commit("clearAlert");
  },
};
</script>

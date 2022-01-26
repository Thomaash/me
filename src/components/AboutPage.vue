<template>
  <v-container grid-list-md>
    <v-layout wrap>
      <AppLogo />
      <v-flex xs12>
        <AppDescription full />
      </v-flex>
      <v-flex xs12>
        <AppLicense />
      </v-flex>
      <v-flex xs12>
        <BuildInfo />
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import BuildInfo from "./BuildInfo";
import AppDescription from "./AppDescription";
import AppLicense from "./AppLicense";
import AppLogo from "./AppLogo";

export default {
  name: "AboutPage",
  components: { BuildInfo, AppDescription, AppLicense, AppLogo },
};
</script>

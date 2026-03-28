<template>
  <v-container grid-list-md>
    <v-row wrap>
      <AppLogo />
      <v-col cols="12">
        <AppDescription full />
      </v-col>
      <v-col cols="12">
        <AppLicense />
      </v-col>
      <v-col cols="12">
        <BuildInfo />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import BuildInfo from "./BuildInfo.vue";
import AppDescription from "./AppDescription.vue";
import AppLicense from "./AppLicense.vue";
import AppLogo from "./AppLogo.vue";
</script>

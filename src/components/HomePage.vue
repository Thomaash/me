<template>
  <v-container grid-list-md>
    <v-layout wrap>
      <AppLogo />
      <v-flex xs12>
        <AppDescription />
      </v-flex>
      <v-flex xs12>
        <BindingsList />
      </v-flex>
      <v-flex xs12>
        <PlaceholderHowTo />
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import BindingsList from "./BindingsList";
import AppDescription from "./AppDescription";
import AppLogo from "./AppLogo";
import PlaceholderHowTo from "./PlaceholderHowTo";

export default {
  name: "HomePage",
  components: { BindingsList, AppDescription, AppLogo, PlaceholderHowTo },
};
</script>

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
import BindingsList from "./BindingsList.vue";
import AppDescription from "./AppDescription.vue";
import AppLogo from "./AppLogo.vue";
import PlaceholderHowTo from "./PlaceholderHowTo.vue";

export default {
  name: "HomePage",
  components: { BindingsList, AppDescription, AppLogo, PlaceholderHowTo },
};
</script>

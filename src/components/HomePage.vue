<template>
  <v-container grid-list-md>
    <v-row>
      <AppLogo />
      <v-col cols="12">
        <AppDescription />
      </v-col>
      <v-col cols="12">
        <BindingsList />
      </v-col>
      <v-col cols="12">
        <PlaceholderHowTo />
      </v-col>
    </v-row>
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

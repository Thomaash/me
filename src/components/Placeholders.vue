<template>
  <section>
    <h3 class="headline">Placeholders</h3>

    <p>
      Placeholders can be used in labels to display information about connected node or nodes.
    </p>

    <v-data-table :headers="headers" :items="items" hide-actions disable-initial-sort>
      <template slot="items" slot-scope="props">
        <td v-text="props.item.name" />
        <td v-text="props.item.description" />
        <td v-text="props.item.multiline" />
      </template>
    </v-data-table>
  </section>
</template>

<script>
export default {
  name: 'Placeholders',
  data: () => ({
    headers: [
      { text: 'Placeholder', value: 'name' },
      { text: 'Description', value: 'description' },
      { text: 'Multiline', value: 'multiline' }
    ],
    items: [
      { name: '{{HOSTNAMES}}', description: 'Lists hostnames of connected nodes.', multiline: 'no' },
      { name: '{{IPS}}', description: 'Lists IPs of connected nodes.', multiline: 'with multiple IPs or nodes' },
      { name: '{{TYPES}}', description: 'Lists types of connected nodes.', multiline: 'with multiple nodes' }
    ]
  })
}
</script>

<style scoped>
.v-icon {height: 1ex;}
.with-title {cursor: help;}
</style>

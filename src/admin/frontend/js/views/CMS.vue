<template>
  <div class="cms-page">
      CMS
  </div>
</template>

<script>
    import { LOAD_SCHEMAS } from "../store/actions.type";

    export default {
        name: "cms",
        mounted() {
            this.$store.dispatch(LOAD_SCHEMAS);
        }
    };
</script>
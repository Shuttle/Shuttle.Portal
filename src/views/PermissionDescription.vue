<template>
  <s-form :submit="submit">
    <s-title :title="$t('permission')" close-drawer type="borderless" />
    <v-text-field
      v-model="state.current"
      :label="$t('description')"
      class="mb-2"
      readonly
    >
    </v-text-field>
    <v-text-field
      v-model="state.description"
      :label="$t('new-value')"
      class="mb-2"
    >
    </v-text-field>
    <s-strip reverse>
      <v-btn type="submit" :disabled="busy || same">{{ $t("save") }}</v-btn>
    </s-strip>
  </s-form>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { accessApi } from "@/api";
import { useDrawerStore } from "@/stores/drawer";
import { useSnackbarStore } from "@/stores/snackbar";

const drawerStore = useDrawerStore();

const props = defineProps({
  id: String,
});

const busy = ref(false);

const same = computed(() => {
  return state.current === state.description;
});

const state = reactive({
  current: "",
  description: "",
});

const submit = async () => {
  busy.value = true;

  try {
    await accessApi.patch(`v1/permissions/${props.id}/description`, {
      description: state.description,
    });

    useSnackbarStore().requestSent();

    drawerStore.close();
  } finally {
    busy.value = false;
  }
};

onMounted(() => {
  accessApi.get(`v1/permissions/${props.id}`).then((item) => {
    state.current = item.data.description;
    state.description = item.data.description;
  });
});
</script>

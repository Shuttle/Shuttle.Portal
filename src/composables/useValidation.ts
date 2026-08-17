import useVuelidate from "@vuelidate/core";
import { isRef, type Ref } from "vue";

export interface ValidationComposable {
  v$: Ref<any>;
  message: (path: string) => string | undefined;
  errors: () => Promise<any[]>;
}

export function useValidation(rules: any, state: any): ValidationComposable {
  const v$ = useVuelidate(rules, state);

  const message = (path: string): string | undefined => {
    const error = v$.value.$errors.find((item) => item.$propertyPath == path);

    if (!error) {
      return undefined;
    }

    return isRef(error.$message) ? error.$message.value : error.$message;
  };

  const errors = async () => {
    await v$.value.$validate();

    return v$.value.$errors;
  };

  return {
    v$: v$,
    message: message,
    errors: errors,
  };
}

import { useCallback } from "react";
import {
  getEditorBaseMessage,
  type EditorTranslationFn,
} from "./editor-i18n";

export function useEditorTranslations(namespace?: string): EditorTranslationFn {
  return useCallback<EditorTranslationFn>(
    (key, values) => {
      const fullKey = namespace ? `${namespace}.${key}` : key;
      return getEditorBaseMessage(fullKey, values);
    },
    [namespace],
  );
}

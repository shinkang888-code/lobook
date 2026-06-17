"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { EditorToolbarActions } from "@/lib/editor/types";

type EditorToolbarContextValue = {
  actions: EditorToolbarActions;
  register: (actions: EditorToolbarActions) => void;
  reset: () => void;
};

const EditorToolbarContext = createContext<EditorToolbarContextValue | null>(null);

export function EditorToolbarProvider({ children }: { children: React.ReactNode }) {
  const [actions, setActions] = useState<EditorToolbarActions>({});

  const register = useCallback((next: EditorToolbarActions) => {
    setActions(next);
  }, []);

  const reset = useCallback(() => setActions({}), []);

  const value = useMemo(() => ({ actions, register, reset }), [actions, register, reset]);

  return <EditorToolbarContext.Provider value={value}>{children}</EditorToolbarContext.Provider>;
}

export function useEditorToolbar() {
  const ctx = useContext(EditorToolbarContext);
  if (!ctx) throw new Error("useEditorToolbar must be used within EditorToolbarProvider");
  return ctx;
}

export function useEditorToolbarOptional() {
  return useContext(EditorToolbarContext);
}

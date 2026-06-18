import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { AiStudioWorkspace } from "@/components/ai-studio/AiStudioWorkspace";

export default function AiStudioWorkspacePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-dvh items-center justify-center gap-2 text-sm text-gray-500">
          <Loader2 className="size-5 animate-spin" />
          Loffice AI Studio 로딩…
        </div>
      }
    >
      <AiStudioWorkspace />
    </Suspense>
  );
}

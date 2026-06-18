import { promises as fs } from "fs";
import path from "path";
import { LIBREOFFICE_ENGINE_BINDINGS } from "./libreOfficeCatalog";

export type LibreOfficeRuntimeStatus = {
  manifestInstalled: boolean;
  manifestPath: string;
  moduleCount: number;
  integratedCount: number;
  collaboraUrl?: string;
  collaboraEnabled: boolean;
  engines: Array<{
    moduleId: string;
    label: string;
    status: string;
    lobookEngine: string;
  }>;
};

function manifestPath(): string {
  return path.join(process.cwd(), "vendor", "libreoffice", "engine-manifest.json");
}

export async function getLibreOfficeRuntimeStatus(): Promise<LibreOfficeRuntimeStatus> {
  const mp = manifestPath();
  let manifestInstalled = false;
  try {
    await fs.access(mp);
    manifestInstalled = true;
  } catch {
    /* optional */
  }

  const collaboraUrl = process.env.LIBREOFFICE_ONLINE_URL || process.env.COLLABORA_URL;
  const integrated = LIBREOFFICE_ENGINE_BINDINGS.filter((b) => b.status === "integrated");

  return {
    manifestInstalled,
    manifestPath: mp,
    moduleCount: LIBREOFFICE_ENGINE_BINDINGS.length,
    integratedCount: integrated.length,
    collaboraUrl,
    collaboraEnabled: Boolean(collaboraUrl),
    engines: LIBREOFFICE_ENGINE_BINDINGS.map((b) => ({
      moduleId: b.moduleId,
      label: b.label,
      status: b.status,
      lobookEngine: b.lobookEngine,
    })),
  };
}

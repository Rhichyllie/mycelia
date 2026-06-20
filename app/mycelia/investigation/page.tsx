import {
  resolveInvestigationSelectionTarget,
} from "@/mycelia/ui-surfaces/investigation-selection-readonly-boundary";
import {
  MinimalInvestigationUiSurface,
} from "@/mycelia/ui-surfaces/minimal-investigation-ui-surface";

export default async function MyceliaInvestigationPage() {
  const investigation = await resolveInvestigationSelectionTarget();
  const descriptor = investigation.ok
    ? investigation.value.uiDescriptor
    : investigation.error.uiDescriptor;
  const sourceSummary = investigation.ok
    ? investigation.value.safeSummary
    : investigation.error.safeReason;

  return (
    <MinimalInvestigationUiSurface
      descriptor={descriptor}
      sourceSummary={sourceSummary}
    />
  );
}

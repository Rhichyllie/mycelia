import {
  MinimalInvestigationUiSurface,
  loadMinimalInvestigationUiDescriptor,
} from "@/mycelia/minimal-investigation-ui-surface";

export default async function MyceliaInvestigationPage() {
  const investigation = await loadMinimalInvestigationUiDescriptor();

  return (
    <MinimalInvestigationUiSurface
      descriptor={investigation.descriptor}
      sourceSummary={investigation.safeSummary}
    />
  );
}

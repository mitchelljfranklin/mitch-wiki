import SettingsTitle from "@/components/settings/settings-title.tsx";
import WorkspaceNameForm from "@/features/workspace/components/settings/components/workspace-name-form";
import WorkspaceIcon from "@/features/workspace/components/settings/components/workspace-icon.tsx";
import WorkspaceFavicon from "@/features/workspace/components/settings/components/workspace-favicon.tsx";
import { useTranslation } from "react-i18next";
import { usePageTitle } from "@/hooks/use-page-title";
import { Helmet } from "react-helmet-async";
import { Divider } from "@mantine/core";
import WorkspaceDefaultPageEditMode from "@/features/workspace/components/settings/components/workspace-default-page-edit-mode.tsx";

export default function WorkspaceSettings() {
  const { t } = useTranslation();
  return (
    <>
      <Helmet>
        <title>{usePageTitle("Workspace Settings")}</title>
      </Helmet>
      <SettingsTitle title={t("General")} />
      <WorkspaceIcon />
      <WorkspaceFavicon />
      <WorkspaceNameForm />

      <Divider my="md" />
      <WorkspaceDefaultPageEditMode />
    </>
  );
}

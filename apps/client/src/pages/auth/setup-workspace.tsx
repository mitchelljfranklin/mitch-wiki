import { useWorkspacePublicDataQuery } from "@/features/workspace/queries/workspace-query.ts";
import { SetupWorkspaceForm } from "@/features/auth/components/setup-workspace-form.tsx";
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import APP_ROUTE from "@/lib/app-route.ts";
import { useTranslation } from "react-i18next";
import { DocumentTitle } from "@/components/ui/document-title.tsx";

export default function SetupWorkspace() {
  const { t } = useTranslation();
  const {
    data: workspace,
    isLoading,
    isError,
  } = useWorkspacePublicDataQuery();

  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && workspace) {
      navigate(APP_ROUTE.AUTH.LOGIN);
    }
  }, [isLoading, workspace]);

  if (isLoading) {
    return <div></div>;
  }

  if (isError) {
    return null;
  }

  if (!workspace) {
    return (
      <>
        <DocumentTitle title={t("Setup Workspace")} />
        <SetupWorkspaceForm />
      </>
    );
  }

  return null;
}

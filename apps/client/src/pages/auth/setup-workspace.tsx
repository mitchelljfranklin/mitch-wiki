import { useWorkspacePublicDataQuery } from "@/features/workspace/queries/workspace-query.ts";
import { SetupWorkspaceForm } from "@/features/auth/components/setup-workspace-form.tsx";
import { Helmet } from "react-helmet-async";
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import APP_ROUTE from "@/lib/app-route.ts";
import { usePageTitle } from "@/hooks/use-page-title";
import { useTranslation } from "react-i18next";

export default function SetupWorkspace() {
  const { t } = useTranslation();
  const {
    data: workspace,
    isLoading,
    isError,
  } = useWorkspacePublicDataQuery();

  const navigate = useNavigate();
  const title = usePageTitle(t("Setup Workspace"));

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
        <Helmet>
          <title>{title}</title>
        </Helmet>
        <SetupWorkspaceForm />
      </>
    );
  }

  return null;
}

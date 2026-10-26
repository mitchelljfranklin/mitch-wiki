import { LoginForm } from "@/features/auth/components/login-form";
import { useTranslation } from "react-i18next";
import { DocumentTitle } from "@/components/ui/document-title.tsx";
import { useWorkspacePublicDataQuery } from "@/features/workspace/queries/workspace-query";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import APP_ROUTE from "@/lib/app-route";

export default function LoginPage() {
  const { t } = useTranslation();
  const { data: workspace, isLoading } = useWorkspacePublicDataQuery();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && workspace === null) {
      navigate(APP_ROUTE.AUTH.SETUP);
    }
  }, [workspace, isLoading]);

  return (
    <>
      <DocumentTitle title={t("Login")} />
      <LoginForm />
    </>
  );
}

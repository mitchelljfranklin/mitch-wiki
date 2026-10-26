import { LoginForm } from "@/features/auth/components/login-form";
import { Helmet } from "react-helmet-async";
import { usePageTitle } from "@/hooks/use-page-title";
import { useTranslation } from "react-i18next";
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
      <Helmet>
        <title>
          {usePageTitle(t("Login"))}
        </title>
      </Helmet>
      <LoginForm />
    </>
  );
}

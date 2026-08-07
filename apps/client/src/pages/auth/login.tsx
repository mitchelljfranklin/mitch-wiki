import { LoginForm } from "@/features/auth/components/login-form";
import { Helmet } from "react-helmet-async";
import { usePageTitle } from "@/hooks/use-page-title";
import { useTranslation } from "react-i18next";

export default function LoginPage() {
  const { t } = useTranslation();

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

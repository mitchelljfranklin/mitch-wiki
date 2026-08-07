import { Helmet } from "react-helmet-async";
import { InviteSignUpForm } from "@/features/auth/components/invite-sign-up-form.tsx";
import {usePageTitle} from "@/hooks/use-page-title";
import { useTranslation } from "react-i18next";

export default function InviteSignup() {
  const { t } = useTranslation();

  return (
    <>
      <Helmet>
        <title>{usePageTitle(t("Invitation Signup"))}</title>
      </Helmet>
      <InviteSignUpForm />
    </>
  );
}

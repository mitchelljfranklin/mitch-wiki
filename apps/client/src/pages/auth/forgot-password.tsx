import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";
import { usePageTitle } from "@/hooks/use-page-title";
import { Helmet } from "react-helmet-async";

export default function ForgotPassword() {
    return (
        <>
            <Helmet>
                <title>{usePageTitle("Forgot Password")}</title>
            </Helmet>
            <ForgotPasswordForm />
        </>
    );
}

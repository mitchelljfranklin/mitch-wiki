import SettingsTitle from "@/components/settings/settings-title.tsx";
import { Helmet } from "react-helmet-async";
import { usePageTitle } from "@/hooks/use-page-title";
import { useTranslation } from "react-i18next";
import ShareList from "@/features/share/components/share-list.tsx";
import { Alert, Text } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import React from "react";

export default function Shares() {
  const { t } = useTranslation();

  return (
    <>
      <Helmet>
        <title>
          {usePageTitle(t("Public sharing"))}
        </title>
      </Helmet>
      <SettingsTitle title={t("Public sharing")} />

      <Alert variant="light" color="blue" icon={<IconInfoCircle />}>
        {t(
          "Publicly shared pages from spaces you are a member of will appear here",
        )}
      </Alert>

      <ShareList />
    </>
  );
}

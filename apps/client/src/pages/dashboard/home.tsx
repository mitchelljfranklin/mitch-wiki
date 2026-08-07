import { Container, Space } from "@mantine/core";
import HomeTabs from "@/features/home/components/home-tabs";
import HomeAiPrompt from "@/features/home/components/home-ai-prompt";
import SpaceCarousel from "@/features/space/components/space-carousel.tsx";
import { usePageTitle } from "@/hooks/use-page-title";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";

export default function Home() {
  const { t } = useTranslation();

  return (
    <>
      <Helmet>
        <title>
          {usePageTitle(t("Home"))}
        </title>
      </Helmet>
      <Container size={"900"} pt="xl">
        <HomeAiPrompt />

        <Space h="xl" />

        <SpaceCarousel />

        <Space h="xl" />

        <HomeTabs />
      </Container>
    </>
  );
}

import {Container} from "@mantine/core";
import SpaceHomeTabs from "@/features/space/components/space-home-tabs.tsx";
import {useParams} from "react-router-dom";
import {useGetSpaceBySlugQuery} from "@/features/space/queries/space-query.ts";
import {usePageTitle} from "@/hooks/use-page-title";
import {Helmet} from "react-helmet-async";
import {useTranslation} from "react-i18next";

export default function SpaceHome() {
    const {t} = useTranslation();
    const {spaceSlug} = useParams();
    const {data: space} = useGetSpaceBySlugQuery(spaceSlug);

    return (
        <>
            <Helmet>
                <title>{usePageTitle(space?.name || t('Overview'))}</title>
            </Helmet>
            <Container size={"900"} pt="xl">
                {space && <SpaceHomeTabs/>}
            </Container>
        </>
    );
}

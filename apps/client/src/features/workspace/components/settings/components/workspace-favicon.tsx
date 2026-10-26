import { useState } from "react";
import { useAtom } from "jotai";
import { Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import AvatarUploader from "@/components/common/avatar-uploader.tsx";
import {
  uploadWorkspaceFavicon,
  removeWorkspaceFavicon,
} from "@/features/attachments/services/attachment-service.ts";
import { AvatarIconType } from "@/features/attachments/types/attachment.types.ts";
import { workspaceAtom } from "@/features/user/atoms/current-user-atom.ts";
import useUserRole from "@/hooks/use-user-role.tsx";

export default function WorkspaceFavicon() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [workspace, setWorkspace] = useAtom(workspaceAtom);
  const { isAdmin } = useUserRole();

  const handleFaviconUpload = async (file: File) => {
    setIsLoading(true);
    try {
      const result = await uploadWorkspaceFavicon(file);
      if (workspace) {
        setWorkspace({
          ...workspace,
          settings: {
            ...workspace.settings,
            branding: {
              ...workspace.settings?.branding,
              favicon: result.fileName,
            },
          },
        });
      }
    } catch (error) {
      //
    } finally {
      setIsLoading(false);
    }
  };

  const handleFaviconRemove = async () => {
    setIsLoading(true);
    try {
      await removeWorkspaceFavicon();
      if (workspace) {
        setWorkspace({
          ...workspace,
          settings: {
            ...workspace.settings,
            branding: {
              ...workspace.settings?.branding,
              favicon: null,
            },
          },
        });
      }
    } catch (error) {
      //
    } finally {
      setIsLoading(false);
    }
  };

  const faviconUrl = workspace?.settings?.branding?.favicon ?? undefined;

  return (
    <div style={{ marginBottom: "24px" }}>
      <Text size="sm" fw={500} mb="xs">
        {t("Favicon")}
      </Text>
      <AvatarUploader
        currentImageUrl={faviconUrl}
        fallbackName={workspace?.name}
        type={AvatarIconType.WORKSPACE_FAVICON}
        size="60px"
        radius="sm"
        variant="filled"
        onUpload={handleFaviconUpload}
        onRemove={handleFaviconRemove}
        isLoading={isLoading}
        disabled={!isAdmin}
      />
    </div>
  );
}

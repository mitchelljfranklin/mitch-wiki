import React from "react";
import { Group, Text } from "@mantine/core";
import classes from "./auth.module.css";
import { useWorkspacePublicDataQuery } from "@/features/workspace/queries/workspace-query";
import { getAvatarUrl } from "@/lib/config";
import { AvatarIconType } from "@/features/attachments/types/attachment.types";

type AuthLayoutProps = {
  children: React.ReactNode;
};

export function AuthLayout({ children }: AuthLayoutProps) {
  const { data: workspace } = useWorkspacePublicDataQuery();
  const workspaceName = workspace?.name ?? "Mitch-Wiki";
  const workspaceLogo = workspace?.logo
    ? getAvatarUrl(workspace.logo, AvatarIconType.WORKSPACE_ICON)
    : "/icons/favicon-32x32.png";

  return (
    <>
      <Group justify="center" gap={8} className={classes.logo}>
        <img
          src={workspaceLogo}
          alt={workspaceName}
          width={22}
          height={22}
        />
        <Text size="28px" fw={700} style={{ userSelect: "none" }}>
          {workspaceName}
        </Text>
      </Group>
      <main>{children}</main>
    </>
  );
}

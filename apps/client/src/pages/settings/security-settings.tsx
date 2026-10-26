import SettingsTitle from "@/components/settings/settings-title.tsx";
import { useTranslation } from "react-i18next";
import { DocumentTitle } from "@/components/ui/document-title.tsx";
import { useState } from "react";
import {
  Box,
  Button,
  CopyButton,
  Group,
  Paper,
  Stack,
  Switch,
  Text,
  TextInput,
  PasswordInput,
  ActionIcon,
  Modal,
  Select,
  Badge,
  Code,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import { IconTrash, IconEdit } from "@tabler/icons-react";
import {
  getAuthProviders,
  createAuthProvider,
  updateAuthProvider,
  deleteAuthProvider,
} from "@/features/auth/services/sso-service";
import useUserRole from "@/hooks/use-user-role.tsx";
import { useAtom } from "jotai";
import { workspaceAtom } from "@/features/user/atoms/current-user-atom.ts";
import api from "@/lib/api-client";

const PROVIDER_TYPES: Record<string, string> = {
  oidc: "OpenID Connect",
};

const INITIAL_VALUES = {
  name: "",
  type: "oidc",
  oidcIssuer: "",
  oidcClientId: "",
  oidcClientSecret: "",
  allowSignup: true,
  isEnabled: true,
};

export default function SecuritySettings() {
  const { t } = useTranslation();
  const { isAdmin } = useUserRole();
  const queryClient = useQueryClient();
  const [workspace] = useAtom(workspaceAtom);
  const enforceSso = workspace?.enforceSso ?? false;

  const [modalOpened, { open: openModal, close: closeModal }] =
    useDisclosure(false);
  const [editProviderId, setEditProviderId] = useState<string | null>(null);

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ["auth-providers"],
    queryFn: getAuthProviders,
  });

  const saveMutation = useMutation({
    mutationFn: async (values: typeof INITIAL_VALUES) => {
      if (editProviderId) {
        await updateAuthProvider(editProviderId, values);
      } else {
        await createAuthProvider(values);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth-providers"] });
      notifications.show({
        message: editProviderId
          ? t("SSO provider updated")
          : t("SSO provider created"),
      });
      closeModal();
      form.reset();
      setEditProviderId(null);
    },
    onError: (error: any) => {
      notifications.show({
        message: error?.response?.data?.message ?? t("Failed to save provider"),
        color: "red",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAuthProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth-providers"] });
      notifications.show({ message: t("SSO provider deleted") });
    },
    onError: (error: any) => {
      notifications.show({
        message: error?.response?.data?.message ?? t("Failed to delete provider"),
        color: "red",
      });
    },
  });

  const enforceSsoMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      await api.post("/workspace/update", { enforceSso: enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace"] });
      notifications.show({ message: t("SSO enforcement updated") });
    },
  });

  const form = useForm({
    initialValues: INITIAL_VALUES,
  });

  const handleOpenAdd = () => {
    setEditProviderId(null);
    form.reset();
    openModal();
  };

  const handleOpenEdit = (provider: any) => {
    setEditProviderId(provider.id);
    form.setValues({
      name: provider.name,
      type: provider.type,
      oidcIssuer: provider.oidcIssuer ?? "",
      oidcClientId: provider.oidcClientId ?? "",
      oidcClientSecret: "",
      allowSignup: provider.allowSignup ?? true,
      isEnabled: provider.isEnabled ?? true,
    });
    openModal();
  };

  const handleSubmit = form.onSubmit((values) => {
    saveMutation.mutate(values);
  });

  const isEditing = !!editProviderId;

  if (!isAdmin) {
    return (
      <Text c="dimmed">{t("Only workspace admins can manage SSO settings.")}</Text>
    );
  }

  return (
    <>
      <DocumentTitle title={t("Security & SSO")} />
      <SettingsTitle title={t("Security & SSO")} />

      <Paper withBorder p="md" mb="lg">
        <Group justify="space-between" mb="md">
          <Box>
            <Text fw={500}>{t("SSO Providers")}</Text>
            <Text size="sm" c="dimmed">
              {t("Configure OpenID Connect providers for single sign-on.")}
            </Text>
          </Box>
          <Button onClick={handleOpenAdd} disabled={!isAdmin}>
            {t("Add Provider")}
          </Button>
        </Group>

        {providers.length === 0 && !isLoading && (
          <Text c="dimmed" size="sm">
            {t("No SSO providers configured yet.")}
          </Text>
        )}

        <Stack gap="sm">
          {providers.map((provider) => (
            <Paper key={provider.id} withBorder p="sm">
              <Group justify="space-between" wrap="nowrap">
                <Box>
                  <Group gap="xs">
                    <Text fw={500}>{provider.name}</Text>
                    <Badge size="sm" variant="light">
                      {PROVIDER_TYPES[provider.type] ?? provider.type}
                    </Badge>
                    {provider.isEnabled ? (
                      <Badge size="sm" color="green" variant="light">
                        {t("Enabled")}
                      </Badge>
                    ) : (
                      <Badge size="sm" color="gray" variant="light">
                        {t("Disabled")}
                      </Badge>
                    )}
                  </Group>
                  <Text size="xs" c="dimmed" mt={4}>
                    {provider.oidcIssuer}
                  </Text>
                  <Group gap="xs" mt={4} align="center">
                    <Text size="xs" c="dimmed">
                      {t("Redirect URI")}:
                    </Text>
                    <Code style={{ fontSize: "11px" }}>
                      {window.location.origin}/api/sso/oidc/{provider.id}/callback
                    </Code>
                    <CopyButton
                      value={`${window.location.origin}/api/sso/oidc/${provider.id}/callback`}
                    >
                      {({ copied, copy }) => (
                        <ActionIcon
                          variant="subtle"
                          size="sm"
                          color={copied ? "green" : "gray"}
                          onClick={copy}
                        >
                          {copied ? (
                            <Text size="xs" c="green">{t("Copied")}</Text>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                          )}
                        </ActionIcon>
                      )}
                    </CopyButton>
                  </Group>
                </Box>
                <Group gap="xs">
                  <ActionIcon
                    variant="subtle"
                    color="blue"
                    onClick={() => handleOpenEdit(provider)}
                  >
                    <IconEdit size={16} />
                  </ActionIcon>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    onClick={() => {
                      if (
                        window.confirm(
                          t("Are you sure you want to delete this SSO provider?"),
                        )
                      ) {
                        deleteMutation.mutate(provider.id);
                      }
                    }}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              </Group>
            </Paper>
          ))}
        </Stack>
      </Paper>

      <Paper withBorder p="md">
        <Group justify="space-between" wrap="nowrap">
          <Box>
            <Text fw={500}>{t("Enforce SSO")}</Text>
            <Text size="sm" c="dimmed">
              {t(
                "Require all users to authenticate via SSO. Password login will be disabled.",
              )}
            </Text>
          </Box>
          <Switch
            checked={enforceSso}
            onChange={(event) =>
              enforceSsoMutation.mutate(event.currentTarget.checked)
            }
            disabled={!isAdmin || providers.length === 0}
          />
        </Group>
      </Paper>

      <Modal
        opened={modalOpened}
        onClose={closeModal}
        title={isEditing ? t("Edit SSO Provider") : t("Add SSO Provider")}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput
              label={t("Provider Name")}
              placeholder={t("e.g. Azure AD, Google Workspace")}
              required
              {...form.getInputProps("name")}
            />
            <Select
              label={t("Provider Type")}
              data={[
                { value: "oidc", label: "OpenID Connect" },
              ]}
              required
              {...form.getInputProps("type")}
            />
            <TextInput
              label={t("Issuer URL")}
              placeholder="https://accounts.google.com"
              description={t("The OIDC discovery URL from your identity provider")}
              required
              {...form.getInputProps("oidcIssuer")}
            />
            <TextInput
              label={t("Client ID")}
              required
              {...form.getInputProps("oidcClientId")}
            />
            <PasswordInput
              label={t("Client Secret")}
              required={!isEditing}
              description={isEditing ? t("Leave blank to keep the current secret") : undefined}
              {...form.getInputProps("oidcClientSecret")}
            />
            <Switch
              label={t("Allow automatic sign-up for new users")}
              {...form.getInputProps("allowSignup", { type: "checkbox" })}
            />
            <Switch
              label={t("Enable provider")}
              {...form.getInputProps("isEnabled", { type: "checkbox" })}
            />
            <Group justify="flex-end">
              <Button variant="default" onClick={closeModal}>
                {t("Cancel")}
              </Button>
              <Button type="submit" loading={saveMutation.isPending}>
                {isEditing ? t("Save Changes") : t("Add Provider")}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}

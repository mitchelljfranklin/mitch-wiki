import api from "@/lib/api-client";

export interface AuthProvider {
  id: string;
  name: string;
  type: string;
  oidcIssuer: string;
  oidcClientId: string;
  allowSignup: boolean;
  isEnabled: boolean;
  createdAt: string;
}

export async function getAuthProviders(): Promise<AuthProvider[]> {
  const response = await api.get<AuthProvider[]>("/auth/providers");
  return response.data;
}

export async function createAuthProvider(
  data: Partial<AuthProvider> & { oidcClientSecret?: string },
): Promise<AuthProvider> {
  const response = await api.post<AuthProvider>("/auth/providers", data);
  return response.data;
}

export async function updateAuthProvider(
  id: string,
  data: Partial<AuthProvider> & { oidcClientSecret?: string },
): Promise<AuthProvider> {
  // Strip empty secret so the server keeps the existing one
  const payload = { ...data };
  if (!payload.oidcClientSecret) {
    delete payload.oidcClientSecret;
  }
  const response = await api.put<AuthProvider>(`/auth/providers/${id}`, payload);
  return response.data;
}

export async function deleteAuthProvider(id: string): Promise<void> {
  await api.delete(`/auth/providers/${id}`);
}

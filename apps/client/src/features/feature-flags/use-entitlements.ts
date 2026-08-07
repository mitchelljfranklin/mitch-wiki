import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { Entitlements } from "./entitlement.types";

export function useEntitlements(): UseQueryResult<Entitlements> {
  return useQuery({
    queryKey: ["entitlements"],
    queryFn: () => Promise.resolve({ cloud: false, tier: "free", features: [] } as Entitlements),
    staleTime: Infinity,
    enabled: false,
  });
}

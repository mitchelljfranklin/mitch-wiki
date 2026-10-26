import { useAtomValue } from "jotai";
import { workspaceAtom } from "@/features/user/atoms/current-user-atom";
import { getAppName } from "@/lib/config";

export function usePageTitle(pageTitle: string): string {
  const workspace = useAtomValue(workspaceAtom);
  const appName = workspace?.name ?? getAppName();
  return `${pageTitle} - ${appName}`;
}

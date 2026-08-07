import { useAtomValue } from "jotai";
import { useTranslation } from "react-i18next";
import { workspaceAtom } from "@/features/user/atoms/current-user-atom.ts";
import classes from "./home-ai-prompt.module.css";

export type HomeAiPromptInitialState = {
  initialContent: string;
  initialMentions: any[];
  initialAttachments: any[];
};

export default function HomeAiPrompt() {
  const { t } = useTranslation();
  const workspace = useAtomValue(workspaceAtom);

  const aiChatEnabled = workspace?.settings?.ai?.chat === true;
  if (!aiChatEnabled) return null;

  return (
    <div className={classes.wrapper}>
      <h1 className={classes.heading}>
        {t("Welcome to {{name}}", { name: workspace?.name ?? "Mitch-Wiki" })}
      </h1>
      <div className={classes.subtitle}>
        {t("Ask anything or search your workspace")}
      </div>
    </div>
  );
}

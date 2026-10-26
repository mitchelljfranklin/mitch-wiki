import { useEffect, useState } from "react";
import { useAtomValue } from "jotai";
import {
  pageEditorAtom,
  yjsSyncedAtom,
} from "@/features/editor/atoms/editor-atoms";
import { useHasFeature } from "@/features/feature-flags/use-feature";
import { Feature } from "@/features/feature-flags/features";

type EmptyPageGetStartedProps = {
  pageId: string;
  spaceId: string;
  editable: boolean;
};

export function EmptyPageGetStarted({
  pageId,
  spaceId,
  editable,
}: EmptyPageGetStartedProps) {
  const editor = useAtomValue(pageEditorAtom);
  const isSynced = useAtomValue(yjsSyncedAtom);
  const hasBases = useHasFeature(Feature.BASES);

  const [isEmpty, setIsEmpty] = useState(false);
  useEffect(() => {
    if (!editor) return;
    const sync = () => setIsEmpty(editor.isEmpty);
    sync();
    editor.on("update", sync);
    editor.on("create", sync);
    return () => {
      editor.off("update", sync);
      editor.off("create", sync);
    };
  }, [editor]);

  if (!editable || !hasBases || !editor || !isSynced || !isEmpty) return null;

  return null;
}

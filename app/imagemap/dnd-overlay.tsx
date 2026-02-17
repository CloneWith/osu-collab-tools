import { Ban, Inbox } from "lucide-react";
import { useTranslation } from "react-i18next";

interface DragAndDropOverlayProps {
  isRounded?: boolean;
  rejectReason?: DnDRejectReason;
}

export enum DnDRejectReason {
  // 未知问题
  Unknown,
  // 文件格式不支持
  UnsupportedType,
  // 拖放文件数超限
  TooManyEntries,
}

/**
 * 拖放状态交互显示浮层，仅作视觉提示，逻辑在外部处理。
 * @param isRounded 是否在四角使用圆角
 * @param isDragAccepted `true` 时对应允许放下文件，反之亦然
 * @param rejectReason 拖放被拒绝的原因，用于展示
 */
export default function DragAndDropOverlay({
                                             isRounded = false,
                                             rejectReason = undefined,
                                           }: DragAndDropOverlayProps) {
  const {t} = useTranslation("imagemap");
  const isDragAccepted = rejectReason === undefined;
  let reasonPrompt = t("dnd.dropAccepted");
  let subPrompt: string | null = null;

  if (rejectReason) {
    switch (rejectReason) {
      case DnDRejectReason.UnsupportedType:
        reasonPrompt = t("dnd.unsupportedType");
        subPrompt = t("dnd.supportedTypeHint");
        break;
      case DnDRejectReason.TooManyEntries:
        reasonPrompt = t("dnd.tooManyEntries");
        subPrompt = t("dnd.entriesHint");
        break;
      default:
        reasonPrompt = t("dnd.disallowed");
        break;
    }
  }

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-40 grid place-items-center backdrop-blur-md
                        ${isRounded && "rounded-md"}
                        ${isDragAccepted ? "bg-primary/20" : "bg-destructive/20"}`}>
      <div className="text-center">
        {isDragAccepted ? <Inbox className="w-10 h-10 mx-auto mb-3 text-primary"/>
          : <Ban className="w-10 h-10 mx-auto mb-3 text-destructive"/>}

        <p className="font-semibold">
          {reasonPrompt}
        </p>
        {!isDragAccepted && subPrompt != null && <p className="text-sm">{subPrompt}</p>}
      </div>
    </div>
  );
}
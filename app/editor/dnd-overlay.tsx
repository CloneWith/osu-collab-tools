import { Ban, Inbox } from "lucide-react";

interface DragAndDropOverlayProps {
  isDragAccepted?: boolean;
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
 * @param isDragAccepted `true` 时对应允许放下文件，反之亦然
 * @param rejectReason 拖放被拒绝的原因，用于展示
 */
export default function DragAndDropOverlay({
                                             isDragAccepted,
                                             rejectReason = DnDRejectReason.Unknown,
                                           }: DragAndDropOverlayProps) {
  let reasonPrompt = "不允许该操作";
  let subPrompt: string | null = null;

  switch (rejectReason) {
    case DnDRejectReason.UnsupportedType:
      reasonPrompt = "不支持的格式";
      subPrompt = "拖拽图像进行上传";
      break;
    case DnDRejectReason.TooManyEntries:
      reasonPrompt = "文件过多";
      subPrompt = "只允许拖放单个图像文件";
      break;
  }

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-40 grid place-items-center border-2 border-dashed backdrop-blur-md
                        ${isDragAccepted ? "bg-primary/20 border-primary" : "bg-destructive/20 border-destructive"}`}>
      <div className="text-center">
        {isDragAccepted ? <Inbox className="w-10 h-10 mx-auto mb-3 text-primary"/>
          : <Ban className="w-10 h-10 mx-auto mb-3 text-destructive"/>}

        <p className="font-semibold">
          {isDragAccepted ? "释放以上传图片" : reasonPrompt}
        </p>
        {!isDragAccepted && subPrompt != null && <p className="text-sm">{subPrompt}</p>}
      </div>
    </div>
  );
}
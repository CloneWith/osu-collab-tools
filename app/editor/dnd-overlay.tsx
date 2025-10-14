import { Ban, Inbox } from "lucide-react";

interface DragAndDropOverlayProps {
  isDragAccepted?: boolean;
}

/**
 * 拖放状态交互显示浮层，仅作视觉提示，逻辑在外部处理。
 * @param isDragAccepted `true` 时对应允许放下文件，反之亦然
 */
export default function DragAndDropOverlay({isDragAccepted}: DragAndDropOverlayProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 z-40 grid place-items-center border-2 border-dashed backdrop-blur-md
                        ${isDragAccepted ? "bg-primary/20 border-primary" : "bg-destructive/20 border-destructive"}`}>
      <div className="text-center">
        {isDragAccepted ? <Inbox className="w-10 h-10 mx-auto mb-3 text-primary"/>
          : <Ban className="w-10 h-10 mx-auto mb-3 text-destructive"/>}

        <p className="font-medium">
          {isDragAccepted ? "释放以上传图片" : "不支持的格式"}
        </p>
      </div>
    </div>
  );
}
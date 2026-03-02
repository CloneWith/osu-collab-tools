import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Check, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { isNullOrWhitespace } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

export interface SaveDialogProps {
  open: boolean;
  baseName: string;
  onOpenChange: (open: boolean) => void;
  onSave: (options: { format: string; quality: number }) => Promise<string | null>;
}

const SaveDialog: React.FC<SaveDialogProps> = ({ open, baseName, onOpenChange, onSave }) => {
  const { toast } = useToast();

  const [filename, setFilename] = React.useState("export");
  const [format, setFormat] = React.useState("image/png");
  const [quality, setQuality] = React.useState(90);

  const [service, setService] = React.useState("imgur");
  const [token, setToken] = React.useState("");

  const [isWorking, setIsWorking] = React.useState(false);
  const [isSaving, startSaveTransition] = React.useTransition();
  const [isUploading, startUploadTransition] = React.useTransition();

  // TODO: 修改为正确的状态
  const [uploadResult, setUploadResult] = React.useState<string | null>(null);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  const handleSave = async () => {
    setIsWorking(true);

    startSaveTransition(async () => {
      try {
        const result = await onSave({
          format,
          quality,
        });

        if (result) {
          // 创建下载链接
          const link = document.createElement("a");
          const extension = format.split("/")[1];

          link.href = result;
          link.download = !isNullOrWhitespace(filename)
            ? `${filename}.${extension}`
            : `exported-${baseName}-${Date.now()}.${extension}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } catch (error) {
        toast({
          title: "保存失败",
          description: error instanceof Error ? error.message : "未知错误",
          variant: "destructive",
        });
      }
    });

    setIsWorking(false);
  };

  const handleUpload = async () => {
    if (!token) return;

    setIsWorking(true);
    setUploadResult(null);
    setUploadError(null);

    startUploadTransition(async () => {
      try {
        const result = await onSave({
          format,
          quality,
        });

        if (result) {
          setUploadResult(result);
          if (true) {
            toast({
              title: "上传成功",
              description: "图像已成功上传到文件托管服务",
            });
          }
        }
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : "上传失败");
        toast({
          title: "上传失败",
          description: error instanceof Error ? error.message : "未知错误",
          variant: "destructive",
        });
      }
    });

    setIsWorking(false);
  };

  const handleCopyResult = () => {
    if (uploadResult) {
      navigator.clipboard.writeText(uploadResult).then(() => {
        toast({
          title: "已复制",
          description: "链接已复制到剪贴板",
        });
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-200 max-h-[80%] overflow-y-scroll">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            保存图像
          </DialogTitle>
          <DialogDescription>选择保存图像到本地或上传到文件托管服务</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="filename">文件名</Label>
            <Input id="filename" value={filename} onChange={(e) => setFilename(e.target.value)}></Input>
          </div>

          <div className="space-y-2">
            <Label htmlFor="format">导出格式</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger id="format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="image/png">PNG</SelectItem>
                <SelectItem value="image/jpg">JPG</SelectItem>
                <SelectItem value="image/webp">WebP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {format !== "image/png" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="quality">图像质量</Label>
                <Label>{quality}%</Label>
              </div>
              <Slider
                id="quality"
                min={60}
                defaultValue={[100]}
                max={100}
                value={[quality]}
                onValueChange={(e) => setQuality(e[0])}
              ></Slider>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">本地保存</CardTitle>
              <CardDescription>将图片保存到本地</CardDescription>
              <CardAction>
                <Button onClick={handleSave} disabled={isWorking || isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      处理中...
                    </>
                  ) : (
                    "保存"
                  )}
                </Button>
              </CardAction>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">上传到图床</CardTitle>
              <CardDescription>将图片上传到托管服务以便后续使用</CardDescription>
              <CardAction>
                <Button onClick={handleUpload} disabled={true || isWorking || !token || isUploading}>
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      处理中...
                    </>
                  ) : (
                    "上传"
                  )}
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTitle>注意</AlertTitle>
                <AlertDescription>上传功能开发中</AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SaveDialog;

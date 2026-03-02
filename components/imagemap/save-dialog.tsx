import * as React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Check, AlertCircle, Loader2, Camera, CloudUpload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { isNullOrWhitespace } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { validateFilename } from "@/lib/validation";
import { useTranslations } from "next-intl";

export interface SaveDialogProps {
  open: boolean;
  baseName: string;
  onOpenChange: (open: boolean) => void;
  onSave: (options: { format: string; quality: number }) => Promise<string | null>;
}

const SaveDialog: React.FC<SaveDialogProps> = ({ open, baseName, onOpenChange, onSave }) => {
  const t = useTranslations("imagemap.save");
  const tc = useTranslations("common");
  const tv = useTranslations("common.validation");
  const { toast } = useToast();

  const [filename, setFilename] = React.useState("");
  const [format, setFormat] = React.useState("image/png");
  const [quality, setQuality] = React.useState(90);

  const extension = format.split("/")[1];
  const defaultName = `exported-${baseName}-${Date.now()}`;

  const filenameValidation = React.useMemo(() => validateFilename(filename || defaultName + extension), [filename]);

  const [service, setService] = React.useState("imgur");
  const [token, setToken] = React.useState("");

  const [isWorking, setIsWorking] = React.useState(false);
  const [isSaving, startSaveTransition] = React.useTransition();
  const [isUploading, startUploadTransition] = React.useTransition();

  // TODO: 修改为正确的状态
  const [uploadResult, setUploadResult] = React.useState<string | null>(null);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  const handleSave = async () => {
    if (!filenameValidation.success) {
      toast({
        title: tv(filenameValidation.messageKey ?? "filenameInvalid"),
        variant: "destructive",
      });
      return;
    }

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

          link.href = result;
          link.download = `${!isNullOrWhitespace(filename) ? filename : defaultName}.${extension}`;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-200 max-h-[80%] overflow-y-scroll">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            {t("title")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="filename">{t("filename")}</Label>
            <Input
              id="filename"
              value={filename}
              aria-invalid={!filenameValidation.success}
              className={!filenameValidation.success ? "border-yellow-600" : ""}
              onChange={(e) => setFilename(e.target.value)}
              placeholder={defaultName}
            ></Input>
            {!filenameValidation.success && filenameValidation.messageKey && (
              <p className="text-sm text-yellow-600">{tv(filenameValidation.messageKey)}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="format">{t("imageFormat")}</Label>
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
                <Label htmlFor="quality">{t("quality")}</Label>
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
              <CardTitle className="text-lg">{t("saveLocally")}</CardTitle>
              <CardDescription>{t("saveLocallyDescription")}</CardDescription>
              <CardAction>
                <Button onClick={handleSave} disabled={isWorking || isSaving || !filenameValidation.success}>
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {tc("wait")}
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      {tc("save")}
                    </>
                  )}
                </Button>
              </CardAction>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("upload")}</CardTitle>
              <CardDescription>{t("uploadDescription")}</CardDescription>
              <CardAction>
                <Button onClick={handleUpload} disabled={true || isWorking || !token || isUploading}>
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {tc("wait")}
                    </>
                  ) : (
                    <>
                      <CloudUpload className="w-4 h-4" />
                      {tc("upload")}
                    </>
                  )}
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertDescription>{tc("wip.description")}</AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SaveDialog;

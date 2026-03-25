import * as React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Loader2, Camera, CloudUpload, CloudCheck, CloudAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { isNullOrWhitespace } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { validateFilename } from "@/lib/validation";
import { useTranslations } from "next-intl";
import { CopyButton } from "../ui/copy-button";

export interface SaveDialogProps {
  open: boolean;
  baseName: string;
  onOpenChange: (open: boolean) => void;
  onSave: (options: { format: string; quality: number }) => Promise<string | null>;
}

const infoLinks: Record<string, string> = {
  "s-ul": "https://s-ul.eu/account/info",
};

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

  const filenameValidation = React.useMemo(() => validateFilename(filename || defaultName + extension), [filename, defaultName, extension]);

  const [service, setService] = React.useState("s-ul");
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
          // 处理s-ul上传
          if (service === "s-ul") {
            const response = await fetch(result);
            const blob = await response.blob();

            const formData = new FormData();
            formData.append("file", blob, `image.${extension}`);
            formData.append("key", token);
            formData.append("service", service);

            const uploadResponse = await fetch(`/api/upload/${service}`, {
              method: "POST",
              body: formData,
            });

            const uploadData = await uploadResponse.json();

            console.log(uploadResponse);

            if (uploadData.success === false) {
              setUploadError(uploadData.reason || t("uploadFailed"));
              toast({
                title: t("uploadFailed"),
                description: uploadData.reason || t("uploadFailed"),
                variant: "destructive",
              });
            } else if (uploadData.url) {
              setUploadResult(uploadData.url);
              toast({
                title: t("uploadSuccess"),
                description: t("uploadSuccessDescription"),
              });
            } else {
              setUploadError(t("uploadFailed"));
              toast({
                title: t("uploadFailed"),
                description: t("uploadFailed"),
                variant: "destructive",
              });
            }
          }
        }
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : t("uploadFailed"));
        toast({
          title: t("uploadFailed"),
          description: error instanceof Error ? error.message : t("uploadFailed"),
          variant: "destructive",
        });
      } finally {
        setIsWorking(false);
      }
    });
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
                <SelectItem value="image/jpeg">JPG</SelectItem>
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
                <Button onClick={handleUpload} disabled={isWorking || !token || isUploading}>
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
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="service">{t("service")}</Label>
                <Select value={service} onValueChange={setService}>
                  <SelectTrigger id="service">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="s-ul">s-ul</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="token">{t("apiKey")}</Label>
                <div className="text-sm text-muted-foreground">
                  <div>{t("apiKeyPrompt")}</div>
                  <div>
                    {t.rich("apiKeyGuide", {
                      infoPageLink: (link) => (
                        <a href={infoLinks[service]} className="doc-link">
                          {link}
                        </a>
                      ),
                    })}
                  </div>
                </div>
                <Input id="token" value={token} onChange={(e) => setToken(e.target.value)}></Input>
              </div>
              {uploadResult && (
                <Alert variant="success">
                  <AlertTitle className="flex items-center gap-2 text-lg">
                    <CloudCheck />
                    {t("uploadSuccess")}
                  </AlertTitle>
                  <AlertDescription>
                    {t("uploadSuccessDescription")}
                    <div className="flex items-center gap-2">
                      <Input value={uploadResult} readOnly />
                      <CopyButton text={uploadResult} variant="default" />
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              {uploadError && (
                <Alert variant="destructive">
                  <AlertTitle className="flex items-center gap-2 text-lg">
                    <CloudAlert />
                    {t("uploadFailed")}
                  </AlertTitle>
                  <AlertDescription>{uploadError}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SaveDialog;

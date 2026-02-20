import * as React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Upload, Check, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface SaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (options: {
    type: "local" | "upload";
    format: string;
    quality: number;
    service?: string;
    token?: string;
  }) => Promise<string | null>;
}

const SaveDialog: React.FC<SaveDialogProps> = ({ open, onOpenChange, onSave }) => {
  const [activeTab, setActiveTab] = React.useState("local");
  const [format, setFormat] = React.useState("png");
  const [quality, setQuality] = React.useState(90);
  const [service, setService] = React.useState("imgur");
  const [token, setToken] = React.useState("");
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadResult, setUploadResult] = React.useState<string | null>(null);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const { toast } = useToast();

  const handleSave = async () => {
    if (activeTab === "upload" && !token) {
      toast({
        title: "缺少 API Token",
        description: "请输入 API Token 后再尝试上传",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadResult(null);
    setUploadError(null);

    try {
      const result = await onSave({
        type: activeTab as "local" | "upload",
        format,
        quality,
        service,
        token,
      });

      if (result) {
        setUploadResult(result);
        if (activeTab === "upload") {
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
    } finally {
      setIsUploading(false);
    }
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
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            保存图像
          </DialogTitle>
          <DialogDescription>
            选择保存图像到本地或上传到文件托管服务
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          {/* Left sidebar tabs */}
          <div className="md:col-span-1">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="flex flex-col w-full">
                <TabsTrigger value="local" className="justify-start gap-2">
                  <Download className="w-4 h-4" />
                  本地保存
                </TabsTrigger>
                <TabsTrigger value="upload" className="justify-start gap-2">
                  <Upload className="w-4 h-4" />
                  上传到托管服务
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Right content area */}
          <div className="md:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsContent value="local" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="format">导出格式</Label>
                  <Select value={format} onValueChange={setFormat}>
                    <SelectTrigger id="format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="png">PNG</SelectItem>
                      <SelectItem value="jpg">JPG</SelectItem>
                      <SelectItem value="webp">WebP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quality">图像质量 ({quality}%)</Label>
                  <Input
                    id="quality"
                    type="range"
                    min="0"
                    max="100"
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                  />
                </div>

                <p className="text-sm text-muted-foreground">
                  选择适合您需求的格式和质量。PNG 提供无损压缩，适合需要透明背景的图像；JPG 和 WebP 提供更好的压缩率，适合照片。
                </p>
              </TabsContent>

              <TabsContent value="upload" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="service">托管服务</Label>
                  <Select value={service} onValueChange={setService}>
                    <SelectTrigger id="service">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="imgur">Imgur</SelectItem>
                      <SelectItem value="imgbb">ImgBB</SelectItem>
                      <SelectItem value="custom">自定义 API</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="token">API Token</Label>
                  <Input
                    id="token"
                    type="password"
                    placeholder="输入 API Token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                  />
                </div>

                <p className="text-sm text-muted-foreground">
                  请输入您选择的文件托管服务的 API Token。如果您还没有 Token，请访问相应服务的网站注册并获取。
                </p>

                {uploadResult && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-500 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">上传成功</h4>
                          <p className="text-sm text-muted-foreground mb-2">图像已成功上传到 {service}。</p>
                          <div className="flex items-center gap-2">
                            <Input
                              type="text"
                              value={uploadResult}
                              readOnly
                              className="flex-1"
                            />
                            <Button
                              size="sm"
                              onClick={handleCopyResult}
                            >
                              复制
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {uploadError && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium mb-1">上传失败</h4>
                          <p className="text-sm text-muted-foreground">{uploadError}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button
            onClick={handleSave}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                处理中...
              </>
            ) : activeTab === "local" ? (
              "保存到本地"
            ) : (
              "上传到托管服务"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveDialog;
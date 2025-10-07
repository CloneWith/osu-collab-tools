import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Code, MousePointer, Move } from "lucide-react"

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">使用
              <span className="text-primary">文档</span>
          </h1>
          <p className="text-secondary-foreground">了解如何使用 ImageMap Studio 创建图片地图</p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                快速开始
              </CardTitle>
              <CardDescription>几分钟内创建您的第一个图片地图</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">1. 上传图片</h3>
                <p className="text-secondary-foreground">点击"上传图片"按钮，选择您要创建地图的图片文件。</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">2. 选择工具</h3>
                <p className="text-secondary-foreground">使用工具栏选择合适的编辑工具：选择、移动、创建或删除。</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">3. 创建区域</h3>
                <p className="text-secondary-foreground">使用创建工具在图片上拖拽创建矩形区域。</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">4. 设置属性</h3>
                <p className="text-secondary-foreground">为每个区域设置链接地址和描述文本。</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">5. 复制代码</h3>
                <p className="text-secondary-foreground">点击"复制代码"按钮获取生成的HTML代码。</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MousePointer className="w-5 h-5" />
                工具说明
              </CardTitle>
              <CardDescription>了解各种编辑工具的用法</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MousePointer className="w-4 h-4" />
                    选择工具
                  </h3>
                  <p className="text-secondary-foreground">用于选择和查看现有区域的属性。</p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Move className="w-4 h-4" />
                    移动工具
                  </h3>
                  <p className="text-secondary-foreground">拖拽移动已创建的区域到新位置。</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                HTML 代码使用
              </CardTitle>
              <CardDescription>如何在您的网站中使用生成的代码</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">代码结构</h3>
                <p className="text-secondary-foreground">
                  生成的代码包含一个 <code className="bg-primary/50 px-1 rounded">&lt;img&gt;</code> 标签和一个{" "}
                  <code className="bg-primary/50 px-1 rounded">&lt;map&gt;</code> 标签。
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">使用步骤</h3>
                <ol className="list-decimal list-inside space-y-1 text-secondary-foreground">
                  <li>将生成的HTML代码复制到您的网页中</li>
                  <li>将 "your-image.jpg" 替换为您的实际图片路径</li>
                  <li>确保图片文件已上传到您的服务器</li>
                  <li>测试各个区域的链接是否正常工作</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Code, MousePointer, Map, Square, Trash2, Keyboard } from "lucide-react";

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">使用
            <span className="text-primary">文档</span>
          </h1>
          <p className="text-secondary-foreground">了解如何使用 Collab Tools</p>
        </div>

        <div className="space-y-8">
          {/* Section - 站点简介 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5"/>
                简介
              </CardTitle>
              <CardDescription>关于本网站/工具</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>Collab Tools 是一个专门为 osu! 好友面基 / Collab（实际上用途会更广泛）制作的工具集网站。</p>
              <p>其实在这之前，有很多相关的功能已有其他工具或项目实现了，但我依然选择去尝试做一下，原因如下：</p>
              <ul className="list-disc list-inside space-y-1 text-secondary-foreground">
                <li>灵活：作为 Next.js
                  构建的前端项目，各平台只需浏览器访问即可使用，同时也支持自部署，简单快速；
                </li>
                <li>安全：不想让除 Collab 成员以外的其他人知道？没问题！</li>
                <li>集成：从小功能开始，逐步实现覆盖 Collab 流程的各步骤；</li>
              </ul>
              <p>该项目的源代码可在 <a href="https://github.com/CloneWith/osu-collab-tools"
                                       className="doc-link">GitHub</a> 上查看，在此期待各位的反馈或贡献~
              </p>
            </CardContent>
          </Card>

          {/* Section - ImageMap Editor */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Map className="w-5 h-5"/>
                ImageMap 编辑器
              </CardTitle>
              <CardDescription>快速制作映射图</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p>
                  osu! 的个人资料有对 ImageMap（图片映射）的
                  <a href="https://osu.ppy.sh/wiki/BBCode" className="doc-link">BBCode (osu! wiki)</a>
                  支持，但图像中各个区域的位置与大小依然需要手动定义。
                </p>
                <p>
                  目前在制作 ImageMap
                  时，多数用户会选择使用图像编辑器，结合区域四角的坐标进行计算；或者用浏览器的开发者工具辅助定位映射区域，在区域较多的情况下会比较困难，同时需要相当一段时间精确调节各种参数。
                </p>
                <p>
                  你可以使用本工具提供的交互界面，在短时间内以“所见即所得”的方式轻松制作 ImageMap。
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">1. 上传图片</h3>
                <p className="text-secondary-foreground">点击"上传图片"按钮，选择需要使用的图片文件。</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">2. 管理区域</h3>
                <p className="text-secondary-foreground inline-flex items-center">
                  使用以下工具在图片上创建、更改或删除矩形区域：
                </p>

                {/* Part - 工具用法说明 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2 text-primary">
                      <MousePointer className="w-4 h-4"/>
                      选择工具
                    </h3>
                    <p
                      className="text-secondary-foreground">点击选中现有区域，查看并编辑其对应属性，并进行移动、大小调整。</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2 text-primary">
                      <Square className="w-4 h-4"/>
                      创建工具
                    </h3>
                    <p className="text-secondary-foreground">在预览区拖动创建新的区域。</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2 text-primary">
                      <Trash2 className="w-4 h-4"/>
                      删除工具
                    </h3>
                    <p className="text-secondary-foreground">点击删除已定义的区域。</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">3. 设置属性</h3>
                <p className="text-secondary-foreground">为每个区域设置链接地址和描述文本，也可继续调整位置与大小。</p>
                <p className="text-secondary-foreground">所有区域在<b>区域列表</b>中统一显示，可以拖动左侧的控制柄调整所在层级。
                </p>
                <p className="text-secondary-foreground">与此同时，你可以在<b>图像属性</b>中修改要使用的图像地址与
                  ImageMap 名称（这个名称只会在 HTML 代码中用到），以便生成的代码直接使用这些属性。</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">4. 复制代码</h3>
                <p className="text-secondary-foreground">点击“复制代码”按钮，按需获取生成的 HTML 或
                  BBCode 代码。</p>
              </div>
            </CardContent>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5"/>
                使用生成的代码
              </CardTitle>
              <CardDescription>在个人资料或其他地方使用</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">在其他网站使用 ImageMap 前，需要先将图像上传到支持的平台（图床）。
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">使用 BBCode</h3>
                <ol className="list-decimal list-inside space-y-1 text-secondary-foreground">
                  <li>粘贴代码到资料编辑区；</li>
                  <li>将生成代码中的 <code
                    className="bg-primary/50 px-1 rounded">图像链接</code> 替换为实际上传图像的链接；
                  </li>
                  <li>预览资料，测试 ImageMap 是否正常显示，各区域是否对应正确——大功告成！</li>
                </ol>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">使用 HTML</h3>
                <ol className="list-decimal list-inside space-y-1 text-secondary-foreground">
                  <li>粘贴 HTML 代码，其应包含 <code
                    className="bg-primary/50 px-1 rounded">&lt;img&gt;</code> 与{" "}
                    <code className="bg-primary/50 px-1 rounded">&lt;map&gt;</code> 两个标签；
                  </li>
                  <li>按需修改 <code
                    className="bg-primary/50 px-1 rounded">src</code>（图像链接）与 <code
                    className="bg-primary/50 px-1 rounded">alt</code>（图像备注）属性；
                  </li>
                  <li>预览页面并进行测试——大功告成！</li>
                </ol>
              </div>
            </CardContent>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Keyboard className="w-5 h-5"/>
                快捷键
              </CardTitle>
              <CardDescription>ImageMap 编辑器支持使用键盘按键快速进行一些操作。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">全局</h3>
                <ul className="list-disc list-inside space-y-1 text-secondary-foreground">
                  <li><b><kbd>Alt</kbd> + 数字键</b>：切换编辑模式（按从 1 开始的对应数字序）</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">选定区域时</h3>
                <ul className="list-disc list-inside space-y-1 text-secondary-foreground">
                  <li><b><kbd>Del</kbd></b>：删除选定区域</li>
                  <li><b><kbd>Ctrl</kbd> + <kbd>D</kbd></b>：创建副本</li>
                  <li><b><kbd>-</kbd> / <kbd>=</kbd></b>：移至下层/上层</li>
                  <li><b>方向键</b>：移动选定区域</li>
                  <ul className="pl-5 list-disc list-inside space-y-1 text-secondary-foreground">
                    <li><b>同时按下 <kbd>Shift</kbd></b>：精细移动（每次 1 像素）</li>
                    <li><b>同时按下 <kbd>Ctrl</kbd></b>：快速移动（每次 20 像素）</li>
                  </ul>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

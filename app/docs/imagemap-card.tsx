import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code, Hash, Info, Keyboard, Map, MousePointer, Square, Trash2, TriangleAlert, UserRound } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ImagemapDocCard() {
  return (
    <Card id="imagemap">
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
          <Alert>
            <AlertTitle className="flex-title">
              <Info />
              <span>小提示</span>
            </AlertTitle>
            <AlertDescription>
              你可以利用<b>用户信息</b>字段快速填入链接。在填入用户的 ID 或用户名后：
              <ul className="list-disc list-inside space-y-1">
                <li>使用 <Hash className="inline-block w-4 h-4"/> <b>作为 ID 填入</b> 填入对应 UID 的资料链接；</li>
                <li>使用 <UserRound className="inline-block w-4 h-4"/> <b>作为用户名填入</b> 填入对应用户名的资料链接。</li>
              </ul>
            </AlertDescription>
          </Alert>
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
              className="inline-code">图像链接</code> 替换为实际上传图像的链接；
            </li>
            <li>预览资料，测试 ImageMap 是否正常显示，各区域是否对应正确——大功告成！</li>
          </ol>
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold">使用 HTML</h3>
          <ol className="list-decimal list-inside space-y-1 text-secondary-foreground">
            <li>粘贴 HTML 代码，其应包含 <code className="inline-code">&lt;img&gt;</code> 与{" "}
              <code className="inline-code">&lt;map&gt;</code> 两个标签；
            </li>
            <li>按需修改 <code className="inline-code">src</code>（图像链接）与 <code
              className="inline-code">alt</code>（图像备注）属性；
            </li>
            <li>预览页面并进行测试——大功告成！</li>
          </ol>
        </div>
      </CardContent>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="w-5 h-5"/>
          导入与导出配置
        </CardTitle>
        <CardDescription>保存或恢复工作</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="warning">
          <AlertTitle className="flex-title">
            <TriangleAlert />
            <span>注意</span>
          </AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              <li>导出编辑器配置时，编辑的图像<b>不会</b>随之导出，导入时也是如此。因此在导入配置前，请确保加载了适合的图像。</li>
              <li>从配置导入更改时，已有区域<b>会被覆盖</b>，配置文件中已有的设置会<b>覆盖</b>现有值。</li>
            </ul>
          </AlertDescription>
        </Alert>
        <div className="space-y-2">
          支持将当前的编辑器配置导出为 JSON，或从 JSON 导入。导出的 JSON 含有 Imagemap 的所有基本信息，以及已定义的区域信息。
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
  );
}
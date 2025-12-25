import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FlaskRound, Info, UserRound } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AvatarDocCard() {
  return (
    <Card id="avatar">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserRound className="w-5 h-5"/>
          头像卡片生成工具
        </CardTitle>
        <CardDescription>生成各种样式的用户头像卡片</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <p>该功能受到众多 osu! 机器人的启发，所在群用户可以使用一条短小精悍的命令生成用户卡片。
          不过如果恰巧没法接触到部署这个功能的实例，或者单纯不想让群里的其他人知道这事...可能会有些麻烦。
        </p>
        <p>为了避免如此尴尬，你可以试试用此工具<del>偷偷</del>生成点 Collab 成员的小卡片——欸嘿嘿，不要告诉他们哦。</p>
        <Alert variant="information">
          <AlertTitle className="flex-title">
            <FlaskRound />
            <span>实验性功能</span>
          </AlertTitle>
          <AlertDescription>
            <p>该工具尚处于活跃开发阶段，可能会出现意料之外的大变动，敬请留意。</p>
          </AlertDescription>
        </Alert>
        <Alert>
          <AlertTitle className="flex-title">
            <Info />
            <span>小提示</span>
          </AlertTitle>
          <AlertDescription>
            <p>该工具生成的卡片样式未必与 osu! 机器人的输出完全相同，因为二者在代码上没有任何关系。</p>
            <p>如果你想对现有样式做些改善，或者有新的想法，欢迎到项目仓库页提交 Issue 或 PR 做出贡献。</p>
          </AlertDescription>
        </Alert>
        <p>为了生成头像卡片，你需要：</p>
        <ul className="list-decimal list-inside space-y-1 text-secondary-foreground">
          <li>用户的头像链接，对于 osu! 官服应该类似于 <code className="inline-code">https://a.ppy.sh/&lt;用户 ID&gt;</code>；</li>
          <li>用户名；</li>
          <li>如有需要，可以填写两位国家/地区码，在卡片中显示国家/地区旗；</li>
          <li>选择样式、预览生成的卡片、下载图像——大功告成！</li>
        </ul>
      </CardContent>
    </Card>
  )
}
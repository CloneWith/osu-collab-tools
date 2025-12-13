import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { common } from "@/app/common";

export default function InfoDocCard() {
  return (
    <Card id="info">
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
        <p>该项目的源代码可在 <a href={common.repoUrl}
                                 className="doc-link">GitHub</a> 上查看，在此期待各位的反馈或贡献~
        </p>
      </CardContent>
    </Card>
  )
}
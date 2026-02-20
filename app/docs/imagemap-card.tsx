import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Code,
  Hash,
  Info,
  Keyboard,
  Map,
  MousePointer,
  Square,
  Trash2,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { useTranslations } from "next-intl";

export default function ImagemapDocCard() {
  const t = useTranslations("docs.imagemap");

  return (
    <Card id="imagemap">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Map className="w-5 h-5"/>
          {t("title")}
        </CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p>{t.rich("intro.0", {
            bbcodeLink: (text) => <a href="https://osu.ppy.sh/wiki/BBCode" className="doc-link">{text}</a>,
          })}</p>
          <p>{t("intro.1")}</p>
          <p>{t("intro.2")}</p>
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold">{t("steps.upload.title")}</h3>
          <p className="text-secondary-foreground">{t("steps.upload.description")}</p>
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold">{t("steps.manage.title")}</h3>
          <p className="text-secondary-foreground inline-flex items-center">
            {t("steps.manage.description")}
          </p>

          {/* Part - 工具用法说明 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2 text-primary">
                <MousePointer className="w-4 h-4"/>
                {t("steps.manage.tools.select.title")}
              </h3>
              <p className="text-secondary-foreground">{t("steps.manage.tools.select.description")}</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2 text-primary">
                <Square className="w-4 h-4"/>
                {t("steps.manage.tools.create.title")}
              </h3>
              <p className="text-secondary-foreground">{t("steps.manage.tools.create.description")}</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2 text-primary">
                <UserRound className="w-4 h-4"/>
                {t("steps.manage.tools.avatar.title")}
              </h3>
              <p className="text-secondary-foreground">{t("steps.manage.tools.avatar.description")}</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2 text-primary">
                <Trash2 className="w-4 h-4"/>
                {t("steps.manage.tools.delete.title")}
              </h3>
              <p className="text-secondary-foreground">{t("steps.manage.tools.delete.description")}</p>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold">{t("steps.properties.title")}</h3>
          <p className="text-secondary-foreground">{t("steps.properties.description.0")}</p>
          <p className="text-secondary-foreground">{t("steps.properties.description.1")}</p>
          <Alert>
            <AlertTitle className="flex-title">
              <Info/>
              <span>{t("steps.properties.tip.title")}</span>
            </AlertTitle>
            <AlertDescription>
              <p>{t.rich("steps.properties.tip.description.0", {b: (text) => <b>{text}</b>})}</p>
              <ul className="list-disc list-inside space-y-1">
                <li>{t.rich("steps.properties.tip.description.1", {
                  button: () => <Hash className="inline-block w-4 h-4"/>,
                })}</li>
                <li>{t.rich("steps.properties.tip.description.2", {
                  button: () => <UserRound className="inline-block w-4 h-4"/>,
                })}</li>
              </ul>
            </AlertDescription>
          </Alert>
          <p className="text-secondary-foreground">{t.rich("steps.properties.layers", {b: (text) => <b>{text}</b>})}</p>
          <p className="text-secondary-foreground">{t.rich("steps.properties.imageProps", {b: (text) => <b>{text}</b>})}</p>
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold">{t("steps.code.title")}</h3>
          <p className="text-secondary-foreground">{t("steps.code.description")}</p>
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold">{t("steps.export.title")}</h3>
          <p className="text-secondary-foreground">{t("steps.export.description")}</p>
        </div>
      </CardContent>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="w-5 h-5"/>
          {t("usage.title")}
        </CardTitle>
        <CardDescription>{t("usage.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTitle className="flex-title">
            <Info/>
            <span>{t("usage.preview.title")}</span>
          </AlertTitle>
          <AlertDescription>
            {t("usage.preview.description")}
          </AlertDescription>
        </Alert>
        <div className="space-y-2">{t("usage.hosting")}</div>
        <div className="space-y-2">
          <h3 className="font-semibold">{t("usage.bbcode.title")}</h3>
          <ol className="list-decimal list-inside space-y-1 text-secondary-foreground">
            <li>{t("usage.bbcode.steps.0")}</li>
            <li>{t("usage.bbcode.steps.1")}</li>
            <li>{t("usage.bbcode.steps.2")}</li>
          </ol>
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold">{t("usage.html.title")}</h3>
          <ol className="list-decimal list-inside space-y-1 text-secondary-foreground">
            <li>{t.rich("usage.html.steps.0", {
              imgTag: () => <code className="inline-code">&lt;img&gt;</code>,
              mapTag: () => <code className="inline-code">&lt;map&gt;</code>,
            })}</li>
            <li>{t.rich("usage.html.steps.1", {
              srcAttr: () => <code className="inline-code">src</code>,
              altAttr: () => <code className="inline-code">alt</code>,
            })}</li>
            <li>{t("usage.html.steps.2")}</li>
          </ol>
        </div>
      </CardContent>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="w-5 h-5"/>
          {t("importExport.title")}
        </CardTitle>
        <CardDescription>{t("importExport.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="warning">
          <AlertTitle className="flex-title">
            <TriangleAlert/>
            <span>{t("importExport.warning.title")}</span>
          </AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              <li>{t.rich("importExport.warning.description.0", {b: (text) => <b>{text}</b>})}</li>
              <li>{t.rich("importExport.warning.description.1", {b: (text) => <b>{text}</b>})}</li>
              <li>{t.rich("importExport.warning.description.2", {b: (text) => <b>{text}</b>})}</li>
            </ul>
          </AlertDescription>
        </Alert>
        <div className="space-y-2">
          <li>{t("importExport.content.0")}</li>
          <li>{t("importExport.content.1")}</li>
        </div>
      </CardContent>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Keyboard className="w-5 h-5"/>
          {t("shortcuts.title")}
        </CardTitle>
        <CardDescription>{t("shortcuts.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="font-semibold">{t("shortcuts.global.title")}</h3>
          <ul className="list-disc list-inside space-y-1 text-secondary-foreground">
            <li>{t.rich("shortcuts.global.items.0", {altKey: () => (<Kbd>Alt</Kbd>)})}</li>
          </ul>
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold">{t("shortcuts.selected.title")}</h3>
          <ul className="list-disc list-inside space-y-1 text-secondary-foreground">
            <li><Kbd>Del</Kbd> - {t("shortcuts.selected.items.0")}</li>
            <li><Kbd>Ctrl + D</Kbd> - {t("shortcuts.selected.items.1")}</li>
            <li><KbdGroup><Kbd>-</Kbd><Kbd>=</Kbd></KbdGroup> - {t("shortcuts.selected.items.2")}</li>
            <li>{t("shortcuts.selected.items.3")}</li>
            <li>{t.rich("shortcuts.selected.items.4", {shiftKey: () => <Kbd>Shift</Kbd>})}</li>
            <li>{t.rich("shortcuts.selected.items.5", {ctrlKey: () => <Kbd>Ctrl</Kbd>})}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

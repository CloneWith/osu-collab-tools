import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FlaskRound, Info, UserRound } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTranslations } from "next-intl";

export default function AvatarDocCard() {
  const t = useTranslations("docs");

  return (
    <Card id="avatar">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserRound className="w-5 h-5"/>
          {t("avatar.title")}
        </CardTitle>
        <CardDescription>{t("avatar.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <p>{t("avatar.content.0")}</p>
        <p>{t.rich("avatar.content.1", {del: (text) => <del>{text}</del>})}</p>
        <Alert variant="information">
          <AlertTitle className="flex-title">
            <FlaskRound/>
            <span>{t("avatar.alerts.experimental.title")}</span>
          </AlertTitle>
          <AlertDescription>
            <p>{t("avatar.alerts.experimental.description")}</p>
          </AlertDescription>
        </Alert>
        <Alert>
          <AlertTitle className="flex-title">
            <Info/>
            <span>{t("avatar.alerts.tip.title")}</span>
          </AlertTitle>
          <AlertDescription>
            <p>{t("avatar.alerts.tip.description.0")}</p>
            <p>{t("avatar.alerts.tip.description.1")}</p>
          </AlertDescription>
        </Alert>
        <p>{t("avatar.steps.title")}</p>
        <ul className="list-decimal list-inside space-y-1 text-secondary-foreground">
          <li>{t.rich("avatar.steps.items.0", {
            linkCode: () => <code className="inline-code">https://a.ppy.sh/&lt;用户 ID&gt;</code>,
          })}</li>
          <li>{t("avatar.steps.items.1")}</li>
          <li>{t("avatar.steps.items.2")}</li>
          <li>{t("avatar.steps.items.3")}</li>
        </ul>
      </CardContent>
    </Card>
  );
}

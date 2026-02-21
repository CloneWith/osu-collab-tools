import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FlaskRound, Info, UserRound } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTranslations } from "next-intl";

export default function AvatarDocCard() {
  const t = useTranslations("docs.avatar");

  return (
    <Card id="avatar">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserRound className="w-5 h-5"/>
          {t("title")}
        </CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <p>{t("content.0")}</p>
        <p>{t.rich("content.1", {del: (text) => <del>{text}</del>})}</p>
        <Alert variant="information">
          <AlertTitle className="flex-title">
            <FlaskRound/>
            <span>{t("alerts.experimental.title")}</span>
          </AlertTitle>
          <AlertDescription>
            <p>{t("alerts.experimental.description")}</p>
          </AlertDescription>
        </Alert>
        <Alert>
          <AlertTitle className="flex-title">
            <Info/>
            <span>{t("alerts.tip.title")}</span>
          </AlertTitle>
          <AlertDescription>
            <p>{t("alerts.tip.description.0")}</p>
            <p>{t("alerts.tip.description.1")}</p>
          </AlertDescription>
        </Alert>
        <p>{t("steps.title")}</p>
        <ul className="list-decimal list-inside space-y-1 text-secondary-foreground">
          <li>{t.rich("steps.items.0", {
            linkCode: () => <code className="inline-code">https://a.ppy.sh/user_id</code>,
          })}</li>
          <li>{t("steps.items.1")}</li>
          <li>{t("steps.items.2")}</li>
          <li>{t("steps.items.3")}</li>
        </ul>
      </CardContent>
    </Card>
  );
}

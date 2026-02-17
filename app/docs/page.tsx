"use client";

import InfoDocCard from "@/app/docs/info-card";
import ImagemapDocCard from "@/app/docs/imagemap-card";
import AvatarDocCard from "@/app/docs/avatar-card";
import { useTranslation } from "react-i18next";
import "../../lib/i18n";

export default function DocsPage() {
  const {t} = useTranslation("docs");

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">{t("title")}</h1>
          <p className="text-secondary-foreground">{t("description")}</p>
        </div>

        <div className="space-y-8">
          {/* Section - 站点简介 */}
          <InfoDocCard/>

          {/* Section - Avatar Generator */}
          <AvatarDocCard/>

          {/* Section - ImageMap Editor */}
          <ImagemapDocCard/>
        </div>
      </div>
    </div>
  );
}

import InfoDocCard from "@/app/docs/info-card";
import ImagemapDocCard from "@/app/docs/imagemap-card";
import AvatarDocCard from "@/app/docs/avatar-card";

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

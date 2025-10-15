import type React from "react";
import WorkingPlaceholder from "@/components/wip-placeholder";

export default function AvatarGeneratorPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            <span className="text-primary">资料图</span>
            生成
          </h1>
          <p className="text-secondary-foreground">生成各种样式的资料图</p>
        </div>

        <WorkingPlaceholder/>
      </div>
    </div>
  )
}

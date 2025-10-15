import { Card, CardContent } from "@/components/ui/card";
import { CircleDotDashed } from "lucide-react";

export default function WorkingPlaceholder() {
  return (
    <Card className="h-96 lg:h-[500px]">
      <CardContent className="p-4 h-full flex flex-col items-center justify-center space-y-2">
        <CircleDotDashed className="w-12 h-12 text-muted-foreground mx-auto mb-4"/>
        <b className="text-4xl">WIP</b>
        <div className="flex flex-col text-center items-center justify-center">
          该功能还在开发中
        </div>
      </CardContent>
    </Card>
  );
}

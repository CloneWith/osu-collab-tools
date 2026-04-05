"use client";

import { common } from "@/app/common";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Check, ClipboardCheck, Cog, Info, Loader2, Network, RefreshCw, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type FeatureStatus = "supported" | "unsupported";
type UrlStatus = "reachable" | "opaque" | "unreachable" | "pending";

const URL_CHECK_CONCURRENCY = 4;

interface FeatureCheckDefinition {
  id: string;
  name: string;
  detect: () => boolean;
}

interface FeatureCheckResult {
  id: string;
  name: string;
  status: FeatureStatus;
}

interface UrlCheckTarget {
  id: string;
  url: string;
}

interface UrlCheckResult {
  id: string;
  url: string;
  status: UrlStatus;
  latencyMs: number | null;
  statusCode?: number;
  error?: string;
}

interface ClientEnvironmentInfo {
  userAgent: string;
  platform: string;
  isMobile: boolean;
  touchEnabled: boolean;
  maxTouchPoints: number;
  hardwareConcurrency: number | null;
  deviceMemory: number | null;
}

interface NavigatorWithClientHints extends Navigator {
  userAgentData?: {
    mobile?: boolean;
    platform?: string;
  };
  deviceMemory?: number;
}

const featureDefinitions: FeatureCheckDefinition[] = [
  {
    id: "fetchApi",
    name: "Fetch API",
    detect: () => typeof fetch === "function" && typeof Request !== "undefined" && typeof Response !== "undefined",
  },
  {
    id: "resizeObserver",
    name: "ResizeObserver",
    detect: () => typeof ResizeObserver !== "undefined",
  },
  {
    id: "intersectionObserver",
    name: "IntersectionObserver",
    detect: () => typeof IntersectionObserver !== "undefined",
  },
  {
    id: "fileReader",
    name: "FileReader",
    detect: () => typeof FileReader !== "undefined",
  },
  {
    id: "dragAndDrop",
    name: "Drag and Drop",
    detect: () => typeof DataTransfer !== "undefined" && typeof DragEvent !== "undefined",
  },
  {
    id: "clipboardApi",
    name: "Clipboard API",
    detect: () => typeof navigator !== "undefined" && !!navigator.clipboard,
  },
  {
    id: "canvas2d",
    name: "Canvas 2D",
    detect: () => {
      if (typeof document === "undefined") return false;
      const canvas = document.createElement("canvas");
      return !!canvas.getContext("2d");
    },
  },
  {
    id: "urlApi",
    name: "URL API",
    detect: () => typeof URL !== "undefined" && typeof URL.createObjectURL === "function",
  },
  {
    id: "raf",
    name: "requestAnimationFrame",
    detect: () => typeof requestAnimationFrame === "function",
  },
  {
    id: "fontApi",
    name: "Font API",
    detect: () => typeof FontFace !== "undefined" && typeof document !== "undefined" && "fonts" in document,
  },
  {
    id: "localStorage",
    name: "localStorage",
    detect: () => typeof window !== "undefined" && "localStorage" in window,
  },
  {
    id: "cryptoRandomUuid",
    name: "crypto.randomUUID",
    detect: () => typeof crypto !== "undefined" && typeof crypto.randomUUID === "function",
  },
  {
    id: "stringToWellFormed",
    name: "String.toWellFormed",
    detect: () => typeof String.prototype.toWellFormed === "function",
  },
];

function isAbsoluteHttpUrl(url: string) {
  return /^https?:\/\//i.test(url);
}

async function probeUrl(url: string): Promise<Omit<UrlCheckResult, "id">> {
  const start = performance.now();

  try {
    const response = await fetch(url, { method: "HEAD", cache: "no-store" });
    return {
      url,
      status: "reachable",
      statusCode: response.status,
      latencyMs: Math.round(performance.now() - start),
    };
  } catch (error) {
    if (isAbsoluteHttpUrl(url)) {
      try {
        await fetch(url, { method: "GET", mode: "no-cors", cache: "no-store" });
        return {
          url,
          status: "opaque",
          latencyMs: Math.round(performance.now() - start),
        };
      } catch (fallbackError) {
        return {
          url,
          status: "unreachable",
          latencyMs: Math.round(performance.now() - start),
          error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
        };
      }
    }

    return {
      url,
      status: "unreachable",
      latencyMs: Math.round(performance.now() - start),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function readClientEnvironment(): ClientEnvironmentInfo {
  const nav = navigator as NavigatorWithClientHints;
  const ua = navigator.userAgent;
  const platform = nav.userAgentData?.platform ?? navigator.platform ?? "Unknown";

  const coarsePointer = typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
  const maxTouchPoints = navigator.maxTouchPoints ?? 0;
  const touchEnabled = maxTouchPoints > 0 || coarsePointer;

  const mobileHint =
    nav.userAgentData?.mobile ?? /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(navigator.userAgent);

  return {
    userAgent: ua,
    platform,
    isMobile: mobileHint,
    touchEnabled,
    maxTouchPoints,
    hardwareConcurrency: navigator.hardwareConcurrency ?? null,
    deviceMemory: nav.deviceMemory ?? null,
  };
}

function FeatureStatusIcon({ status, label }: { status: FeatureStatus; label: string }) {
  const isSupported = status === "supported";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="inline-flex items-center" aria-label={label}>
          {isSupported ? <Check className="w-5 h-5 text-emerald-600" /> : <X className="w-5 h-5 text-red-500" />}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function UrlStatusIcon({
  status,
  label,
  statusCode,
  error,
}: {
  status: UrlStatus;
  label: string;
  statusCode?: number;
  error?: string;
}) {
  const detail = [label, typeof statusCode === "number" ? `${statusCode}` : "", error ?? ""]
    .filter(Boolean)
    .join(" | ");

  const icon =
    status === "reachable" ? (
      <Check className="w-5 h-5 text-emerald-600" />
    ) : status === "opaque" ? (
      <Check className="w-5 h-5 text-amber-500" />
    ) : status === "pending" ? (
      <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
    ) : (
      <X className="w-5 h-5 text-red-500" />
    );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="inline-flex items-center" aria-label={detail || label}>
          {icon}
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-80 break-all">{detail || label}</TooltipContent>
    </Tooltip>
  );
}

export default function BenchmarkPage() {
  const t = useTranslations("benchmark");

  const [featureResults, setFeatureResults] = useState<FeatureCheckResult[]>([]);
  const [urlResults, setUrlResults] = useState<UrlCheckResult[]>([]);
  const [runningFeatureChecks, setRunningFeatureChecks] = useState(false);
  const [runningUrlChecks, setRunningUrlChecks] = useState(false);
  const [lastRunAt, setLastRunAt] = useState<Date | null>(null);
  const [clientInfo, setClientInfo] = useState<ClientEnvironmentInfo | null>(null);
  const urlCheckRunIdRef = useRef(0);

  const createUrlTargets = useCallback((): UrlCheckTarget[] => {
    const endpoint =
      typeof window !== "undefined"
        ? (localStorage.getItem("custom_endpoint") ?? common.defaultEndpoint)
        : common.defaultEndpoint;

    const normalizedEndpoint = endpoint.replace(/\/$/, "");

    return [
      { id: "osuEndpoint", url: normalizedEndpoint },
      { id: "osuUserPage", url: `${normalizedEndpoint}/users/2` },
      { id: "avatarCdn", url: "https://a.ppy.sh/2" },
      { id: "imageProxy", url: `https://wsrv.nl/?url=${encodeURIComponent("https://a.ppy.sh/2")}` },
      { id: "flagCdn", url: "https://flagcdn.com/us.svg" },
      { id: "twemojiCdn", url: "https://twemoji.maxcdn.com/v/latest/72x72/1f1fa-1f1f8.png" },
      { id: "sulInfo", url: "https://s-ul.eu/account/info" },
      { id: "uploadApi", url: "/api/upload/s-ul" },
    ];
  }, []);

  const runFeatureChecks = useCallback(async () => {
    setRunningFeatureChecks(true);

    const results: FeatureCheckResult[] = featureDefinitions.map((feature) => {
      let supported = false;

      try {
        supported = feature.detect();
      } catch {
        supported = false;
      }

      return {
        id: feature.id,
        name: feature.name,
        status: supported ? "supported" : "unsupported",
      };
    });

    setFeatureResults(results);
    setRunningFeatureChecks(false);
    setLastRunAt(new Date());
  }, []);

  const runUrlChecks = useCallback(async () => {
    const runId = ++urlCheckRunIdRef.current;
    const targets = createUrlTargets();

    setRunningUrlChecks(true);
    setUrlResults(
      targets.map((target) => ({
        id: target.id,
        url: target.url,
        status: "pending",
        latencyMs: null,
      })),
    );

    let cursor = 0;

    const worker = async () => {
      while (true) {
        const currentIndex = cursor;
        cursor += 1;

        if (currentIndex >= targets.length) {
          return;
        }

        const target = targets[currentIndex];
        const result = await probeUrl(target.url);

        if (urlCheckRunIdRef.current !== runId) {
          return;
        }

        setUrlResults((previous) =>
          previous.map((item) =>
            item.id === target.id
              ? {
                  id: target.id,
                  ...result,
                }
              : item,
          ),
        );
      }
    };

    try {
      const workerCount = Math.min(URL_CHECK_CONCURRENCY, targets.length);
      await Promise.all(Array.from({ length: workerCount }, () => worker()));
    } finally {
      if (urlCheckRunIdRef.current === runId) {
        setRunningUrlChecks(false);
        setLastRunAt(new Date());
      }
    }
  }, [createUrlTargets]);

  const runAllChecks = useCallback(async () => {
    await Promise.all([runFeatureChecks(), runUrlChecks()]);
  }, [runFeatureChecks, runUrlChecks]);

  useEffect(() => {
    void runAllChecks();
  }, [runAllChecks]);

  useEffect(() => {
    setClientInfo(readClientEnvironment());
  }, []);

  const featureSummary = useMemo(() => {
    const total = featureResults.length;
    const supported = featureResults.filter((item) => item.status === "supported").length;
    const percent = total > 0 ? Math.round((supported / total) * 100) : 0;
    return { total, supported, percent };
  }, [featureResults]);

  const urlSummary = useMemo(() => {
    const total = urlResults.length;
    const reachable = urlResults.filter((item) => item.status === "reachable" || item.status === "opaque").length;
    const percent = total > 0 ? Math.round((reachable / total) * 100) : 0;
    return { total, reachable, percent };
  }, [urlResults]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-2">
            <ClipboardCheck className="w-8 h-8" />
            {t("title")}
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("controls.title")}</CardTitle>
            <CardDescription>
              {lastRunAt
                ? t("controls.lastRun", {
                    date: new Intl.DateTimeFormat(undefined, {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    }).format(lastRunAt),
                  })
                : t("controls.neverRun")}
            </CardDescription>
            <CardAction>
              <Button onClick={() => void runAllChecks()} disabled={runningFeatureChecks || runningUrlChecks}>
                {runningFeatureChecks || runningUrlChecks ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("controls.running")}
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {t("controls.runAll")}
                  </>
                )}
              </Button>
            </CardAction>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex-title gap-2">
              <Info />
              {t("clientInfo.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1 whitespace-nowrap">{t("clientInfo.field")}</TableHead>
                    <TableHead>{t("clientInfo.value")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="w-1 whitespace-nowrap">{t("clientInfo.items.userAgent")}</TableCell>
                    <TableCell>{clientInfo?.userAgent ?? t("clientInfo.unknown")}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="w-1 whitespace-nowrap">{t("clientInfo.items.platform")}</TableCell>
                    <TableCell>{clientInfo?.platform ?? t("clientInfo.unknown")}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="w-1 whitespace-nowrap">{t("clientInfo.items.mobile")}</TableCell>
                    <TableCell>
                      {clientInfo ? t(`clientInfo.boolean.${String(clientInfo.isMobile)}`) : t("clientInfo.unknown")}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="w-1 whitespace-nowrap">{t("clientInfo.items.touch")}</TableCell>
                    <TableCell>
                      {clientInfo
                        ? t(`clientInfo.boolean.${String(clientInfo.touchEnabled)}`)
                        : t("clientInfo.unknown")}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="w-1 whitespace-nowrap">{t("clientInfo.items.maxTouchPoints")}</TableCell>
                    <TableCell>{clientInfo ? String(clientInfo.maxTouchPoints) : t("clientInfo.unknown")}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="w-1 whitespace-nowrap">{t("clientInfo.items.hardwareConcurrency")}</TableCell>
                    <TableCell>
                      {clientInfo?.hardwareConcurrency != null
                        ? String(clientInfo.hardwareConcurrency)
                        : t("clientInfo.unknown")}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="w-1 whitespace-nowrap">{t("clientInfo.items.deviceMemory")}</TableCell>
                    <TableCell>
                      {clientInfo?.deviceMemory != null ? `${clientInfo.deviceMemory} GB` : t("clientInfo.unknown")}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex-title gap-2">
                <Cog />
                {t("featureChecks.title")}
              </CardTitle>
              <CardDescription>{t("featureChecks.description")}</CardDescription>
              <CardAction>
                <Button variant="outline" onClick={() => void runFeatureChecks()} disabled={runningFeatureChecks}>
                  {t("controls.rerun")}
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>{t("summary.featureCoverage")}</span>
                <span>
                  {featureSummary.supported}/{featureSummary.total}
                </span>
              </div>
              <Progress value={featureSummary.percent} />
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("table.feature")}</TableHead>
                      <TableHead>{t("table.status")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {featureResults.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell>{result.name}</TableCell>
                        <TableCell>
                          <FeatureStatusIcon status={result.status} label={t(`statuses.${result.status}`)} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex-title gap-2">
                <Network />
                {t("urlChecks.title")}
              </CardTitle>
              <CardDescription>{t("urlChecks.description")}</CardDescription>
              <CardAction>
                <Button variant="outline" onClick={() => void runUrlChecks()} disabled={runningUrlChecks}>
                  {t("controls.rerun")}
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>{t("summary.urlCoverage")}</span>
                <span>
                  {urlSummary.reachable}/{urlSummary.total}
                </span>
              </div>
              <Progress value={urlSummary.percent} />
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("table.endpoint")}</TableHead>
                      <TableHead>{t("table.status")}</TableHead>
                      <TableHead>{t("table.latency")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {urlResults.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell>{t(`urlChecks.items.${result.id}`)}</TableCell>
                        <TableCell>
                          <UrlStatusIcon
                            status={result.status}
                            label={t(`statuses.${result.status}`)}
                            statusCode={result.statusCode}
                            error={result.error}
                          />
                        </TableCell>
                        <TableCell>{result.latencyMs != null ? `${result.latencyMs} ms` : "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

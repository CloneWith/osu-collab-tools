"use client";

import { cn } from "@/lib/utils";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

interface Triangle {
  x: number;
  y: number;
  speedMultiplier: number;
}

interface TrianglesBackgroundProps {
  /** 三角形颜色 */
  color?: string;
  /** 三角形透明度 (0-1) */
  opacity?: number;
  /** 基础速度 (像素/秒) */
  velocity?: number;
  /** 密度比例，控制三角形数量 */
  spawnRatio?: number;
  /** 三角形大小 */
  triangleSize?: number;
  /** 边框粗细 (0-1，相对于三角形大小) */
  thickness?: number;
  className?: string;
}

const EQUILATERAL_TRIANGLE_RATIO = Math.sqrt(3) / 2;
const BASE_VELOCITY = 50;

/**
 * Ceiling on how many device pixels we draw per CSS pixel. This helps reduce the amount of work done
 * in the first frame, and also helps keep the triangles from looking too pixelated at high DPR.
 */
const MAX_SCALE = 2;

/**
 * The scale every number in this file was originally written against. Dropping the
 * supersample without this would silently halve every triangle and double how fast they drift.
 */
const REFERENCE_SCALE = 4;

/** 0.02 area per canvas pixel at the reference scale, i.e. what the original density worked out to. */
const DENSITY_PER_CSS_PX = 0.02 * REFERENCE_SCALE;

export const TrianglesBackground: React.FC<TrianglesBackgroundProps> = ({
  color = "#ffffff",
  opacity = 1,
  velocity = 1,
  spawnRatio = 1,
  triangleSize = 100 * 4,
  thickness = 0.02,

  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trianglesRef = useRef<Triangle[]>([]);
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  /** Device pixels per CSS pixel actually in use, refreshed on every resize. */
  const scaleRef = useRef<number>(REFERENCE_SCALE);
  /** Flipped once the first frame has been painted, purely to drive the reveal below. */
  const [painted, setPainted] = useState(false);
  /** Lets the prop-change effect skip the mount pass, which the init effect already covers. */
  const propsSettled = useRef(false);

  // 生成符合正态分布的速度倍数
  const createSpeedMultiplier = useCallback((): number => {
    const stdDev = 0.16;
    const mean = 0.5;

    // Box-Muller变换生成正态分布
    const u1 = 1 - Math.random();
    const u2 = 1 - Math.random();
    const randStdNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);

    return Math.max(mean + stdDev * randStdNormal, 0.1);
  }, []);

  /** How many triangles to keep alive. Measured in CSS pixels so the draw scale cannot thin the field. */
  const aimCountFor = useCallback(
    (canvas: HTMLCanvasElement) =>
      Math.min(Math.max(1, Math.floor((canvas.width / scaleRef.current) * DENSITY_PER_CSS_PX * spawnRatio)), 1000),
    [spawnRatio],
  );

  // 创建新三角形
  const createTriangle = useCallback(
    (canvas: HTMLCanvasElement, randomY: boolean = false): Triangle => {
      const size = triangleSize * (scaleRef.current / REFERENCE_SCALE);
      const maxOffset = size * EQUILATERAL_TRIANGLE_RATIO;
      const y = randomY ? Math.random() * (canvas.height + maxOffset) - maxOffset : canvas.height + maxOffset;

      return {
        x: Math.random() * canvas.width,
        y,
        speedMultiplier: createSpeedMultiplier(),
      };
    },
    [triangleSize, createSpeedMultiplier],
  );

  // 绘制空心等边三角形
  const drawTriangle = useCallback(
    (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, lineWidth: number) => {
      const height = size * EQUILATERAL_TRIANGLE_RATIO;

      ctx.beginPath();
      // 顶点
      ctx.moveTo(x, y);
      // 右下顶点
      ctx.lineTo(x + size / 2, y + height);
      // 左下顶点
      ctx.lineTo(x - size / 2, y + height);
      // 回到顶点
      ctx.closePath();

      ctx.lineWidth = lineWidth;
      ctx.stroke();
    },
    [],
  );

  // 更新三角形位置
  const updateTriangles = useCallback(
    (canvas: HTMLCanvasElement, deltaTime: number) => {
      if (deltaTime === 0) return;

      // Travel is scaled like everything else, so the drift stays the same speed on screen.
      const size = triangleSize * (scaleRef.current / REFERENCE_SCALE);
      const movedDistance = (deltaTime / 1000) * velocity * BASE_VELOCITY * (scaleRef.current / REFERENCE_SCALE);

      // 更新现有三角形位置
      trianglesRef.current = trianglesRef.current.filter((triangle) => {
        triangle.y -= Math.max(0.5, triangle.speedMultiplier) * movedDistance;

        // 移除超出屏幕顶部的三角形
        const bottomPos = triangle.y + size * EQUILATERAL_TRIANGLE_RATIO;
        return bottomPos > 0;
      });

      // 添加新三角形
      const aimCount = aimCountFor(canvas);
      while (trianglesRef.current.length < aimCount) {
        trianglesRef.current.push(createTriangle(canvas, false));
      }
    },
    [velocity, triangleSize, aimCountFor, createTriangle],
  );

  // 渲染函数
  const render = useCallback(
    (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
      // 清空画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 设置绘制样式
      ctx.strokeStyle = color;
      ctx.globalAlpha = opacity;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const size = triangleSize * (scaleRef.current / REFERENCE_SCALE);
      const lineWidth = size * thickness;

      // 绘制所有三角形
      trianglesRef.current.forEach((triangle) => {
        drawTriangle(ctx, triangle.x, triangle.y, size, lineWidth);
      });
    },
    [color, opacity, triangleSize, thickness, drawTriangle],
  );

  // 动画循环
  const animate = useCallback(
    (currentTime: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // 计算时间差
      let deltaTime = lastTimeRef.current === 0 ? 0 : currentTime - lastTimeRef.current;

      // 限制最大deltaTime，防止页面从后台返回时时间跳跃过大
      // 限制为最多3帧的时间（假设60fps，即约50ms）
      const maxDeltaTime = 50;
      if (deltaTime > maxDeltaTime) {
        deltaTime = maxDeltaTime;
      }

      lastTimeRef.current = currentTime;

      updateTriangles(canvas, deltaTime);
      render(canvas, ctx);

      animationFrameRef.current = requestAnimationFrame(animate);
    },
    [updateTriangles, render],
  );

  // 初始化和重置
  const reset = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    trianglesRef.current = [];

    // 初始填充三角形
    const aimCount = aimCountFor(canvas);

    for (let i = 0; i < aimCount; i++) {
      trianglesRef.current.push(createTriangle(canvas, true));
    }
  }, [aimCountFor, createTriangle]);

  // 处理窗口大小变化
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    // Match the device pixel grid instead of a fixed 4× blow-up: crisp where it matters, without
    // asking a desktop hero for a ~100 MB bitmap to draw hairlines into.
    const scale = Math.min(window.devicePixelRatio || 1, MAX_SCALE);

    canvas.width = Math.round(parent.clientWidth * scale);
    canvas.height = Math.round(parent.clientHeight * scale);
    scaleRef.current = scale;

    reset();
  }, [reset]);

  /**
   * Resize and paint in one go.
   *
   * The paint cannot wait for the animation loop's next tick: a canvas is transparent until
   * something draws into it, so every frame spent waiting is a frame where this layer is simply
   * missing. Drawing immediately is also what makes the reduced-motion path below work, since
   * that path has no loop to fall back on.
   */
  const resizeAndDraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    handleResize();
    render(canvas, ctx);
  }, [handleResize, render]);

  // 处理页面可见性变化
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // 页面返回前台，重置时间戳以避免时间跳跃
        lastTimeRef.current = 0;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // 初始化
  useEffect(() => {
    // Size and paint straight away. See `resizeAndDraw` for why this cannot wait for a frame.
    resizeAndDraw();

    // Reveal only once something has actually been drawn. The canvas already occupies its box, so
    // this animates alpha alone without layout shift or color change.
    const revealFrame = requestAnimationFrame(() => setPainted(true));

    window.addEventListener("resize", resizeAndDraw);

    // Someone who asked for less motion gets a still poster instead of a drifting field: a single
    // pass, no loop, and therefore nothing that moves. The frame above is already on screen.
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduceMotion) {
      lastTimeRef.current = 0;
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      cancelAnimationFrame(revealFrame);
      window.removeEventListener("resize", resizeAndDraw);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animate, resizeAndDraw]);

  // 参数变化时重新铺开三角形并立即重绘，而不是等到下一帧才反映新参数
  useEffect(() => {
    // The mount draw is the effect above's job; this one only exists for changes after it.
    if (!propsSettled.current) {
      propsSettled.current = true;
      return;
    }

    resizeAndDraw();
  }, [resizeAndDraw]);

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        "block w-full h-full pointer-events-none transition-opacity duration-700 ease-out motion-reduce:transition-none",
        painted ? "opacity-100" : "opacity-0",
        className,
      )}
    />
  );
};

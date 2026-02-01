"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

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

export const TrianglesBackground: React.FC<TrianglesBackgroundProps> = ({
  color = '#ffffff',
  opacity = 1,
  velocity = 1,
  spawnRatio = 1,
  triangleSize = 100 * 4,
  thickness = 0.02,

  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trianglesRef = useRef<Triangle[]>([]);
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const isPageVisibleRef = useRef<boolean>(true);

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

  // 创建新三角形
  const createTriangle = useCallback((canvas: HTMLCanvasElement, randomY: boolean = false): Triangle => {
    const maxOffset = triangleSize * EQUILATERAL_TRIANGLE_RATIO;
    const y = randomY
      ? Math.random() * (canvas.height + maxOffset) - maxOffset
      : canvas.height + maxOffset;

    return {
      x: Math.random() * canvas.width,
      y,
      speedMultiplier: createSpeedMultiplier(),
    };
  }, [triangleSize, createSpeedMultiplier]);

  // 绘制空心等边三角形
  const drawTriangle = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    lineWidth: number
  ) => {
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
  }, []);

  // 更新三角形位置
  const updateTriangles = useCallback((canvas: HTMLCanvasElement, deltaTime: number) => {
    if (deltaTime === 0) return;

    const movedDistance = (deltaTime / 1000) * velocity * BASE_VELOCITY;

    // 更新现有三角形位置
    trianglesRef.current = trianglesRef.current.filter(triangle => {
      triangle.y -= Math.max(0.5, triangle.speedMultiplier) * movedDistance;

      // 移除超出屏幕顶部的三角形
      const bottomPos = triangle.y + triangleSize * EQUILATERAL_TRIANGLE_RATIO;
      return bottomPos > 0;
    });

    // 计算目标数量
    const aimCount = Math.min(
      Math.max(1, Math.floor(canvas.width * 0.02 * spawnRatio)),
      1000 // 限制最大数量以保证性能
    );

    // 添加新三角形
    while (trianglesRef.current.length < aimCount) {
      trianglesRef.current.push(createTriangle(canvas, false));
    }
  }, [velocity, triangleSize, spawnRatio, createTriangle]);

  // 渲染函数
  const render = useCallback((canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 设置绘制样式
    ctx.strokeStyle = color;
    ctx.globalAlpha = opacity;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const lineWidth = triangleSize * thickness;

    // 绘制所有三角形
    trianglesRef.current.forEach(triangle => {
      drawTriangle(ctx, triangle.x, triangle.y, triangleSize, lineWidth);
    });
  }, [color, opacity, triangleSize, thickness, drawTriangle]);

  // 动画循环
  const animate = useCallback((currentTime: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
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
  }, [updateTriangles, render]);

  // 初始化和重置
  const reset = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    trianglesRef.current = [];

    // 初始填充三角形
    const aimCount = Math.min(
      Math.max(1, Math.floor(canvas.width * 0.02 * spawnRatio)),
      1000
    );

    for (let i = 0; i < aimCount; i++) {
      trianglesRef.current.push(createTriangle(canvas, true));
    }
  }, [spawnRatio, createTriangle]);

  // 处理窗口大小变化
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    // @4x，保证清晰度
    canvas.width = parent.clientWidth * 4;
    canvas.height = parent.clientHeight * 4;

    reset();
  }, [reset]);

  // 处理页面可见性变化
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // 页面进入后台
        isPageVisibleRef.current = false;
      } else {
        // 页面返回前台，重置时间戳以避免时间跳跃
        isPageVisibleRef.current = true;
        lastTimeRef.current = 0;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // 初始化
  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);

    lastTimeRef.current = 0;
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [handleResize, animate]);

  // 参数变化时重置
  useEffect(() => {
    reset();
  }, [spawnRatio, reset]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("block w-full h-full pointer-events-none", className)}
    />
  );
};

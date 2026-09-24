"use client";

import { liquidMetalFragmentShader, ShaderMount } from "@paper-design/shaders";
import { Sparkles, Loader2 } from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";

export interface LiquidMetalButtonProps {
  label?: string;
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  viewMode?: "text" | "icon";
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export function LiquidMetalButton({
  label = "Login",
  onClick,
  viewMode = "text",
  type = "button",
  disabled = false,
  loading = false,
  fullWidth = false,
  width,
  height = 48,
  className = "",
  style = {},
}: LiquidMetalButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<
    Array<{ x: number; y: number; id: number }>
  >([]);
  const shaderRef = useRef<HTMLDivElement>(null);
  // biome-ignore lint/suspicious/noExplicitAny: External library without types
  const shaderMount = useRef<any>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleId = useRef(0);

  const isFull = fullWidth || width === "100%";

  const dimensions = useMemo(() => {
    if (viewMode === "icon") {
      return {
        width: "46px",
        height: "46px",
        innerWidth: "42px",
        innerHeight: "42px",
      };
    } else if (isFull) {
      return {
        width: "100%",
        height: `${height}px`,
        innerWidth: "calc(100% - 4px)",
        innerHeight: `${Number(height) - 4}px`,
      };
    } else {
      const w = width ? (typeof width === "number" ? `${width}px` : width) : "220px";
      const h = typeof height === "number" ? `${height}px` : height;
      return {
        width: w,
        height: h,
        innerWidth: typeof width === "number" ? `${width - 4}px` : "calc(100% - 4px)",
        innerHeight: typeof height === "number" ? `${Number(height) - 4}px` : "calc(100% - 4px)",
      };
    }
  }, [viewMode, isFull, width, height]);

  useEffect(() => {
    const styleId = "shader-canvas-style-exploded";
    if (typeof document !== "undefined" && !document.getElementById(styleId)) {
      const styleEl = document.createElement("style");
      styleEl.id = styleId;
      styleEl.textContent = `
        .shader-container-exploded canvas {
          width: 100% !important;
          height: 100% !important;
          display: block !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          border-radius: 100px !important;
        }
        @keyframes ripple-animation {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0.6;
          }
          100% {
            transform: translate(-50%, -50%) scale(4);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(styleEl);
    }

    const loadShader = async () => {
      try {
        if (shaderRef.current) {
          if (shaderMount.current?.destroy) {
            shaderMount.current.destroy();
          }

          shaderMount.current = new ShaderMount(
            shaderRef.current,
            liquidMetalFragmentShader,
            {
              u_repetition: 4,
              u_softness: 0.5,
              u_shiftRed: 0.3,
              u_shiftBlue: 0.3,
              u_distortion: 0,
              u_contour: 0,
              u_angle: 45,
              u_scale: 8,
              u_shape: 1,
              u_offsetX: 0.1,
              u_offsetY: -0.1,
            },
            undefined,
            0.6,
          );
        }
      } catch (error) {
        console.error("[v0] Failed to load shader:", error);
      }
    };

    loadShader();

    return () => {
      if (shaderMount.current?.destroy) {
        shaderMount.current.destroy();
        shaderMount.current = null;
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (disabled || loading) return;
    setIsHovered(true);
    shaderMount.current?.setSpeed?.(1.2);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsPressed(false);
    shaderMount.current?.setSpeed?.(0.6);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }

    if (shaderMount.current?.setSpeed) {
      shaderMount.current.setSpeed(2.4);
      setTimeout(() => {
        if (isHovered) {
          shaderMount.current?.setSpeed?.(1.2);
        } else {
          shaderMount.current?.setSpeed?.(0.6);
        }
      }, 350);
    }

    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const ripple = { x, y, id: rippleId.current++ };

      setRipples((prev) => [...prev, ripple]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== ripple.id));
      }, 600);
    }

    onClick?.(e);
  };

  return (
    <div
      className={`relative inline-block ${className}`}
      style={{
        width: isFull ? "100%" : dimensions.width,
        display: isFull ? "block" : "inline-block",
        ...style,
      }}
    >
      <div
        style={{
          perspective: "1000px",
          perspectiveOrigin: "50% 50%",
          width: "100%",
        }}
      >
        <div
          style={{
            position: "relative",
            width: dimensions.width,
            height: dimensions.height,
            transformStyle: "preserve-3d",
            transition:
              "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s ease, height 0.4s ease",
            transform: "none",
            opacity: disabled || loading ? 0.75 : 1,
            pointerEvents: disabled || loading ? "none" : "auto",
          }}
        >
          {/* Label / Content Layer */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: dimensions.height,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transformStyle: "preserve-3d",
              transition:
                "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s ease, height 0.4s ease, gap 0.4s ease",
              transform: "translateZ(20px)",
              zIndex: 30,
              pointerEvents: "none",
            }}
          >
            {loading && (
              <Loader2
                className="animate-spin text-white"
                size={16}
              />
            )}
            {viewMode === "icon" && !loading && (
              <Sparkles
                size={18}
                style={{
                  color: "#ffffff",
                  filter: "drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.7))",
                  transition: "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  transform: "scale(1)",
                }}
              />
            )}
            {viewMode === "text" && (
              <span
                style={{
                  fontSize: "15px",
                  color: "#ffffff",
                  fontWeight: 700,
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  textShadow: "0px 1px 3px rgba(0, 0, 0, 0.9), 0px 0px 8px rgba(255, 255, 255, 0.2)",
                  transition: "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  transform: "scale(1)",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </span>
            )}
          </div>

          {/* Inner Bevel Gradient Layer */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: dimensions.height,
              transformStyle: "preserve-3d",
              transition:
                "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s ease, height 0.4s ease",
              transform: `translateZ(10px) ${isPressed ? "translateY(1px) scale(0.98)" : "translateY(0) scale(1)"}`,
              zIndex: 20,
            }}
          >
            <div
              style={{
                width: dimensions.innerWidth,
                height: dimensions.innerHeight,
                margin: "2px",
                borderRadius: "100px",
                background: "linear-gradient(180deg, #242424 0%, #0a0a0a 100%)",
                boxShadow: isPressed
                  ? "inset 0px 2px 4px rgba(0, 0, 0, 0.6), inset 0px 1px 2px rgba(0, 0, 0, 0.4)"
                  : "inset 0px 1px 1px rgba(255, 255, 255, 0.15)",
                transition:
                  "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s ease, height 0.4s ease, box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
          </div>

          {/* Liquid Metal Shader Canvas Layer */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: dimensions.height,
              transformStyle: "preserve-3d",
              transition:
                "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s ease, height 0.4s ease",
              transform: `translateZ(0px) ${isPressed ? "translateY(1px) scale(0.98)" : "translateY(0) scale(1)"}`,
              zIndex: 10,
            }}
          >
            <div
              style={{
                height: dimensions.height,
                width: "100%",
                borderRadius: "100px",
                boxShadow: isPressed
                  ? "0px 0px 0px 1px rgba(0, 0, 0, 0.6), 0px 1px 2px 0px rgba(0, 0, 0, 0.4)"
                  : isHovered
                    ? "0px 0px 0px 1.5px rgba(255, 255, 255, 0.2), 0px 12px 24px 0px rgba(0, 0, 0, 0.35), 0px 4px 8px 0px rgba(127, 86, 217, 0.25)"
                    : "0px 0px 0px 1px rgba(0, 0, 0, 0.4), 0px 8px 20px 0px rgba(0, 0, 0, 0.25), 0px 2px 4px 0px rgba(0, 0, 0, 0.15)",
                transition:
                  "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s ease, height 0.4s ease, box-shadow 0.2s ease",
                background: "rgb(0 0 0 / 0)",
              }}
            >
              <div
                ref={shaderRef}
                className="shader-container-exploded"
                style={{
                  borderRadius: "100px",
                  overflow: "hidden",
                  position: "relative",
                  width: "100%",
                  height: dimensions.height,
                  transition: "width 0.4s ease, height 0.4s ease",
                }}
              />
            </div>
          </div>

          {/* Interactive Button Overlay */}
          <button
            ref={buttonRef}
            type={type}
            disabled={disabled || loading}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseDown={() => !disabled && !loading && setIsPressed(true)}
            onMouseUp={() => !disabled && !loading && setIsPressed(false)}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: dimensions.height,
              background: "transparent",
              border: "none",
              cursor: disabled || loading ? "not-allowed" : "pointer",
              outline: "none",
              zIndex: 40,
              transformStyle: "preserve-3d",
              transform: "translateZ(25px)",
              transition:
                "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s ease, height 0.4s ease",
              overflow: "hidden",
              borderRadius: "100px",
            }}
            aria-label={label}
          >
            {ripples.map((ripple) => (
              <span
                key={ripple.id}
                style={{
                  position: "absolute",
                  left: `${ripple.x}px`,
                  top: `${ripple.y}px`,
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0) 70%)",
                  pointerEvents: "none",
                  animation: "ripple-animation 0.6s ease-out",
                }}
              />
            ))}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LiquidMetalButton;

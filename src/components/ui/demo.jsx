import React from "react";
import { LiquidMetalButton } from "./liquid-metal-button";

export default function LiquidMetalButtonDemo() {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center gap-4 p-4">
      <div className="d-flex align-items-center gap-4">
        <LiquidMetalButton label="Get Started" />
        <LiquidMetalButton viewMode="icon" />
      </div>
    </div>
  );
}

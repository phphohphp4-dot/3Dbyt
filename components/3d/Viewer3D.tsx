"use client";

import { Suspense, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Loader, OrbitControls } from "@react-three/drei";
import { Expand, Minimize, MousePointer2, Orbit } from "lucide-react";
import { Model } from "@/components/3d/Model";
import { FirstPersonRig } from "@/components/3d/FirstPersonRig";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ViewMode = "orbit" | "firstPerson";

interface Viewer3DProps {
  modelUrl: string;
  projectName: string;
}

export function Viewer3D({ modelUrl, projectName }: Viewer3DProps) {
  const [mode, setMode] = useState<ViewMode>("orbit");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  async function toggleFullscreen() {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative h-[70vh] w-full overflow-hidden rounded-xl bg-black sm:h-[80vh]"
    >
      <Canvas camera={{ position: [4, 3, 6], fov: 55 }} shadows>
        <Suspense fallback={null}>
          <Environment preset="apartment" />
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[5, 8, 5]}
            intensity={1.2}
            castShadow
            shadow-mapSize={[2048, 2048]}
          />
          <Model url={modelUrl} />
          {mode === "orbit" ? (
            <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
          ) : (
            <FirstPersonRig />
          )}
        </Suspense>
      </Canvas>

      <Loader
        containerStyles={{ background: "rgba(0,0,0,0.85)" }}
        innerStyles={{ width: "200px" }}
        dataInterpolation={(p) => `Načítání modelu… ${p.toFixed(0)}%`}
      />

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4">
        <div className="flex items-start justify-between">
          <div className="pointer-events-auto rounded-lg bg-black/50 px-3 py-1.5 text-sm font-medium text-white backdrop-blur">
            {projectName}
          </div>
          <Button
            size="icon"
            variant="secondary"
            className="pointer-events-auto"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Expand className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="flex flex-col items-center gap-3">
          <p className="pointer-events-none rounded-full bg-black/50 px-4 py-1.5 text-xs text-white/90 backdrop-blur">
            {mode === "orbit"
              ? "Levé tlačítko myši: rotace · pravé tlačítko: posun · kolečko: zoom"
              : "Klikněte do scény a rozhlédněte se myší · WASD / šipky: chůze"}
          </p>

          <div className="pointer-events-auto flex gap-2 rounded-full bg-black/50 p-1 backdrop-blur">
            <Button
              size="sm"
              variant={mode === "orbit" ? "default" : "ghost"}
              className={cn("rounded-full text-white", mode !== "orbit" && "hover:text-white")}
              onClick={() => setMode("orbit")}
            >
              <Orbit className="mr-1.5 h-4 w-4" />
              Prohlídka
            </Button>
            <Button
              size="sm"
              variant={mode === "firstPerson" ? "default" : "ghost"}
              className={cn("rounded-full text-white", mode !== "firstPerson" && "hover:text-white")}
              onClick={() => setMode("firstPerson")}
            >
              <MousePointer2 className="mr-1.5 h-4 w-4" />
              Procházka
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

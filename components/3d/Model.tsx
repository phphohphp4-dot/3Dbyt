"use client";

import { useGLTF } from "@react-three/drei";

interface ModelProps {
  url: string;
}

export function Model({ url }: ModelProps) {
  const { scene } = useGLTF(url, "https://www.gstatic.com/draco/versioned/decoders/1.5.6/");
  return <primitive object={scene} />;
}

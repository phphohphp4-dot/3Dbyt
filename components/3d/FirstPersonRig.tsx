"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei";
import * as THREE from "three";

const MOVE_SPEED = 3.2;

const KEY_MAP: Record<string, keyof typeof initialKeys> = {
  KeyW: "forward",
  ArrowUp: "forward",
  KeyS: "backward",
  ArrowDown: "backward",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
};

const initialKeys = {
  forward: false,
  backward: false,
  left: false,
  right: false,
};

export function FirstPersonRig({ eyeHeight = 1.6 }: { eyeHeight?: number }) {
  const { camera } = useThree();
  const keys = useRef({ ...initialKeys });
  const direction = useRef(new THREE.Vector3());
  const sideways = useRef(new THREE.Vector3());

  useEffect(() => {
    camera.position.set(0, eyeHeight, 4);

    function handleKeyDown(e: KeyboardEvent) {
      const mapped = KEY_MAP[e.code];
      if (mapped) keys.current[mapped] = true;
    }
    function handleKeyUp(e: KeyboardEvent) {
      const mapped = KEY_MAP[e.code];
      if (mapped) keys.current[mapped] = false;
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      keys.current = { ...initialKeys };
    };
  }, [camera, eyeHeight]);

  useFrame((_, delta) => {
    const { forward, backward, left, right } = keys.current;
    if (!forward && !backward && !left && !right) return;

    camera.getWorldDirection(direction.current);
    direction.current.y = 0;
    direction.current.normalize();

    sideways.current.crossVectors(direction.current, camera.up).normalize();

    const step = MOVE_SPEED * delta;
    if (forward) camera.position.addScaledVector(direction.current, step);
    if (backward) camera.position.addScaledVector(direction.current, -step);
    if (right) camera.position.addScaledVector(sideways.current, step);
    if (left) camera.position.addScaledVector(sideways.current, -step);

    camera.position.y = eyeHeight;
  });

  return <PointerLockControls />;
}

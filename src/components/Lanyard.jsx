/* eslint-disable react/no-unknown-property */
"use client";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, extend, useFrame } from "@react-three/fiber";
import { useGLTF, useTexture, Environment, Lightformer } from "@react-three/drei";
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
} from "@react-three/rapier";
import { MeshLineGeometry, MeshLineMaterial } from "meshline";

import cardGLB from "../assets/card.glb";
import lanyard from "../assets/lanyard.png";
import lightStrap from "../assets/light-mode.png";
import darkStrap from "../assets/dark-mode.png";

import * as THREE from "three";

extend({ MeshLineGeometry, MeshLineMaterial });

// Preload both strap variants so spamming light/dark doesn't trigger a
// new suspense (which would unmount Physics if wrapped together).
try {
  useTexture.preload?.(lightStrap);
  useTexture.preload?.(darkStrap);
  useTexture.preload?.(lanyard);
} catch {}

const BLANK_PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const FRONT_UV_RECT = { x: 0, y: 0, w: 0.5, h: 0.755 };
const BACK_UV_RECT = { x: 0.5, y: 0, w: 0.5, h: 0.757 };

export default function Lanyard({
  position = [0, 0, 30],
  gravity = [0, -40, 0],
  fov = 20,
  transparent = true,
  frontImage = null,
  backImage = null,
  imageFit = "cover",
  lanyardImage = null,
  lanyardWidth = 1,
  // camera used specifically on small/narrow screens — the default `position`/`fov`
  // above assume a wide-short desktop panel; mobile flips to narrow-tall, so the
  // off-center rig needs to be recentered and pulled back to stay in frame
  mobilePosition = [1.1, 1.5, 14],
  mobileFov = 26,
}) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return !window.matchMedia("(min-width: 768px)").matches;
  });

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const onChange = (e) => setIsMobile(!e.matches);
    if (mql.addEventListener) mql.addEventListener("change", onChange);
    else mql.addListener(onChange);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", onChange);
      else mql.removeListener(onChange);
    };
  }, []);

  // hacker theme detection — card goes matrix when Konami unlocked
  const [isHacker, setIsHacker] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("theme-hacker")
  );
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setIsHacker(root.classList.contains("theme-hacker"));
    const obs = new MutationObserver(sync);
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  // strap png is light/dark adaptive (user-provided)
  const [isDark, setIsDark] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("theme-dark")
  );
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setIsDark(root.classList.contains("theme-dark"));
    const obs = new MutationObserver(sync);
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const activePosition = isMobile ? mobilePosition : position;
  const activeFov = isMobile ? mobileFov : fov;

  // toast for easter egg — B&W minimalist
  const [toast, setToast] = useState(null);
  useEffect(() => {
    const onEaster = (e) => {
      const cause = e.detail || "tug";
      setToast(cause);
      setTimeout(() => setToast(null), 3000);
    };
    window.addEventListener("lanyard:easter", onEaster);
    return () => window.removeEventListener("lanyard:easter", onEaster);
  }, []);

  return (
    <div className="relative z-0 w-full h-full flex justify-center items-center">
      <Canvas
        frameloop="always"
        shadows={false}
        camera={{ position: activePosition, fov: activeFov }}
        dpr={[1, 2]}
        gl={{ alpha: transparent, antialias: true, powerPreference: "high-performance", stencil: false, depth: true }}
        performance={{ min: 0.5 }}
        onCreated={({ gl }) =>
          gl.setClearColor(new THREE.Color(0x000000), transparent ? 0 : 1)
        }
      >
        {/* Outer Suspense must wrap <Physics> because Physics itself suspends
            while the Rapier WASM loads (suspend(importRapier)). If that
            bubbled out to Hero's Suspense the Canvas would unmount.
            Inner Suspense wraps only <Band> so swapping strap textures
            (light/dark spam) suspends just the band mesh, NOT the Physics
            world — prevents physics world destroy/recreate OOM on spam. */}
        <Suspense fallback={null}>
          <ambientLight intensity={Math.PI} />
          <Physics gravity={gravity} timeStep={1 / 60} numSolverIterations={8} numAdditionalFrictionIterations={2}>
            <Suspense fallback={null}>
              <Band
                isMobile={isMobile}
                isHacker={isHacker}
                isDark={isDark}
                frontImage={frontImage}
                backImage={backImage}
                imageFit={imageFit}
                lanyardImage={lanyardImage}
                lanyardWidth={lanyardWidth}
              />
            </Suspense>
            <Environment blur={0.6}>
              <Lightformer
                intensity={2}
                color="white"
                position={[0, -1, 5]}
                rotation={[0, 0, Math.PI / 3]}
                scale={[100, 0.1, 1]}
              />
              <Lightformer
                intensity={3}
                color="white"
                position={[-1, -1, 1]}
                rotation={[0, 0, Math.PI / 3]}
                scale={[100, 0.1, 1]}
              />
              <Lightformer
                intensity={6}
                color="white"
                position={[-10, 0, 14]}
                rotation={[0, Math.PI / 2, Math.PI / 3]}
                scale={[100, 10, 1]}
              />
            </Environment>
          </Physics>
        </Suspense>
      </Canvas>
      {/* B&W toast — appears on tug-shake or hidden phrase wiggle */}
      {toast && (
        <div className="lanyard-toast pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
          <div className="border border-ink bg-paper px-3.5 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
            <p className="font-mono text-[11px] tracking-[0.08em] uppercase text-ink whitespace-nowrap">
              {toast === "gwapo" ? "· gwapo si Robb — wiggle ·" : "· caught the tug — nice ·"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Band({
  maxSpeed = 50,
  minSpeed = 0,
  isMobile = false,
  isHacker = false,
  isDark = false,
  frontImage = null,
  backImage = null,
  _imageFit = "cover",
  lanyardImage = null,
  lanyardWidth = 1,
}) {
  const band = useRef(),
    fixed = useRef(),
    j1 = useRef(),
    j2 = useRef(),
    j3 = useRef(),
    card = useRef();
  const vecRef = useRef(new THREE.Vector3());
  const angRef = useRef(new THREE.Vector3());
  const rotRef = useRef(new THREE.Vector3());
  const dirRef = useRef(new THREE.Vector3());
  const segmentProps = {
    type: "dynamic",
    canSleep: true,
    colliders: false,
    angularDamping: 4,
    linearDamping: 4,
  };
  const { nodes, materials } = useGLTF(cardGLB);
  const strapSrc = lanyardImage || (isDark ? darkStrap : lightStrap) || lanyard;
  const texture = useTexture(strapSrc);
  const frontTex = useTexture(frontImage || BLANK_PIXEL);
  const backTex = useTexture(backImage || BLANK_PIXEL);

  const [curve] = useState(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
      ])
  );

  const cardMap = useMemo(() => {
    const baseMap = materials.base.map;
    if (!frontImage && !backImage) return baseMap;

    const baseImg = baseMap?.image;
    // guard: image must be fully decoded — prevents texSubImage2D: bad image data
    const baseReady =
      baseImg &&
      baseImg.width > 0 &&
      baseImg.height > 0 &&
      baseImg.complete !== false &&
      (baseImg.naturalWidth === undefined || baseImg.naturalWidth > 0) &&
      (baseImg.naturalHeight === undefined || baseImg.naturalHeight > 0);
    if (!baseReady) return baseMap;
    const W = baseImg.width;
    const H = baseImg.height;
    if (!W || !H) return baseMap;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return baseMap;
    try {
      ctx.drawImage(baseImg, 0, 0, W, H);
    } catch {
      return baseMap;
    }

    const drawFitted = (img, rect, scaleFactor = 0.5) => {
      if (!img || !img.width || !img.height || img.complete === false) return;
      if (img.naturalWidth === 0 || img.naturalHeight === 0) return;
      const rx = rect.x * W;
      const ry = rect.y * H;
      const rw = rect.w * W;
      const rh = rect.h * H;
      if (!rw || !rh) return;

      // Clear the underlying default graphic (atom icon) with clean white
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(rx, ry, rw, rh);

      // Compute centered dimensions with breathing room
      const targetW = rw * scaleFactor;
      const targetH = rh * scaleFactor;
      const scale = Math.min(targetW / img.width, targetH / img.height);
      if (!isFinite(scale) || scale <= 0) return;
      const dw = img.width * scale;
      const dh = img.height * scale;
      const dx = rx + (rw - dw) / 2;
      const dy = ry + (rh - dh) / 2;

      ctx.drawImage(img, dx, dy, dw, dh);
    };

    // Only draw if image is actually decoded
    const frontReady = frontTex?.image && frontTex.image.width > 0 && frontTex.image.height > 0 && frontTex.image.complete !== false;
    const backReady = backTex?.image && backTex.image.width > 0 && backTex.image.height > 0 && backTex.image.complete !== false;

    if (frontImage && frontReady) drawFitted(frontTex.image, FRONT_UV_RECT, 0.48);
    if (backImage && backReady) {
      drawFitted(backTex.image, BACK_UV_RECT, 0.48);
    } else if (frontImage && frontReady) {
      drawFitted(frontTex.image, BACK_UV_RECT, 0.48);
    }

    // hacker/matrix overlay — green tint + scan grid + neon border
    if (isHacker) {
      // green wash
      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = "rgba(0,255,136,0.22)";
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "overlay";
      ctx.fillStyle = "rgba(0,255,136,0.14)";
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "source-over";
      // subtle grid on card
      ctx.strokeStyle = "rgba(0,255,136,0.08)";
      ctx.lineWidth = 1;
      const step = Math.max(12, W * 0.02);
      for (let x = 0; x < W; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      // neon border
      ctx.strokeStyle = "rgba(0,255,136,0.55)";
      ctx.lineWidth = Math.max(6, W * 0.012);
      ctx.strokeRect(8, 8, W - 16, H - 16);
      ctx.strokeStyle = "rgba(0,255,136,0.18)";
      ctx.lineWidth = Math.max(2, W * 0.004);
      ctx.strokeRect(14, 14, W - 28, H - 28);
      // matrix glyphs footer on card (decorative)
      ctx.fillStyle = "rgba(0,255,136,0.85)";
      ctx.font = `${Math.max(10, W * 0.018)}px "JetBrains Mono", monospace`;
      ctx.textAlign = "center";
      ctx.fillText("▓ MATRIX ACCESS ▓  0101 1100  ::  root@robb", W / 2, H - 28);
    }

    const composite = new THREE.CanvasTexture(canvas);
    composite.colorSpace = THREE.SRGBColorSpace;
    composite.flipY = baseMap.flipY;
    composite.anisotropy = 8;
    // non-POT canvas + no mipmaps avoids bad-image / incomplete-mipmap uploads
    composite.generateMipmaps = false;
    composite.minFilter = THREE.LinearFilter;
    composite.magFilter = THREE.LinearFilter;
    composite.needsUpdate = true;
    return composite;
  }, [frontImage, backImage, frontTex, backTex, materials.base.map, isHacker]);

  // Dispose the composite canvas texture when replaced/unmounted
  useEffect(() => {
    return () => {
      if (cardMap && cardMap.isCanvasTexture) cardMap.dispose();
    };
  }, [cardMap]);

  // Side-effects that must NOT run during render
  useEffect(() => {
    curve.curveType = "chordal";
  }, [curve]);

  useEffect(() => {
    if (!texture?.image) return;
    const img = texture.image;
    const ready =
      img.width > 0 &&
      img.height > 0 &&
      img.complete !== false &&
      (img.naturalWidth === undefined || img.naturalWidth > 0);
    if (!ready) return;
    // only set wrap/repeat once to avoid extra uploads
    if (texture.wrapS !== THREE.RepeatWrapping) {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.anisotropy = 4;
      texture.needsUpdate = true;
    }
  }, [texture, strapSrc]);
  const [dragged, drag] = useState(false);
  const [hovered, hover] = useState(false);

  // --- flip-on-click state ---
  const [flipped, setFlipped] = useState(false);
  const flipGroupRef = useRef();
  const flipAngle = useRef(0);
  const clickStart = useRef(null);

  // --- easter egg: tug-shake (physical) + wiggle on hidden phrase ---
  const [easterFlash, setEasterFlash] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const dragTimesRef = useRef([]);
  const easterCooldownRef = useRef(0);

  const triggerEaster = useCallback((cause = "tug") => {
    const now = performance.now();
    if (now - easterCooldownRef.current < 2200) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    easterCooldownRef.current = now;
    setEasterFlash(true);
    window.dispatchEvent(new CustomEvent("lanyard:easter", { detail: cause }));
    setShowToast(cause);
    // physics burst — stays B&W, just kinetic
    try {
      const impulse = {
        x: (Math.random() - 0.5) * 14,
        y: 18 + Math.random() * 6,
        z: (Math.random() - 0.5) * 10,
      };
      card.current?.applyImpulse(impulse, true);
      card.current?.applyTorqueImpulse({ x: (Math.random() - 0.5) * 6, y: (Math.random() - 0.5) * 8, z: (Math.random() - 0.5) * 6 }, true);
      // playful double flip
      setFlipped((f) => !f);
      setTimeout(() => setFlipped((f) => !f), 420);
    } catch {}
    setTimeout(() => setEasterFlash(false), 720);
    setTimeout(() => setShowToast(false), 3000);
  }, []);

  // hidden phrase "gwaposirobb" → wiggle via EasterEggs
  useEffect(() => {
    const onWiggle = () => triggerEaster("gwapo");
    window.addEventListener("easter:wiggle", onWiggle);
    return () => window.removeEventListener("easter:wiggle", onWiggle);
  }, [triggerEaster]);

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, 1.5, 0],
  ]);

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? "grabbing" : "grab";
      return () => void (document.body.style.cursor = "auto");
    }
  }, [hovered, dragged]);

  useFrame((state, delta) => {
    // Guard: physics refs may not be ready on first frames
    if (!fixed.current || !j1.current || !j2.current || !j3.current || !card.current || !band.current) return;
    // Clamp delta to avoid explosion after tab switch / lag
    const d = Math.min(delta, 1 / 30);

    if (dragged) {
      const vec = vecRef.current;
      const dir = dirRef.current;
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp());
      card.current?.setNextKinematicTranslation({
        x: vec.x - dragged.x,
        y: vec.y - dragged.y,
        z: vec.z - dragged.z,
      });
    }
    try {
      [j1, j2].forEach((ref) => {
        const t = ref.current.translation();
        if (!t) return;
        if (!ref.current.lerped) {
          ref.current.lerped = new THREE.Vector3().copy(t);
        } else {
          const clampedDistance = Math.max(0.1, Math.min(1, ref.current.lerped.distanceTo(t)));
          ref.current.lerped.lerp(t, d * (minSpeed + clampedDistance * (maxSpeed - minSpeed)));
        }
      });
      const t3 = j3.current.translation();
      const t1 = j1.current.lerped;
      const t2 = j2.current.lerped;
      const t0 = fixed.current.translation();
      if (!t3 || !t1 || !t2 || !t0) return;
      // Guard against NaN translations (physics explosion)
      if ([t3, t1, t2, t0].some((v) => !isFinite(v.x) || !isFinite(v.y) || !isFinite(v.z))) return;

      curve.points[0].copy(t3);
      curve.points[1].copy(t2);
      curve.points[2].copy(t1);
      curve.points[3].copy(t0);
      const pts = curve.getPoints(isMobile ? 16 : 32);
      // Extra guard: ensure no NaN in curve points
      if (pts.some((p) => !isFinite(p.x) || !isFinite(p.y) || !isFinite(p.z))) return;
      band.current.geometry.setPoints(pts);

      const ang = angRef.current;
      const rot = rotRef.current;
      ang.copy(card.current.angvel());
      rot.copy(card.current.rotation());
      if (isFinite(ang.x) && isFinite(ang.y) && isFinite(ang.z) && isFinite(rot.y)) {
        card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z });
      }
    } catch {
      // physics not ready — skip frame
    }

    // animate the flip, independent of the physics rotation above
    if (flipGroupRef.current) {
      flipAngle.current = THREE.MathUtils.damp(flipAngle.current, flipped ? Math.PI : 0, 6, d);
      flipGroupRef.current.rotation.y = flipAngle.current;
    }
  });

  return (
    <>
      <group position={[0, 4, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody
          position={[2, 0, 0]}
          ref={card}
          {...segmentProps}
          type={dragged ? "kinematicPosition" : "dynamic"}
        >
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            scale={2.25}
            position={[0, -1.2, -0.05]}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={(e) => {
              e.target.releasePointerCapture(e.pointerId);
              drag(false);

              // easter: count quick tugs (releases) in a 2.5s window
              const t = performance.now();
              dragTimesRef.current.push(t);
              dragTimesRef.current = dragTimesRef.current.filter((v) => t - v < 2500);
              if (dragTimesRef.current.length >= 4) {
                dragTimesRef.current = [];
                triggerEaster("tug");
              }

              // was this a click (no real drag) or an actual drag? only flip on click
              if (clickStart.current) {
                const dx = e.clientX - clickStart.current.x;
                const dy = e.clientY - clickStart.current.y;
                const dt = performance.now() - clickStart.current.time;
                if (Math.hypot(dx, dy) < 6 && dt < 300) {
                  setFlipped((f) => !f);
                }
                clickStart.current = null;
              }
            }}
            onPointerDown={(e) => {
              e.target.setPointerCapture(e.pointerId);
              clickStart.current = {
                x: e.clientX,
                y: e.clientY,
                time: performance.now(),
              };
              drag(new THREE.Vector3().copy(e.point).sub(vecRef.current.copy(card.current.translation())));
            }}
          >
            {/* only the card face flips — the clip/clamp hardware stays put */}
            <group ref={flipGroupRef}>
              <mesh geometry={nodes.card.geometry}>
                <meshPhysicalMaterial
                  map={cardMap}
                  map-anisotropy={8}
                  clearcoat={1}
                  clearcoatRoughness={isHacker ? 0.22 : 0.12}
                  roughness={isHacker ? 0.42 : 0.85}
                  metalness={isHacker ? 0.2 : 0.5}
                  emissive={isHacker ? "#00ff88" : "#000000"}
                  emissiveIntensity={isHacker ? 0.18 : 0}
                  color={isHacker ? "#e8fff2" : "#ffffff"}
                />
              </mesh>
            </group>
            <mesh geometry={nodes.clip.geometry} material={materials.metal} material-roughness={isHacker ? 0.18 : 0.3} material-metalness={isHacker ? 0.9 : 0} material-color={isHacker ? "#00ff88" : undefined} material-emissive={isHacker ? "#00ff88" : undefined} material-emissiveIntensity={isHacker ? 0.12 : 0} />
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} material-color={isHacker ? "#072012" : undefined} />
          </group>
        </RigidBody>
      </group>
      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial
          color={isHacker ? "#00ff88" : easterFlash ? "#0d0d0d" : "white"}
          depthTest={false}
          resolution={isMobile ? [1000, 2000] : [1000, 1000]}
          useMap={!isHacker}
          map={texture}
          repeat={[-4, 1]}
          lineWidth={isHacker ? lanyardWidth * 1.55 : easterFlash ? lanyardWidth * 1.35 : lanyardWidth}
          transparent={isHacker}
          opacity={isHacker ? 0.95 : 1}
        />
      </mesh>
    </>
  );
}

// NOTE: Do NOT useGLTF.preload / useTexture.preload here.
// Preloading makes assets resolve synchronously on the first commit, so <Band>
// mounts in the same commit as <Physics>. Child joint effects would then run
// BEFORE Rapier's world exists, the rope joints attach to nothing, and the
// card free-falls off-screen on first load (only a remount fixes it).
// Instead we let the inner <Suspense> delay <Band> until assets resolve, by
// which point <Physics> has already created its world.
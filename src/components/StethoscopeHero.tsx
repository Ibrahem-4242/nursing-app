'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Stethoscope, RotateCw, Sparkles } from 'lucide-react';

export default function StethoscopeHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene setup
    const scene = new THREE.Scene();

    // 2. Camera setup
    const width = container.clientWidth || 480;
    const height = container.clientHeight || 440;
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.6, 11);

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.appendChild(renderer.domElement);

    // 4. Studio Lighting for metallic chrome and rubber gloss
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x2dd4bf, 3.5); // Teal clinical rim
    keyLight.position.set(8, 12, 10);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 2.5); // Sky blue fill
    fillLight.position.set(-10, -6, 6);
    scene.add(fillLight);

    const pointLight = new THREE.PointLight(0xffffff, 3.0, 15);
    pointLight.position.set(0, 1, 4);
    scene.add(pointLight);

    // 5. Materials
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      metalness: 0.95,
      roughness: 0.15,
    });

    const tealRubberMat = new THREE.MeshStandardMaterial({
      color: 0x0d9488,
      metalness: 0.2,
      roughness: 0.35,
    });

    const darkAcousticMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.4,
      roughness: 0.5,
    });

    const siliconeEartipMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.1,
      roughness: 0.6,
    });

    // 6. Construct 3D Stethoscope Group
    const stethGroup = new THREE.Group();

    // A. Chestpiece (القرص والرأس المعدني)
    const chestpieceGroup = new THREE.Group();

    // Main Diaphragm Outer Chrome Casing
    const outerCasingGeo = new THREE.CylinderGeometry(1.3, 1.4, 0.35, 48);
    const outerCasing = new THREE.Mesh(outerCasingGeo, chromeMat);
    outerCasing.rotation.x = Math.PI / 2;
    chestpieceGroup.add(outerCasing);

    // Inner Acoustic Dark Diaphragm Face
    const diaphragmFaceGeo = new THREE.CylinderGeometry(1.15, 1.15, 0.38, 48);
    const diaphragmFace = new THREE.Mesh(diaphragmFaceGeo, darkAcousticMat);
    diaphragmFace.rotation.x = Math.PI / 2;
    chestpieceGroup.add(diaphragmFace);

    // Outer Rim Accent Ring
    const rimRingGeo = new THREE.TorusGeometry(1.28, 0.08, 16, 48);
    const rimRing = new THREE.Mesh(rimRingGeo, chromeMat);
    chestpieceGroup.add(rimRing);

    // Back Bell Chrome Casing
    const bellGeo = new THREE.CylinderGeometry(0.7, 0.85, 0.25, 32);
    const bell = new THREE.Mesh(bellGeo, chromeMat);
    bell.position.z = -0.28;
    bell.rotation.x = Math.PI / 2;
    chestpieceGroup.add(bell);

    // Stem Connector from Chestpiece to Tubing
    const stemGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.9, 24);
    const stem = new THREE.Mesh(stemGeo, chromeMat);
    stem.position.set(0, 1.5, 0);
    chestpieceGroup.add(stem);

    chestpieceGroup.position.set(0, -2.1, 0.4);
    stethGroup.add(chestpieceGroup);

    // B. Flexible Rubber Tubing (الخرطوم المطاطي التوربيني المنحني بنعومة)
    const tubePoints = [
      new THREE.Vector3(0, -1.2, 0.4),    // Starting from stem
      new THREE.Vector3(0.4, -0.6, 0.3),
      new THREE.Vector3(1.6, 0.2, -0.2),   // Curved body
      new THREE.Vector3(1.7, 1.2, -0.3),
      new THREE.Vector3(0.9, 1.9, -0.1),
      new THREE.Vector3(0, 2.2, 0),        // At Y-Split
    ];
    const tubeCurve = new THREE.CatmullRomCurve3(tubePoints);
    const tubeGeo = new THREE.TubeGeometry(tubeCurve, 64, 0.22, 20, false);
    const tubing = new THREE.Mesh(tubeGeo, tealRubberMat);
    stethGroup.add(tubing);

    // C. Metallic Y-Connector (وصلة التفرع المعدنية)
    const ySplitGeo = new THREE.SphereGeometry(0.28, 20, 20);
    const ySplit = new THREE.Mesh(ySplitGeo, chromeMat);
    ySplit.position.set(0, 2.2, 0);
    stethGroup.add(ySplit);

    // D. Left Binaural Chrome Tube (أنبوب الأذن الأيسر)
    const leftPoints = [
      new THREE.Vector3(0, 2.2, 0),
      new THREE.Vector3(-0.7, 2.9, 0.1),
      new THREE.Vector3(-1.4, 3.6, 0.3),
      new THREE.Vector3(-1.7, 4.3, 0.5),
    ];
    const leftCurve = new THREE.CatmullRomCurve3(leftPoints);
    const leftTubeGeo = new THREE.TubeGeometry(leftCurve, 32, 0.11, 16, false);
    const leftTube = new THREE.Mesh(leftTubeGeo, chromeMat);
    stethGroup.add(leftTube);

    // Left Eartip
    const leftTipGeo = new THREE.SphereGeometry(0.24, 16, 16);
    const leftTip = new THREE.Mesh(leftTipGeo, siliconeEartipMat);
    leftTip.scale.set(1, 1.4, 1);
    leftTip.position.set(-1.7, 4.35, 0.5);
    stethGroup.add(leftTip);

    // E. Right Binaural Chrome Tube (أنبوب الأذن الأيمن)
    const rightPoints = [
      new THREE.Vector3(0, 2.2, 0),
      new THREE.Vector3(0.7, 2.9, 0.1),
      new THREE.Vector3(1.4, 3.6, 0.3),
      new THREE.Vector3(1.7, 4.3, 0.5),
    ];
    const rightCurve = new THREE.CatmullRomCurve3(rightPoints);
    const rightTubeGeo = new THREE.TubeGeometry(rightCurve, 32, 0.11, 16, false);
    const rightTube = new THREE.Mesh(rightTubeGeo, chromeMat);
    stethGroup.add(rightTube);

    // Right Eartip
    const rightTipGeo = new THREE.SphereGeometry(0.24, 16, 16);
    const rightTip = new THREE.Mesh(rightTipGeo, siliconeEartipMat);
    rightTip.scale.set(1, 1.4, 1);
    rightTip.position.set(1.7, 4.35, 0.5);
    stethGroup.add(rightTip);

    // F. Tension Spring Arch (قوس التثبيت المعدني بين الأنبوبين)
    const springPoints = [
      new THREE.Vector3(-0.8, 3.0, 0.12),
      new THREE.Vector3(0, 2.85, 0.05),
      new THREE.Vector3(0.8, 3.0, 0.12),
    ];
    const springCurve = new THREE.CatmullRomCurve3(springPoints);
    const springGeo = new THREE.TubeGeometry(springCurve, 20, 0.06, 12, false);
    const springArch = new THREE.Mesh(springGeo, chromeMat);
    stethGroup.add(springArch);

    // Center and scale group
    stethGroup.position.set(0, -0.6, 0);
    stethGroup.scale.set(1.15, 1.15, 1.15);
    scene.add(stethGroup);

    // 7. Interactive Mouse Tracking
    let mouseX = 0;
    let mouseY = 0;
    let targetRotY = 0;
    let targetRotX = 0;
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      mouseX = (x / rect.width) * 2;
      mouseY = -(y / rect.height) * 2;

      if (isDragging) {
        const deltaX = event.clientX - prevMouseX;
        const deltaY = event.clientY - prevMouseY;
        stethGroup.rotation.y += deltaX * 0.015;
        stethGroup.rotation.x += deltaY * 0.015;
        prevMouseX = event.clientX;
        prevMouseY = event.clientY;
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    // Touch support for mobile interaction
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        prevMouseX = e.touches[0].clientX;
        prevMouseY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - prevMouseX;
      const deltaY = e.touches[0].clientY - prevMouseY;
      stethGroup.rotation.y += deltaX * 0.015;
      stethGroup.rotation.x += deltaY * 0.015;
      prevMouseX = e.touches[0].clientX;
      prevMouseY = e.touches[0].clientY;
    };

    const handleTouchEnd = () => {
      isDragging = false;
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    // 8. Resize listener
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);
    setIsLoaded(true);

    // 9. Animation loop with smooth breathing and mouse response
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      if (!isDragging) {
        // Natural gentle breathing float
        const floatY = Math.sin(elapsedTime * 1.5) * 0.12;
        stethGroup.position.y = -0.6 + floatY;

        // Smooth mouse target follow
        targetRotY += (mouseX * 0.7 - targetRotY) * 0.06;
        targetRotX += (mouseY * 0.4 - targetRotX) * 0.06;

        stethGroup.rotation.y = targetRotY + Math.sin(elapsedTime * 0.8) * 0.1;
        stethGroup.rotation.x = -targetRotX;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 10. Cleanup
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      renderer.dispose();
      outerCasingGeo.dispose();
      diaphragmFaceGeo.dispose();
      rimRingGeo.dispose();
      bellGeo.dispose();
      stemGeo.dispose();
      tubeGeo.dispose();
      ySplitGeo.dispose();
      leftTubeGeo.dispose();
      rightTubeGeo.dispose();
      leftTipGeo.dispose();
      rightTipGeo.dispose();
      springGeo.dispose();
      chromeMat.dispose();
      tealRubberMat.dispose();
      darkAcousticMat.dispose();
      siliconeEartipMat.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[400px] sm:h-[450px] md:h-[480px] rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-850 to-teal-950/70 shadow-2xl border border-teal-500/25 flex items-center justify-center select-none">
      {/* 3D Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing relative z-10"
      />

      {/* Chic Top Floating Badge */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-teal-500/30 text-teal-300 text-xs shadow-lg pointer-events-none">
        <Stethoscope className="w-4 h-4 text-teal-400" />
        <span className="font-bold">سماعة تمريضية تفاعلية 3D</span>
      </div>

      {/* Subtle Hint Badge at Bottom Left */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-sm px-3 py-1 rounded-xl border border-slate-700/60 text-[11px] text-slate-300 pointer-events-none">
        <RotateCw className="w-3.5 h-3.5 text-teal-400 animate-spin" style={{ animationDuration: '6s' }} />
        <span>حرّك الماوس للتدوير التفاعلي بزاوية 360°</span>
      </div>

      {/* Loading state before canvas init */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-teal-400 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
            <span>جارِ تحميل المجسم التفاعلي...</span>
          </div>
        </div>
      )}
    </div>
  );
}

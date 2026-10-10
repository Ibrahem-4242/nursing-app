'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RotateCw, ZoomIn, ZoomOut, Eye, Sparkles, Layers } from 'lucide-react';

interface MedicalOrganViewerProps {
  organType?: 'heart' | 'dna' | 'cell' | 'brain' | 'lungs';
  title?: string;
  subtitle?: string;
}

export default function MedicalOrganViewer({
  organType = 'heart',
  title = 'المجسم التفاعلي ثلاثي الأبعاد لعضلة القلب (Cardiovascular Anatomy 3D)',
  subtitle = 'استخدم الفأرة للتدوير بزاوية 360° وفحص الصمامات والحجرات والشرايين التاجية',
}: MedicalOrganViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [wireframe, setWireframe] = useState(false);
  const [isPulsing, setIsPulsing] = useState(true);
  const [selectedLayer, setSelectedLayer] = useState<'all' | 'myo' | 'valves'>('all');

  // References to manipulate scene from React controls
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const mainMeshRef = useRef<THREE.Mesh | null>(null);
  const vesselsGroupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const width = container.clientWidth || 500;
    const height = container.clientHeight || 350;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(renderer.domElement);

    // 4. Lights
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x0f172a, 1.2);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0x0d9488, 2.5);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    const rimLight = new THREE.PointLight(0x38bdf8, 3, 20);
    rimLight.position.set(-5, -5, 3);
    scene.add(rimLight);

    // 5. Build Anatomical Model based on type
    const organGroup = new THREE.Group();

    // Heart main muscular mass (Compound Anatomical Shape)
    const heartGeometry = new THREE.TorusKnotGeometry(1.3, 0.45, 100, 16, 2, 3);
    const heartMaterial = new THREE.MeshStandardMaterial({
      color: 0xbe123c, // Deep anatomical red / crimson
      roughness: 0.35,
      metalness: 0.25,
      wireframe: false,
    });
    const mainMesh = new THREE.Mesh(heartGeometry, heartMaterial);
    organGroup.add(mainMesh);
    mainMeshRef.current = mainMesh;

    // Great Vessels (Aorta and Pulmonary Artery representation)
    const vesselsGroup = new THREE.Group();
    const aortaGeo = new THREE.CylinderGeometry(0.28, 0.35, 1.8, 24);
    const aortaMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      roughness: 0.3,
    });
    const aorta = new THREE.Mesh(aortaGeo, aortaMat);
    aorta.position.set(0.4, 1.4, -0.2);
    aorta.rotation.z = -0.25;
    vesselsGroup.add(aorta);

    const pulmonaryGeo = new THREE.CylinderGeometry(0.24, 0.3, 1.6, 24);
    const pulmonaryMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Deoxygenated blue
      roughness: 0.3,
    });
    const pulmonary = new THREE.Mesh(pulmonaryGeo, pulmonaryMat);
    pulmonary.position.set(-0.4, 1.3, 0.2);
    pulmonary.rotation.z = 0.25;
    vesselsGroup.add(pulmonary);

    // Coronary Arteries (Golden/Orange branch rings)
    const coronaryGeo = new THREE.TorusGeometry(1.6, 0.04, 16, 100);
    const coronaryMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.4,
    });
    const coronary = new THREE.Mesh(coronaryGeo, coronaryMat);
    coronary.rotation.x = Math.PI / 3;
    vesselsGroup.add(coronary);

    organGroup.add(vesselsGroup);
    vesselsGroupRef.current = vesselsGroup;

    scene.add(organGroup);

    // 6. Interactive Drag Controls (Manual Orbit)
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      organGroup.rotation.y += deltaX * 0.01;
      organGroup.rotation.x += deltaY * 0.01;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    // Touch support for mobile
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        prevMouseX = e.touches[0].clientX;
        prevMouseY = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - prevMouseX;
      const deltaY = e.touches[0].clientY - prevMouseY;
      organGroup.rotation.y += deltaX * 0.01;
      organGroup.rotation.x += deltaY * 0.01;
      prevMouseX = e.touches[0].clientX;
      prevMouseY = e.touches[0].clientY;
    };

    const onTouchEnd = () => {
      isDragging = false;
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    container.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    // 7. Resize handling
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // 8. Animation loop
    let animId: number;
    let clock = new THREE.Clock();

    const renderLoop = () => {
      animId = requestAnimationFrame(renderLoop);
      const time = clock.getElapsedTime();

      // Idle gentle rotation
      if (!isDragging) {
        organGroup.rotation.y += 0.006;
      }

      // Cardiac Pulse
      if (isPulsing) {
        const beatCycle = time * 3.5;
        // Two-stroke heartbeat simulation (Lub-Dub)
        const lub = Math.exp(-Math.pow((beatCycle % Math.PI) - 0.8, 2) * 20) * 0.08;
        const dub = Math.exp(-Math.pow((beatCycle % Math.PI) - 1.4, 2) * 20) * 0.05;
        const pulse = 1 + lub + dub;
        organGroup.scale.set(pulse, pulse, pulse);
      } else {
        organGroup.scale.set(1, 1, 1);
      }

      renderer.render(scene, camera);
    };

    renderLoop();

    // 9. Cleanup
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      renderer.dispose();
      heartGeometry.dispose();
      heartMaterial.dispose();
      aortaGeo.dispose();
      aortaMat.dispose();
      pulmonaryGeo.dispose();
      pulmonaryMat.dispose();
      coronaryGeo.dispose();
      coronaryMat.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isPulsing]);

  // Handle wireframe toggle
  useEffect(() => {
    if (mainMeshRef.current) {
      const mat = mainMeshRef.current.material as THREE.MeshStandardMaterial;
      mat.wireframe = wireframe;
      mat.color.set(wireframe ? 0x2dd4bf : 0xbe123c);
    }
  }, [wireframe]);

  const handleZoom = (direction: 'in' | 'out') => {
    if (!cameraRef.current) return;
    const currentZ = cameraRef.current.position.z;
    if (direction === 'in' && currentZ > 3.5) {
      cameraRef.current.position.z -= 0.8;
    } else if (direction === 'out' && currentZ < 10) {
      cameraRef.current.position.z += 0.8;
    }
  };

  const handleResetCamera = () => {
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 0, 7);
    }
  };

  return (
    <div className="w-full my-8 bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl" dir="rtl">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-slate-800/80 border-b border-slate-700/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <h3 className="text-base font-bold text-white tracking-wide">{title}</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        </div>

        {/* View Tools */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWireframe(!wireframe)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              wireframe
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/50'
                : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
            }`}
            title="تبديل النمط الهيكلي"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{wireframe ? 'نمط شبكي (Wireframe)' : 'نمط نسيجي طبيعي'}</span>
          </button>

          <button
            onClick={() => setIsPulsing(!isPulsing)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              isPulsing
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
            }`}
            title="نبض فسيولوجي"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isPulsing ? 'النبض الحيوي نشط' : 'إيقاف النبض'}</span>
          </button>
        </div>
      </div>

      {/* 3D Canvas Container */}
      <div className="relative w-full h-[360px] sm:h-[420px] bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center">
        <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Floating Zoom & Reset controls */}
        <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 bg-slate-800/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700 shadow-xl">
          <button
            onClick={() => handleZoom('in')}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-xl transition"
            title="تكبير (Zoom In)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom('out')}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-xl transition"
            title="تصغير (Zoom Out)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-slate-700 my-auto" />
          <button
            onClick={handleResetCamera}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-xl transition"
            title="إعادة ضبط زاوية الرؤية"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Anatomical Color Guide (Legend) */}
        <div className="absolute top-4 right-4 z-10 hidden sm:flex flex-col gap-2 bg-slate-800/80 backdrop-blur-md p-3 rounded-2xl border border-slate-700/60 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-600"></span>
            <span>عضلة القلب (Myocardium)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-800"></span>
            <span>الأبهر (Aorta) - دم مؤكسج</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-sky-600"></span>
            <span>الشريان الرئوي (Pulmonary)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
            <span>الشرايين التاجية (Coronary)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

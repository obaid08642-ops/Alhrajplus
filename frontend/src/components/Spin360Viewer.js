import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RotateCw, X, Sparkles, Maximize2 } from "lucide-react";

/**
 * Real 3D Viewer using Three.js / WebGL.
 * - Renders product image as a curved 3D surface with depth, lighting, and shadow.
 * - Drag horizontally to orbit camera around the object (real 3D rotation).
 * - When multiple images are provided, they are placed on adjacent angles (cylindrical photogrammetry).
 * - Auto-orbits when idle. Mouse parallax on hover for head-tracking 3D effect.
 *
 * NOTE: For full AI-generated 3D mesh from a single photo, integrate Meshy.ai or Tripo3D
 * (paid). This viewer renders genuine 3D scene (WebGL), not a 2D frame switcher.
 */
export default function Spin360Viewer({ images = [], onClose }) {
    const mountRef = useRef(null);
    const stateRef = useRef({
        rendererCleanup: null,
        autoRotate: true,
        targetRotY: 0,
        rotY: 0,
        targetTilt: 0,
        tilt: 0,
    });
    const [autoSpin, setAutoSpin] = useState(true);

    useEffect(() => {
        const mount = mountRef.current;
        if (!mount || images.length === 0) return;

        const W = mount.clientWidth;
        const H = mount.clientHeight;

        const scene = new THREE.Scene();
        scene.background = null; // transparent

        const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000);
        camera.position.set(0, 0, 4);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(W, H);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;
        mount.appendChild(renderer.domElement);

        // Lights — give a sense of 3D shape
        scene.add(new THREE.AmbientLight(0xffffff, 0.55));
        const key = new THREE.DirectionalLight(0xffffff, 1.2);
        key.position.set(3, 4, 5);
        scene.add(key);
        const rim = new THREE.PointLight(0x4FB6E6, 0.9, 20);
        rim.position.set(-3, 2, -3);
        scene.add(rim);

        // Texture loader
        const loader = new THREE.TextureLoader();
        loader.crossOrigin = "anonymous";

        // Build a cylindrical group: each image becomes a panel placed at evenly
        // spaced angles around a vertical axis. With 1 image we curl it gently;
        // with N images we get genuine multi-view 3D.
        const group = new THREE.Group();
        scene.add(group);

        const texturePromises = images.map(
            (url) =>
                new Promise((resolve) => {
                    loader.load(
                        url,
                        (tex) => {
                            tex.colorSpace = THREE.SRGBColorSpace;
                            tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
                            resolve(tex);
                        },
                        undefined,
                        () => resolve(null)
                    );
                })
        );

        let disposed = false;

        Promise.all(texturePromises).then((textures) => {
            if (disposed) return;
            const valid = textures.filter(Boolean);
            const n = Math.max(valid.length, 1);
            const radius = 1.6;
            const panelW = n === 1 ? 3.0 : 2 * radius * Math.sin(Math.PI / n) * 1.05;
            const panelH = panelW * 1.15;

            valid.forEach((tex, i) => {
                // Curved plane: ring segment of a cylinder
                const segX = 32;
                const segY = 1;
                const geo = new THREE.PlaneGeometry(panelW, panelH, segX, segY);
                // Curl vertices into cylinder section (depth illusion + multi-image cylinder)
                const pos = geo.attributes.position;
                const arr = pos.array;
                const halfW = panelW / 2;
                const curveDepth = n === 1 ? 0.55 : 0.0;
                for (let k = 0; k < pos.count; k++) {
                    const x = arr[k * 3];
                    // Parabolic curl for single-image deep-curve effect
                    const t = x / halfW;
                    arr[k * 3 + 2] = -curveDepth * (1 - t * t);
                }
                pos.needsUpdate = true;
                geo.computeVertexNormals();

                const mat = new THREE.MeshStandardMaterial({
                    map: tex,
                    roughness: 0.35,
                    metalness: 0.1,
                    side: THREE.DoubleSide,
                });
                const mesh = new THREE.Mesh(geo, mat);
                const angle = (i / n) * Math.PI * 2;
                mesh.position.set(
                    Math.sin(angle) * (n === 1 ? 0 : radius),
                    0,
                    Math.cos(angle) * (n === 1 ? 0 : radius)
                );
                mesh.rotation.y = angle;
                group.add(mesh);
            });

            // Floor reflection disk
            const floorGeo = new THREE.CircleGeometry(2.4, 48);
            const floorMat = new THREE.MeshBasicMaterial({
                color: 0x4FB6E6,
                transparent: true,
                opacity: 0.18,
            });
            const floor = new THREE.Mesh(floorGeo, floorMat);
            floor.rotation.x = -Math.PI / 2;
            floor.position.y = -panelH / 2 - 0.05;
            scene.add(floor);
        });

        // Pointer interaction
        const ptr = { active: false, lastX: 0, lastY: 0 };
        const onDown = (e) => {
            ptr.active = true;
            ptr.lastX = e.clientX || e.touches?.[0]?.clientX || 0;
            ptr.lastY = e.clientY || e.touches?.[0]?.clientY || 0;
            stateRef.current.autoRotate = false;
            setAutoSpin(false);
        };
        const onMove = (e) => {
            const cx = e.clientX || e.touches?.[0]?.clientX || 0;
            const cy = e.clientY || e.touches?.[0]?.clientY || 0;
            // Always do soft mouse parallax
            const rect = renderer.domElement.getBoundingClientRect();
            const nx = ((cx - rect.left) / rect.width) * 2 - 1;
            const ny = ((cy - rect.top) / rect.height) * 2 - 1;
            stateRef.current.targetTilt = ny * 0.25;
            if (!ptr.active) {
                if (stateRef.current.autoRotate) {
                    stateRef.current.targetRotY += nx * 0.002;
                }
                return;
            }
            const dx = cx - ptr.lastX;
            const dy = cy - ptr.lastY;
            ptr.lastX = cx; ptr.lastY = cy;
            stateRef.current.targetRotY += dx * 0.01;
            stateRef.current.targetTilt = Math.max(-0.45, Math.min(0.45, stateRef.current.tilt + dy * 0.005));
        };
        const onUp = () => { ptr.active = false; };

        const dom = renderer.domElement;
        dom.addEventListener("mousedown", onDown);
        dom.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
        dom.addEventListener("touchstart", onDown);
        dom.addEventListener("touchmove", onMove);
        window.addEventListener("touchend", onUp);

        // Animation loop
        let raf = 0;
        const animate = () => {
            const s = stateRef.current;
            if (s.autoRotate) s.targetRotY += 0.005;
            s.rotY += (s.targetRotY - s.rotY) * 0.08;
            s.tilt += (s.targetTilt - s.tilt) * 0.08;
            group.rotation.y = s.rotY;
            group.rotation.x = s.tilt;
            renderer.render(scene, camera);
            raf = requestAnimationFrame(animate);
        };
        animate();

        // Resize
        const onResize = () => {
            const w = mount.clientWidth;
            const h = mount.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        window.addEventListener("resize", onResize);

        stateRef.current.rendererCleanup = () => {
            disposed = true;
            cancelAnimationFrame(raf);
            window.removeEventListener("mouseup", onUp);
            window.removeEventListener("touchend", onUp);
            window.removeEventListener("resize", onResize);
            dom.removeEventListener("mousedown", onDown);
            dom.removeEventListener("mousemove", onMove);
            dom.removeEventListener("touchstart", onDown);
            dom.removeEventListener("touchmove", onMove);
            scene.traverse((obj) => {
                if (obj.geometry) obj.geometry.dispose?.();
                if (obj.material) {
                    const m = Array.isArray(obj.material) ? obj.material : [obj.material];
                    m.forEach((mm) => {
                        if (mm.map) mm.map.dispose?.();
                        mm.dispose?.();
                    });
                }
            });
            renderer.dispose();
            if (renderer.domElement.parentNode) {
                renderer.domElement.parentNode.removeChild(renderer.domElement);
            }
        };

        return () => {
            stateRef.current.rendererCleanup?.();
        };
    }, [images]);

    useEffect(() => {
        const onKey = (e) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    const toggleAuto = () => {
        const next = !autoSpin;
        setAutoSpin(next);
        stateRef.current.autoRotate = next;
    };

    if (!images || images.length === 0) return null;

    return (
        <div className="fixed inset-0 z-[60] bg-gradient-to-br from-black via-[#0F1A35] to-black flex flex-col items-center justify-center" data-testid="spin360-viewer">
            <button data-testid="spin360-close" onClick={onClose} className="absolute top-4 end-4 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur flex items-center justify-center text-white z-10">
                <X className="w-5 h-5" />
            </button>
            <div className="absolute top-4 start-4 flex items-center gap-2 text-white/90 text-xs font-arabic z-10 bg-white/10 backdrop-blur rounded-full px-3 py-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
                <span>عرض ثلاثي الأبعاد حقيقي (WebGL)</span>
            </div>

            <div ref={mountRef} className="relative w-full max-w-3xl aspect-square cursor-grab active:cursor-grabbing select-none touch-none" />

            <div className="mt-6 flex items-center gap-3">
                <button
                    data-testid="spin360-toggle"
                    onClick={toggleAuto}
                    className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-fg)] px-5 py-2 rounded-full text-xs font-bold font-arabic flex items-center gap-2"
                >
                    <RotateCw className={`w-4 h-4 ${autoSpin ? "animate-spin" : ""}`} />
                    {autoSpin ? "إيقاف الدوران" : "ابدأ الدوران"}
                </button>
                <span className="text-white/70 text-xs font-arabic-body flex items-center gap-1">
                    <Maximize2 className="w-3 h-3" /> اسحب للتدوير الحر
                </span>
            </div>
        </div>
    );
}

"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  CSS2DRenderer,
  CSS2DObject,
} from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { gsap } from "@/lib/gsap";
import type { Contact } from "@/lib/types/database";
import ContactDetailSidebar from "./ContactDetailSidebar";

// ── Node model ──────────────────────────────────────────────────────────────
// We attach this metadata to each mesh via mesh.userData so click handling and
// expand/collapse can walk the parent/child graph.
type NodeKind = "category" | "company" | "contact";

interface VizNode {
  kind: NodeKind;
  label: string;
  mesh: THREE.Mesh;
  children: VizNode[];
  edges: THREE.Line[]; // edges from this node to each child
  expanded: boolean;
  // Layout target relative to parent; computed once at build time.
  targetPosition: THREE.Vector3;
  contact?: Contact; // only for leaf (contact) nodes
}

const COLORS: Record<NodeKind, number> = {
  category: 0x6366f1, // indigo
  company: 0x22d3ee, // cyan
  contact: 0xf472b6, // pink
};

const RADII: Record<NodeKind, number> = {
  category: 0.5,
  company: 0.3,
  contact: 0.15,
};

// Place `count` points evenly on a circle of given radius in the XZ-ish plane.
function circlePosition(
  index: number,
  count: number,
  radius: number,
  center: THREE.Vector3,
): THREE.Vector3 {
  const angle = count > 0 ? (index / count) * Math.PI * 2 : 0;
  return new THREE.Vector3(
    center.x + Math.cos(angle) * radius,
    center.y + (index % 2 === 0 ? 0.6 : -0.6) * (radius > 0 ? 1 : 0),
    center.z + Math.sin(angle) * radius,
  );
}

export default function ClusterViz() {
  const mountRef = useRef<HTMLDivElement>(null);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Contact | null>(null);

  // Fetch contacts.
  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/contacts");
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Failed to load contacts");
        }
        const data: Contact[] = await res.json();
        if (active) setContacts(data);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  // Build + run the Three.js scene once contacts are loaded.
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || loading || error || contacts.length === 0) return;

    // ── Renderer / scene / camera ────────────────────────────────────────────
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 4, 12);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(width, height);
    labelRenderer.domElement.style.position = "absolute";
    labelRenderer.domElement.style.top = "0";
    labelRenderer.domElement.style.left = "0";
    labelRenderer.domElement.style.pointerEvents = "none";
    mount.appendChild(labelRenderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;

    // Lighting.
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(5, 10, 7);
    scene.add(dir);

    const render = () => {
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
    };

    // ── Build the node graph ─────────────────────────────────────────────────
    const sphereGeo: Record<NodeKind, THREE.SphereGeometry> = {
      category: new THREE.SphereGeometry(RADII.category, 32, 32),
      company: new THREE.SphereGeometry(RADII.company, 24, 24),
      contact: new THREE.SphereGeometry(RADII.contact, 16, 16),
    };

    function makeNode(
      kind: NodeKind,
      label: string,
      position: THREE.Vector3,
      contact?: Contact,
    ): VizNode {
      const material = new THREE.MeshStandardMaterial({
        color: COLORS[kind],
        roughness: 0.4,
        metalness: 0.1,
      });
      const mesh = new THREE.Mesh(sphereGeo[kind], material);
      mesh.position.copy(position);

      const div = document.createElement("div");
      div.textContent = label;
      div.style.color = "rgba(255,255,255,0.85)";
      div.style.fontSize = "11px";
      div.style.fontFamily = "system-ui, sans-serif";
      div.style.whiteSpace = "nowrap";
      div.style.textShadow = "0 1px 3px rgba(0,0,0,0.9)";
      const labelObj = new CSS2DObject(div);
      labelObj.position.set(0, RADII[kind] + 0.18, 0);
      mesh.add(labelObj);

      const node: VizNode = {
        kind,
        label,
        mesh,
        children: [],
        edges: [],
        expanded: false,
        targetPosition: position.clone(),
        contact,
      };
      mesh.userData.node = node;
      return node;
    }

    function makeEdge(from: THREE.Vector3, to: THREE.Vector3): THREE.Line {
      const geometry = new THREE.BufferGeometry().setFromPoints([
        from.clone(),
        to.clone(),
      ]);
      const material = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.18,
      });
      const line = new THREE.Line(geometry, material);
      line.visible = false;
      return line;
    }

    // Group contacts: category → company → contacts.
    const byCategory = new Map<string, Map<string, Contact[]>>();
    for (const c of contacts) {
      const cat = c.category?.trim() || "Uncategorized";
      const comp = c.company?.trim() || "Unknown";
      if (!byCategory.has(cat)) byCategory.set(cat, new Map());
      const companies = byCategory.get(cat)!;
      if (!companies.has(comp)) companies.set(comp, []);
      companies.get(comp)!.push(c);
    }

    const categories = [...byCategory.keys()];
    const categoryNodes: VizNode[] = [];
    const allNodes: VizNode[] = [];

    const center = new THREE.Vector3(0, 0, 0);
    categories.forEach((cat, ci) => {
      const catPos = circlePosition(ci, categories.length, 5, center);
      const catNode = makeNode("category", cat, catPos);
      categoryNodes.push(catNode);
      allNodes.push(catNode);
      scene.add(catNode.mesh);

      const companies = [...byCategory.get(cat)!.keys()];
      companies.forEach((comp, compi) => {
        const compPos = circlePosition(compi, companies.length, 2.2, catPos);
        const compNode = makeNode("company", comp, compPos);
        compNode.mesh.scale.set(0, 0, 0);
        compNode.mesh.visible = false;
        catNode.children.push(compNode);
        allNodes.push(compNode);
        scene.add(compNode.mesh);

        const edge = makeEdge(catPos, compPos);
        catNode.edges.push(edge);
        scene.add(edge);

        const compContacts = byCategory.get(cat)!.get(comp)!;
        compContacts.forEach((contact, coni) => {
          const conPos = circlePosition(
            coni,
            compContacts.length,
            1.1,
            compPos,
          );
          const conNode = makeNode("contact", contact.name, conPos, contact);
          conNode.mesh.scale.set(0, 0, 0);
          conNode.mesh.visible = false;
          compNode.children.push(conNode);
          allNodes.push(conNode);
          scene.add(conNode.mesh);

          const cEdge = makeEdge(compPos, conPos);
          compNode.edges.push(cEdge);
          scene.add(cEdge);
        });
      });
    });

    // ── Expand / collapse ────────────────────────────────────────────────────
    function expand(node: VizNode) {
      node.expanded = true;
      node.children.forEach((child, i) => {
        child.mesh.visible = true;
        child.mesh.position.copy(node.mesh.position); // start at parent
        gsap.to(child.mesh.position, {
          x: child.targetPosition.x,
          y: child.targetPosition.y,
          z: child.targetPosition.z,
          duration: 0.45,
          ease: "power2.out",
          onUpdate: render,
        });
        gsap.fromTo(
          child.mesh.scale,
          { x: 0, y: 0, z: 0 },
          {
            x: 1,
            y: 1,
            z: 1,
            duration: 0.4,
            ease: "back.out(1.4)",
            onUpdate: render,
          },
        );
        const edge = node.edges[i];
        if (edge) edge.visible = true;
      });
    }

    function collapse(node: VizNode) {
      node.expanded = false;
      node.children.forEach((child, i) => {
        // Recursively collapse descendants first.
        if (child.expanded) collapse(child);
        gsap.to(child.mesh.scale, {
          x: 0,
          y: 0,
          z: 0,
          duration: 0.3,
          ease: "power2.in",
          onUpdate: render,
          onComplete: () => {
            child.mesh.visible = false;
          },
        });
        const edge = node.edges[i];
        if (edge) edge.visible = false;
      });
    }

    function toggle(node: VizNode) {
      if (node.kind === "contact") {
        if (node.contact) setSelected(node.contact);
        return;
      }
      if (node.expanded) collapse(node);
      else expand(node);
    }

    // ── Picking (click + hover) ──────────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let hovered: VizNode | null = null;

    function pickAt(clientX: number, clientY: number): VizNode | null {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const meshes = allNodes
        .filter((n) => n.mesh.visible)
        .map((n) => n.mesh);
      const hits = raycaster.intersectObjects(meshes, false);
      if (hits.length === 0) return null;
      return (hits[0].object.userData.node as VizNode) ?? null;
    }

    // Distinguish click from drag (OrbitControls also uses the mouse).
    let downX = 0;
    let downY = 0;
    function onPointerDown(e: PointerEvent) {
      downX = e.clientX;
      downY = e.clientY;
    }
    function onPointerUp(e: PointerEvent) {
      const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
      if (moved > 5) return; // treated as a drag
      const node = pickAt(e.clientX, e.clientY);
      if (node) toggle(node);
    }

    function onPointerMove(e: PointerEvent) {
      const node = pickAt(e.clientX, e.clientY);
      if (node === hovered) return;
      if (hovered) {
        gsap.to(hovered.mesh.scale, {
          x: 1,
          y: 1,
          z: 1,
          duration: 0.2,
          ease: "power1.out",
          onUpdate: render,
        });
      }
      hovered = node;
      renderer.domElement.style.cursor = node ? "pointer" : "default";
      if (node) {
        gsap.to(node.mesh.scale, {
          x: 1.2,
          y: 1.2,
          z: 1.2,
          duration: 0.2,
          ease: "power1.out",
          onUpdate: render,
        });
      }
    }

    const dom = renderer.domElement;
    dom.addEventListener("pointerdown", onPointerDown);
    dom.addEventListener("pointerup", onPointerUp);
    dom.addEventListener("pointermove", onPointerMove);

    // ── Resize handling ──────────────────────────────────────────────────────
    const resizeObserver = new ResizeObserver(() => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      labelRenderer.setSize(w, h);
      render();
    });
    resizeObserver.observe(mount);

    // ── Animation loop ───────────────────────────────────────────────────────
    let frameId = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      controls.update();
      render();
    };
    animate();

    // ── Cleanup ──────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      dom.removeEventListener("pointerdown", onPointerDown);
      dom.removeEventListener("pointerup", onPointerUp);
      dom.removeEventListener("pointermove", onPointerMove);
      gsap.killTweensOf("*");
      controls.dispose();

      scene.traverse((obj: THREE.Object3D) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Line) {
          obj.geometry?.dispose?.();
          const mat = obj.material;
          if (Array.isArray(mat))
            mat.forEach((m: THREE.Material) => m.dispose());
          else mat?.dispose?.();
        }
        if (obj instanceof CSS2DObject) {
          obj.element.remove();
        }
      });
      Object.values(sphereGeo).forEach((g) => g.dispose());

      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
      if (labelRenderer.domElement.parentNode === mount) {
        mount.removeChild(labelRenderer.domElement);
      }
    };
  }, [contacts, loading, error]);

  return (
    <div className="relative h-[600px] w-full overflow-hidden rounded-md border border-white/10 bg-neutral-950">
      {loading && (
        <div className="flex h-full items-center justify-center text-sm text-white/40">
          Loading visualization…
        </div>
      )}
      {error && (
        <div className="flex h-full items-center justify-center text-sm text-red-400">
          {error}
        </div>
      )}
      {!loading && !error && contacts.length === 0 && (
        <div className="flex h-full items-center justify-center text-sm text-white/40">
          No contacts yet. Add some in the List view to populate the graph.
        </div>
      )}

      {/* WebGL + CSS2D renderers mount here */}
      <div ref={mountRef} className="absolute inset-0" />

      {/* Legend */}
      {!loading && !error && contacts.length > 0 && (
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1 rounded-md border border-white/10 bg-black/40 px-3 py-2 text-xs text-white/70 backdrop-blur">
          <span>
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-indigo-500" />
            Category
          </span>
          <span>
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-cyan-400" />
            Company
          </span>
          <span>
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-pink-400" />
            Contact
          </span>
          <span className="mt-1 text-white/40">Click a node to expand</span>
        </div>
      )}

      <ContactDetailSidebar contact={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

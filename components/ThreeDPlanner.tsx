
import React, { Suspense, useRef, useState } from 'react';
import { Canvas, ThreeElements } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid, Stars, Text, Edges, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { Move, MousePointer2, Box as BoxIcon, Layers } from 'lucide-react';
import { StorageItem, StorageRoom, StorageZone, Position } from '../types';

declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

interface ThreeDPlannerProps {
  room: StorageRoom;
  zones: StorageZone[];
  items: StorageItem[];
  selectedItemId: string | null;
  selectedZoneId: string | null;
  onSelectItem: (id: string | null) => void;
  onSelectZone: (id: string | null) => void;
  onUpdateItemPosition?: (id: string, pos: Position) => void;
  onUpdateZonePosition?: (id: string, pos: Position) => void;
}

const ItemBox: React.FC<{ 
  item: StorageItem, 
  isSelected: boolean, 
  editMode: boolean,
  zones: StorageZone[],
  onSelect: () => void,
  onUpdatePosition?: (pos: Position) => void,
  setDragging: (dragging: boolean) => void
}> = ({ item, isSelected, editMode, zones, onSelect, onUpdatePosition, setDragging }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { width, height, depth } = item.dimensions;
  const { x, y, z } = item.position;

  const calculateSnappedPosition = (newPos: THREE.Vector3): Position => {
    let finalY = Math.max(height / 2, newPos.y * 100);
    let finalX = newPos.x * 100;
    let finalZ = newPos.z * 100;

    for (const zone of zones) {
      const zX = zone.position.x;
      const zZ = zone.position.z;
      const zW = zone.dimensions.width;
      const zD = zone.dimensions.depth;
      const zH = zone.dimensions.height;

      const isOverZone = 
        Math.abs(finalX - zX) < (zW / 2) && 
        Math.abs(finalZ - zZ) < (zD / 2);

      if (isOverZone) {
        const zoneBaseY = zone.position.y - (zH / 2);
        let accumulatedHeight = 0;
        let bestShelfY = zoneBaseY;

        for (const shelfH of zone.shelfHeights) {
          const shelfTopY = zoneBaseY + accumulatedHeight + shelfH;
          const itemBottomY = (newPos.y * 100) - (height / 2);
          
          if (itemBottomY < shelfTopY && itemBottomY > (zoneBaseY + accumulatedHeight - 10)) {
            bestShelfY = zoneBaseY + accumulatedHeight + (height / 2);
            break;
          }
          accumulatedHeight += shelfH;
        }
        finalY = bestShelfY;
        break;
      }
    }

    return { x: Math.round(finalX), y: Math.round(finalY), z: Math.round(finalZ) };
  };

  const handleUpdate = () => {
    if (meshRef.current && onUpdatePosition) {
      const worldPos = new THREE.Vector3();
      meshRef.current.getWorldPosition(worldPos);
      const snapped = calculateSnappedPosition(worldPos);
      onUpdatePosition(snapped);
    }
  };

  const boxContent = (
    <mesh 
      ref={meshRef}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      onPointerOver={() => { if (editMode) document.body.style.cursor = 'grab'; }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    >
      <boxGeometry args={[width / 100, height / 100, depth / 100]} />
      <meshStandardMaterial 
        color={item.color} 
        transparent 
        opacity={isSelected ? 1 : 0.85} 
        roughness={0.4}
        metalness={0.1}
      />
      <Edges color={isSelected ? "white" : "black"} threshold={15} />
    </mesh>
  );

  if (isSelected && editMode) {
    return (
      <TransformControls 
        position={[x / 100, y / 100, z / 100]}
        mode="translate"
        onMouseDown={() => setDragging(true)}
        onMouseUp={() => {
          setDragging(false);
          handleUpdate();
        }}
      >
        {boxContent}
      </TransformControls>
    );
  }

  return <group position={[x / 100, y / 100, z / 100]}>{boxContent}</group>;
};

const ZoneBox: React.FC<{ 
  zone: StorageZone, 
  isSelected: boolean, 
  editMode: boolean,
  onSelect: () => void,
  onUpdatePosition?: (pos: Position) => void,
  setDragging: (dragging: boolean) => void
}> = ({ zone, isSelected, editMode, onSelect, onUpdatePosition, setDragging }) => {
  const groupRef = useRef<THREE.Group>(null);
  const { width, height, depth } = zone.dimensions;
  const { x, y, z } = zone.position;

  const handleUpdate = () => {
    if (groupRef.current && onUpdatePosition) {
      const worldPos = new THREE.Vector3();
      groupRef.current.getWorldPosition(worldPos);
      onUpdatePosition({
        x: Math.round(worldPos.x * 100),
        y: Math.round(height / 2),
        z: Math.round(worldPos.z * 100)
      });
    }
  };

  const shelfComponents = [];
  let currentH = -height / 200;
  if (zone.shelfHeights) {
    zone.shelfHeights.forEach((h, i) => {
      if (i < zone.shelfHeights.length - 1) {
        currentH += h / 100;
        shelfComponents.push(
          <mesh key={i} position={[0, currentH, 0]}>
            <boxGeometry args={[width / 100, 0.02, depth / 100]} />
            <meshStandardMaterial color={zone.color} transparent opacity={0.7} />
          </mesh>
        );
      }
    });
  }

  const zoneContent = (
    <group 
      ref={groupRef}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      onPointerOver={() => { if (editMode) document.body.style.cursor = 'grab'; }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    >
      <mesh>
        <boxGeometry args={[width / 100, height / 100, depth / 100]} />
        <meshStandardMaterial 
          color={zone.color} 
          transparent 
          opacity={isSelected ? 0.35 : 0.1} 
          side={THREE.DoubleSide}
        />
        <Edges color={isSelected ? "white" : zone.color} threshold={15} opacity={isSelected ? 1 : 0.3} />
      </mesh>
      {shelfComponents}
      <Text position={[0, height / 200 + 0.1, 0]} fontSize={0.08} color={isSelected ? "white" : zone.color} anchorY="bottom" fontWeight="bold">
        {zone.name.toUpperCase()}
      </Text>
    </group>
  );

  if (isSelected && editMode) {
    return (
      <TransformControls 
        position={[x / 100, y / 100, z / 100]}
        mode="translate"
        onMouseDown={() => setDragging(true)}
        onMouseUp={() => {
          setDragging(false);
          handleUpdate();
        }}
      >
        {zoneContent}
      </TransformControls>
    );
  }

  return <group position={[x / 100, y / 100, z / 100]}>{zoneContent}</group>;
};

const RoomContainer: React.FC<{ room: StorageRoom }> = ({ room }) => {
  const { width, height, depth } = room.dimensions;
  const w = width / 100;
  const h = height / 100;
  const d = depth / 100;

  return (
    <group>
      {/* SUELO */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#f1f5f9" roughness={1} />
      </mesh>
      
      {/* TECHO (Transparente) */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, h, 0]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#cbd5e1" transparent opacity={0.05} side={THREE.DoubleSide} />
        <Edges color="#94a3b8" opacity={0.3} />
      </mesh>

      {/* PARED TRASERA */}
      <mesh position={[0, h / 2, -d / 2]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color="#cbd5e1" transparent opacity={0.1} side={THREE.DoubleSide} />
        <Edges color="#94a3b8" opacity={0.4} />
      </mesh>

      {/* PARED FRONTAL (Muy transparente para no bloquear vista) */}
      <mesh position={[0, h / 2, d / 2]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color="#cbd5e1" transparent opacity={0.02} side={THREE.DoubleSide} />
        <Edges color="#94a3b8" opacity={0.1} />
      </mesh>

      {/* PARED IZQUIERDA */}
      <mesh position={[-w / 2, h / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[d, h]} />
        <meshStandardMaterial color="#cbd5e1" transparent opacity={0.1} side={THREE.DoubleSide} />
        <Edges color="#94a3b8" opacity={0.4} />
      </mesh>

      {/* PARED DERECHA */}
      <mesh position={[w / 2, h / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[d, h]} />
        <meshStandardMaterial color="#cbd5e1" transparent opacity={0.1} side={THREE.DoubleSide} />
        <Edges color="#94a3b8" opacity={0.4} />
      </mesh>

      <Grid args={[10, 10]} sectionSize={1} sectionColor="#cbd5e1" sectionThickness={1} cellColor="#e2e8f0" fadeDistance={30} />
    </group>
  );
};

const ThreeDPlanner: React.FC<ThreeDPlannerProps> = ({ 
  room, zones, items, selectedItemId, selectedZoneId,
  onSelectItem, onSelectZone, onUpdateItemPosition, onUpdateZonePosition
}) => {
  const [editMode, setEditMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div className="w-full h-full bg-slate-900 touch-none relative">
      <Canvas shadows dpr={[1, 2]} onPointerMissed={() => { if (!isDragging) { onSelectItem(null); onSelectZone(null); } }}>
        <PerspectiveCamera makeDefault position={[5, 5, 5]} fov={40} />
        <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2.1} enabled={!isDragging} enableDamping />
        
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={1.5} castShadow />
        <directionalLight position={[-5, 5, 5]} intensity={0.8} />

        <Suspense fallback={null}>
          <RoomContainer room={room} />
          {zones.map(zone => (
            <ZoneBox 
              key={zone.id} 
              zone={zone} 
              isSelected={zone.id === selectedZoneId}
              editMode={editMode}
              onSelect={() => onSelectZone(zone.id)}
              onUpdatePosition={(pos) => onUpdateZonePosition?.(zone.id, pos)}
              setDragging={setIsDragging}
            />
          ))}
          {items.map(item => (
            <ItemBox 
              key={item.id} 
              item={item} 
              isSelected={item.id === selectedItemId} 
              editMode={editMode}
              zones={zones}
              onSelect={() => onSelectItem(item.id)} 
              onUpdatePosition={(pos) => onUpdateItemPosition?.(item.id, pos)}
              setDragging={setIsDragging}
            />
          ))}
          <Stars radius={100} depth={50} count={800} factor={4} fade speed={1} />
        </Suspense>
      </Canvas>
      
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        <div className="bg-white/95 backdrop-blur shadow-xl rounded-2xl p-1.5 flex flex-col gap-1 border border-slate-200">
          <button 
            onClick={() => { setEditMode(false); onSelectItem(null); onSelectZone(null); }}
            className={`p-3 rounded-xl transition-all flex items-center gap-3 ${!editMode ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <MousePointer2 size={18} />
            <span className="text-[10px] font-bold">VISTA</span>
          </button>
          <button 
            onClick={() => setEditMode(true)}
            className={`p-3 rounded-xl transition-all flex items-center gap-3 ${editMode ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <Move size={18} />
            <span className="text-[10px] font-bold">EDITAR</span>
          </button>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur text-white px-5 py-2 rounded-full text-[10px] border border-white/10 shadow-2xl flex items-center gap-4">
          <div className="flex items-center gap-2"><BoxIcon size={14} className="text-indigo-400" /> {items.length} Objetos</div>
          <div className="w-px h-3 bg-white/20" />
          <div className="flex items-center gap-2"><Layers size={14} className="text-emerald-400" /> {zones.length} Estanterías</div>
        </div>
      </div>
    </div>
  );
};

export default ThreeDPlanner;

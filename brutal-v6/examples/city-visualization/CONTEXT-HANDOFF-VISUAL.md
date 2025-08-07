# 🎯 BRUTAL V6 City Visualization - Context Handoff

## 🏗️ Core Architecture Pattern
```javascript
const CityComponent = compose(
    withState({ districts: [], nodes: [], particles: [] }),
    withEvents({ 'click': handleClick }),
    withThree()
)(HTMLElement);
```

## 📐 Critical Visual Specifications

### 1. **Proportional Scaling System**
```javascript
const SCALE_CONFIG = {
    platformRadius: 100,
    districtScale: 0.18,   // Districts are 18% of platform
    buildingScale: 0.06,   // Buildings are 6% of platform  
    heightScale: 0.15,     // Height multiplier
    spacing: 1.2
};
```

### 2. **Scene Setup**
- FOV: 45° (not 75°)
- Camera: `position.set(200, 150, 200)`
- Fog: `FogExp2(0x000000, 0.0015)`
- Grid: `GridHelper(200, 40, 0x2a2a3e, 0x1a1a2e)` at y=0.1

### 3. **District Hexagons**
```javascript
// ExtrudeGeometry with bevel (NOT CylinderGeometry)
const shape = new THREE.Shape();
const hexRadius = SCALE_CONFIG.platformRadius * SCALE_CONFIG.districtScale * district.scale;
// 6 points starting at angle π/6
const extrudeSettings = {
    depth: hexRadius * 0.15,
    bevelEnabled: true,
    bevelThickness: depth * 0.1,
    bevelSize: depth * 0.1
};
```

### 4. **Building Types** (EXACT geometry)
- **core/ai**: `CylinderGeometry(r, r*1.2, h, 8)` - wider base
- **storage**: `BoxGeometry(w*1.2, h, d*1.2)` - 20% larger
- **processor/transformer**: `CylinderGeometry(r, r, h, 6)`
- **network**: `SphereGeometry(r, 16, 16)`
- **bridge**: `BoxGeometry(w*1.5, h, d*0.5)` - elongated

### 5. **Node Positioning**
```javascript
const angle = (index / nodes.length) * Math.PI * 2 - Math.PI / 2;
const radius = districtRadius * 0.6 + (index % 2) * (districtRadius * 0.1);
```

### 6. **Visual Features**
- Windows: All 4 sides for boxes, around perimeter for cylinders
- Beacons: Pulsing spheres on top of each building
- Edge glow: LineSegments with district color
- Platform: Dark (0x1a1a1a) with district emissive

### 7. **Animations**
```javascript
// Building sway
node.rotation.z = Math.sin(time + i * 0.3) * 0.001;

// Beacon pulse  
beacon.scale.setScalar(1 + Math.sin(time * 3 + i) * 0.3);

// Central district scale
if (district.name === 'Innovation Hub') {
    district.scale.set(1 + Math.sin(time * 2) * 0.02, 1, scale);
}
```

### 8. **Glass Morphism CSS**
```css
.glass-panel {
    background: linear-gradient(135deg, 
        rgba(139, 92, 246, 0.1), 
        rgba(0, 255, 136, 0.05));
    backdrop-filter: blur(30px);
    border-radius: 24px;
}

/* Gradient border technique */
.glass-panel::before {
    content: '';
    position: absolute;
    inset: 0;
    padding: 1px;
    background: linear-gradient(135deg, 
        rgba(139, 92, 246, 0.5),
        rgba(0, 255, 136, 0.3));
    -webkit-mask: linear-gradient(#fff 0 0) content-box, 
                  linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
}
```

## 🎨 District Configuration
```javascript
const DISTRICTS = [
    { 
        id: 'innovation',
        name: 'Innovation Hub',
        color: 0x8b5cf6,
        position: [0, 0, 0],
        scale: 1.2,  // 20% larger
        nodes: [
            { type: 'core', name: 'Central Core', heightFactor: 2.5 },
            { type: 'storage', name: 'Data Lake', heightFactor: 1.2 },
            { type: 'processor', name: 'AI Engine', heightFactor: 1.8 },
            { type: 'network', name: 'Neural Net', heightFactor: 1.0 },
            { type: 'storage', name: 'Memory Bank', heightFactor: 1.1 }
        ]
    },
    // ... 6 more districts
];
```

## ⚡ Performance Optimizations
- Use heightFactor not absolute heights
- All proportions derive from SCALE_CONFIG
- Single material instance per district color
- Geometry reuse where possible

## 🚫 Explorer Mode Only - Skip These
- Matrix rain overlay
- Quantum effects
- Command terminal
- Export functionality
- Shader controls panel
- Mode switching logic

## ✅ Must Have in Explorer
- All 7 districts with proper nodes
- Full connection network (21 tubes)
- 10K GPU particles
- Orbit controls with damping
- Bloom post-processing
- Click to select nodes
- Hover effects
- FPS display
- Stats panel showing districts/nodes/connections

## 🎯 Key Insight
The reference uses a hexagonal grid system with axial coordinates, ExtrudeGeometry for platforms (not cylinders), and specific building geometries that create the unique look. Everything scales proportionally from the platform radius.
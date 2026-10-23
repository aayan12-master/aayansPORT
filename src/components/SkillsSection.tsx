'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { SkillCategory } from '@/lib/cms';

export interface SkillItem {
  id?: string | number;
  num: string;
  title: string;
  desc: string;
  skills: string[];
  tools: string[];
}

export interface SkillsSectionProps {
  initialSkills?: SkillCategory[] | null;
}

function mapToSkillItems(raw?: SkillCategory[] | null): SkillItem[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.map((s) => ({
    id: s.id,
    num: s.category_num,
    title: s.category_title,
    desc: s.description,
    skills: s.skills || [],
    tools: s.tools || [],
  }));
}

export type NodeType = 'category' | 'skill' | 'tool';

export interface ConstellationNode {
  id: string;
  name: string;
  type: NodeType;
  categoryNum: string;
  categoryTitle: string;
  categoryDesc: string;
  competencies: string[];
  toolsList: string[];
  x: number; // 0 to 100 percentage
  y: number; // 0 to 100 percentage
  clusterCenterX?: number;
  clusterCenterY?: number;
}

// Generate organic but deterministic collision-free nodes arranged in calm quadrants
export function generateConstellationNodes(
  categories: SkillItem[],
  selectedCatNum: string = 'ALL'
): ConstellationNode[] {
  if (!categories || categories.length === 0) return [];

  const filteredCategories =
    selectedCatNum === 'ALL'
      ? categories
      : categories.filter((c) => c.num === selectedCatNum);

  const activeCategories = filteredCategories.length > 0 ? filteredCategories : categories;
  const isSingle = selectedCatNum !== 'ALL' || activeCategories.length === 1;

  // Dedicated quadrant anchors for non-overlapping clusters
  const getQuadrantCentroid = (idx: number, total: number) => {
    if (isSingle) return { x: 50, y: 50 };
    if (total <= 2) {
      return { x: 30 + idx * 40, y: 50 };
    }
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    return {
      x: 24 + col * 52, // 24% and 76%
      y: 28 + row * 44, // 28% and 72%
    };
  };

  const rawNodes: ConstellationNode[] = [];

  activeCategories.forEach((cat, cIdx) => {
    const centroid = getQuadrantCentroid(cIdx, activeCategories.length);

    // 1. Category Hub Node
    rawNodes.push({
      id: `cat-${cat.num}`,
      name: cat.title,
      type: 'category',
      categoryNum: cat.num,
      categoryTitle: cat.title,
      categoryDesc: cat.desc,
      competencies: cat.skills || [],
      toolsList: cat.tools || [],
      x: centroid.x,
      y: centroid.y,
      clusterCenterX: centroid.x,
      clusterCenterY: centroid.y,
    });

    const skills = cat.skills || [];
    const tools = cat.tools || [];
    const numSkills = skills.length;
    const numTools = tools.length;

    // Angle offset so nodes don't collide with the horizontal hub label
    const baseAngleSkill = 0.40 + cIdx * 0.35;
    skills.forEach((skillName, sIdx) => {
      const isInner = sIdx % 2 === 0;
      const rX = isSingle ? (isInner ? 24 : 30) : (isInner ? 12 : 15.5);
      const rY = isSingle ? (isInner ? 17 : 22) : (isInner ? 8.5 : 11);
      const angle = baseAngleSkill + (sIdx / Math.max(numSkills, 1)) * 2 * Math.PI;
      const rawX = centroid.x + rX * Math.cos(angle);
      const rawY = centroid.y + rY * Math.sin(angle);

      rawNodes.push({
        id: `skill-${cat.num}-${sIdx}`,
        name: skillName,
        type: 'skill',
        categoryNum: cat.num,
        categoryTitle: cat.title,
        categoryDesc: cat.desc,
        competencies: skills,
        toolsList: tools,
        x: Math.max(5, Math.min(95, rawX)),
        y: Math.max(12, Math.min(88, rawY)),
        clusterCenterX: centroid.x,
        clusterCenterY: centroid.y,
      });
    });

    // Outer tools with angular offset and larger radial separation
    const baseAngleTool = baseAngleSkill + Math.PI / Math.max(numTools, 1) + 0.28;
    tools.forEach((toolName, tIdx) => {
      const isInner = tIdx % 2 === 0;
      const rX = isSingle ? (isInner ? 38 : 44) : (isInner ? 21 : 24.5);
      const rY = isSingle ? (isInner ? 28 : 33) : (isInner ? 15.5 : 18.5);
      const angle = baseAngleTool + (tIdx / Math.max(numTools, 1)) * 2 * Math.PI;
      const rawX = centroid.x + rX * Math.cos(angle);
      const rawY = centroid.y + rY * Math.sin(angle);

      rawNodes.push({
        id: `tool-${cat.num}-${tIdx}`,
        name: toolName,
        type: 'tool',
        categoryNum: cat.num,
        categoryTitle: cat.title,
        categoryDesc: cat.desc,
        competencies: skills,
        toolsList: tools,
        x: Math.max(5, Math.min(95, rawX)),
        y: Math.max(12, Math.min(88, rawY)),
        clusterCenterX: centroid.x,
        clusterCenterY: centroid.y,
      });
    });
  });

  // Footprint Collision Resolution Pass
  // Calculate bounding box half-extents in % on an 800px tall canvas
  const W = 1200;
  const H = 780;
  const halfWidths = rawNodes.map((n) => {
    const isCat = n.type === 'category';
    const displayLen = isSingle || isCat ? Math.min(n.name.length, 28) : Math.min(n.name.length, 14);
    const pxWidth = displayLen * 6.0 + (isCat ? 32 : 24) + 8;
    return (pxWidth / W) * 100 / 2;
  });

  const halfHeights = rawNodes.map((n) => {
    const isCat = n.type === 'category';
    const pxHeight = (isCat ? 24 : 18) + 8;
    return (pxHeight / H) * 100 / 2;
  });

  // Iterative relaxation (deterministic 75 passes)
  const nodes = rawNodes.map((n) => ({ ...n }));
  for (let pass = 0; pass < 75; pass++) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);
        const minX = halfWidths[i] + halfWidths[j];
        const minY = halfHeights[i] + halfHeights[j];

        if (absX < minX && absY < minY) {
          const overlapX = minX - absX + 0.2;
          const overlapY = minY - absY + 0.2;

          const iIsHub = nodes[i].type === 'category';
          const jIsHub = nodes[j].type === 'category';

          const signX = dx >= 0 ? 1 : -1;
          const signY = dy >= 0 ? 1 : -1;

          if (overlapY / minY < overlapX / minX) {
            const pushY = overlapY * 0.85 * signY;
            if (iIsHub) {
              nodes[j].y += pushY * 1.5;
            } else if (jIsHub) {
              nodes[i].y -= pushY * 1.5;
            } else {
              nodes[i].y -= pushY * 0.5;
              nodes[j].y += pushY * 0.5;
            }
          } else {
            const pushX = overlapX * 0.85 * signX;
            if (iIsHub) {
              nodes[j].x += pushX * 1.5;
            } else if (jIsHub) {
              nodes[i].x -= pushX * 1.5;
            } else {
              nodes[i].x -= pushX * 0.5;
              nodes[j].x += pushX * 0.5;
            }
          }

          nodes[i].x = Math.max(5, Math.min(95, nodes[i].x));
          nodes[i].y = Math.max(12, Math.min(88, nodes[i].y));
          nodes[j].x = Math.max(5, Math.min(95, nodes[j].x));
          nodes[j].y = Math.max(12, Math.min(88, nodes[j].y));
        }
      }
    }
  }

  return nodes;
}

export default function SkillsSection({ initialSkills }: SkillsSectionProps = {}) {
  const [skillCategories, setSkillCategories] = useState<SkillItem[]>(() => mapToSkillItems(initialSkills));
  const [loading, setLoading] = useState<boolean>(!initialSkills || initialSkills.length === 0);

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [pinnedNodeId, setPinnedNodeId] = useState<string | null>(null);

  // User-controlled session drag coordinates
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [activeDraggingId, setActiveDraggingId] = useState<string | null>(null);

  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Flag to suppress click card toggle immediately following a drag
  const justDraggedRef = useRef<boolean>(false);

  // Synchronize live skills from props or fetch if rendered without server data
  useEffect(() => {
    if (initialSkills) {
      setSkillCategories(mapToSkillItems(initialSkills));
      setLoading(false);
      return;
    }

    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.skills)) {
          setSkillCategories(mapToSkillItems(data.skills));
        }
      })
      .catch((err) => console.error('Error fetching live skills:', err))
      .finally(() => setLoading(false));
  }, [initialSkills]);

  // Compute deterministic constellation nodes
  const nodes = useMemo(() => {
    return generateConstellationNodes(skillCategories, selectedCategory);
  }, [skillCategories, selectedCategory]);

  // Keep dragged nodes safely within boundaries on window resize
  useEffect(() => {
    const handleResize = () => {
      setNodePositions((prev) => {
        let changed = false;
        const clamped: Record<string, { x: number; y: number }> = {};
        for (const [id, pos] of Object.entries(prev)) {
          const x = Math.max(3, Math.min(97, pos.x));
          const y = Math.max(4, Math.min(96, pos.y));
          if (x !== pos.x || y !== pos.y) changed = true;
          clamped[id] = { x, y };
        }
        return changed ? clamped : prev;
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Active node being inspected (pinned takes precedence over hovered)
  const activeNode = useMemo(() => {
    const targetId = pinnedNodeId || hoveredNodeId;
    if (!targetId) return null;
    return nodes.find((n) => n.id === targetId) || null;
  }, [pinnedNodeId, hoveredNodeId, nodes]);

  // Zero-flicker hover bridge management
  const cancelDismiss = useCallback(() => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  }, []);

  const scheduleDismiss = useCallback(
    (delay = 240) => {
      cancelDismiss();
      dismissTimerRef.current = setTimeout(() => {
        setHoveredNodeId(null);
      }, delay);
    },
    [cancelDismiss]
  );

  const handleNodeMouseEnter = (nodeId: string) => {
    if (activeDraggingId || justDraggedRef.current) return;
    cancelDismiss();
    setHoveredNodeId(nodeId);
  };

  const handleNodeMouseLeave = () => {
    if (activeDraggingId) return;
    scheduleDismiss(240);
  };

  const handleCardMouseEnter = () => {
    cancelDismiss();
  };

  const handleCardMouseLeave = () => {
    scheduleDismiss(200);
  };

  const handleNodeClick = (nodeId: string) => {
    if (justDraggedRef.current) return;
    cancelDismiss();
    setPinnedNodeId((prev) => (prev === nodeId ? null : nodeId));
  };

  const handleDismissCard = () => {
    cancelDismiss();
    setPinnedNodeId(null);
    setHoveredNodeId(null);
  };

  // Pointer Drag Handlers (Unified Mouse + Touch with Window Event Listeners)
  const handlePointerDown = (
    e: React.PointerEvent<HTMLButtonElement>,
    node: ConstellationNode,
    currentX: number,
    currentY: number
  ) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    let hasDragged = false;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      const distance = Math.hypot(deltaX, deltaY);

      if (distance > 4) {
        if (!hasDragged) {
          hasDragged = true;
          setActiveDraggingId(node.id);
          // Deliberately close any open card when dragging starts
          handleDismissCard();
        }

        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            const pctX = (deltaX / rect.width) * 100;
            const pctY = (deltaY / rect.height) * 100;
            const newX = Math.max(3, Math.min(97, currentX + pctX));
            const newY = Math.max(4, Math.min(96, currentY + pctY));

            setNodePositions((prev) => ({
              ...prev,
              [node.id]: { x: newX, y: newY },
            }));
          }
        }
      }
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);

      setActiveDraggingId(null);

      if (hasDragged) {
        justDraggedRef.current = true;
        // Suppress click and hover cards for 200ms after a drag ends
        setTimeout(() => {
          justDraggedRef.current = false;
        }, 200);
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  // Keyboard navigation & Escape key dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismissCard();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Card boundary orientation calculation for desktop view
  const cardPositionStyle = useMemo(() => {
    if (!activeNode) return {};
    const posX = nodePositions[activeNode.id]?.x ?? activeNode.x;
    const posY = nodePositions[activeNode.id]?.y ?? activeNode.y;

    const isRightHalf = posX > 50;
    const isBottomHalf = posY > 55;

    return {
      left: isRightHalf ? 'auto' : `calc(${posX}% + 22px)`,
      right: isRightHalf ? `calc(100% - ${posX}% + 22px)` : 'auto',
      top: isBottomHalf ? 'auto' : `calc(${posY}% - 14px)`,
      bottom: isBottomHalf ? `calc(100% - ${posY}% - 14px)` : 'auto',
    };
  }, [activeNode, nodePositions]);

  const movedCount = Object.keys(nodePositions).length;

  return (
    <section className="relative w-full min-h-screen bg-[#ECE8DF] text-[#171514] p-6 sm:p-10 lg:p-12 border-t-2 border-[#171514]">
      {/* Corner Registration Crosses */}
      <div className="absolute top-5 left-5 font-mono text-2xl font-light text-[#171514] select-none pointer-events-none">
        +
      </div>
      <div className="absolute top-5 right-5 font-mono text-2xl font-light text-[#171514] select-none pointer-events-none">
        +
      </div>

      {/* Section Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-2 border-[#171514] pb-4">
          <div>
            <div className="font-mono text-xs font-semibold tracking-widest text-[#DF491E] mb-1">
              // DOSSIER SECTION 05
            </div>
            <h2 className="font-display text-5xl sm:text-6xl font-extrabold tracking-tight text-[#171514]">
              CAPABILITIES &amp; TECHNICAL MATRIX
            </h2>
          </div>
          <div className="font-mono text-xs text-[#5A5650] pb-1">
            Explore a skill or tool to learn more. Drag nodes to reposition.
          </div>
        </div>

        {/* Category Domain Filter Strip */}
        <div className="flex items-center gap-2 mt-4 overflow-x-auto no-scrollbar py-1">
          <span className="font-mono text-xs text-[#5A5650] shrink-0 mr-1 select-none">
            // FILTER DOMAIN:
          </span>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('ALL');
              handleDismissCard();
            }}
            className={`shrink-0 px-3 py-1 font-mono text-xs border transition-all cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-[#171514] text-[#ECE8DF] border-[#171514] font-bold shadow-[2px_2px_0px_#DF491E]'
                : 'bg-[#ECE8DF] text-[#171514] border-[#171514]/40 hover:border-[#171514]'
            }`}
          >
            ALL DOMAINS ({skillCategories.length})
          </button>
          {skillCategories.map((cat) => {
            const isSelected = selectedCategory === cat.num;
            return (
              <button
                key={cat.num}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.num);
                  handleDismissCard();
                }}
                className={`shrink-0 px-3 py-1 font-mono text-xs border transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#171514] text-[#ECE8DF] border-[#171514] font-bold shadow-[2px_2px_0px_#DF491E]'
                    : 'bg-[#ECE8DF] text-[#171514] border-[#171514]/40 hover:border-[#171514]'
                }`}
              >
                <span>
                  {cat.num} // {cat.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating Skill Constellation Canvas Container */}
      <div className="max-w-6xl mx-auto">
        <div
          ref={containerRef}
          onClick={(e) => {
            // Dismiss pinned card if clicking directly on canvas backdrop
            if (e.target === containerRef.current) {
              handleDismissCard();
            }
          }}
          className="relative w-full h-[620px] sm:h-[720px] lg:h-[780px] xl:h-[820px] bg-[#ECE8DF] border-2 border-[#171514] shadow-[4px_4px_0px_#171514] overflow-hidden select-none"
          style={{
            backgroundImage: `
              radial-gradient(#BCB8B1 1px, transparent 1px),
              linear-gradient(to right, rgba(188, 184, 177, 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(188, 184, 177, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '28px 28px, 56px 56px, 56px 56px',
          }}
        >
          {/* Subtle Top-Right Canvas Legend & Reset Control */}
          <div className="absolute top-3 right-4 z-10 flex flex-wrap items-center gap-3 font-mono text-[10px] text-[#5A5650] bg-[#ECE8DF]/95 px-3 py-1.5 border border-[#171514]/30 shadow-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#171514] border-2 border-[#DF491E]" />
              <span>Domain Hub</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#171514]" />
              <span>Skill</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#5A5650]" />
              <span>Tool</span>
            </div>
            <span className="text-[#BCB8B1]">|</span>
            <span className="text-[#DF491E] font-bold">DRAG TO MOVE</span>
            {movedCount > 0 && (
              <>
                <span className="text-[#BCB8B1]">|</span>
                <button
                  type="button"
                  onClick={() => setNodePositions({})}
                  className="text-[#DF491E] hover:underline font-bold cursor-pointer"
                >
                  ↺ RESET POSITIONS ({movedCount})
                </button>
              </>
            )}
          </div>

          {/* Neutral Loading & Empty States */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center font-mono text-xs text-[#5A5650] bg-[#ECE8DF]/50 z-20 pointer-events-none">
              <div className="flex items-center gap-2 px-4 py-2 bg-[#ECE8DF] border border-[#171514] shadow-sm">
                <span className="text-[#DF491E] animate-spin">⟳</span>
                <span>SYNCHRONIZING CONSTELLATION NODES...</span>
              </div>
            </div>
          )}
          {!loading && nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center font-mono text-xs text-[#5A5650] z-10 pointer-events-none">
              <div className="p-6 border border-dashed border-[#171514] text-center max-w-sm bg-[#ECE8DF]/90">
                <div className="font-bold text-[#171514] mb-1">// NO VERIFIED SKILL DOMAINS FOUND</div>
                <div className="text-[11px]">No published skills are currently available in the dossier.</div>
              </div>
            </div>
          )}

          {/* User-Controlled Constellation Nodes */}
          {nodes.map((node, nodeIdx) => {
            const posX = nodePositions[node.id]?.x ?? node.x;
            const posY = nodePositions[node.id]?.y ?? node.y;

            const isHovered = hoveredNodeId === node.id;
            const isPinned = pinnedNodeId === node.id;
            const isSelected = isHovered || isPinned;
            const isDragging = activeDraggingId === node.id;

            const isSingle = selectedCategory !== 'ALL';
            const isLeftOfCluster =
              node.clusterCenterX !== undefined ? posX < node.clusterCenterX : posX < 50;

            const floatClass = isDragging
              ? ''
              : `constellation-ambient-float-${(nodeIdx % 4) + 1}`;

            // Compact display text in dense view unless hovered/pinned or single-category filtered
            const labelText = (() => {
              if (isSingle || isSelected || node.type === 'category') {
                return node.name;
              }
              if (node.name.length <= 15) {
                return node.name;
              }
              return `${node.name.slice(0, 13)}…`;
            })();

            return (
              <button
                key={node.id}
                type="button"
                tabIndex={0}
                aria-label={`${node.name} (${node.type})`}
                aria-expanded={isSelected}
                onMouseEnter={() => handleNodeMouseEnter(node.id)}
                onMouseLeave={handleNodeMouseLeave}
                onPointerDown={(e) => handlePointerDown(e, node, posX, posY)}
                onClick={(e) => {
                  e.stopPropagation();
                  handleNodeClick(node.id);
                }}
                onFocus={() => handleNodeMouseEnter(node.id)}
                onBlur={handleNodeMouseLeave}
                style={{
                  left: `${posX}%`,
                  top: `${posY}%`,
                  touchAction: 'none',
                }}
                className={`group absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none select-none transition-shadow ${
                  isDragging ? 'cursor-grabbing z-50' : 'cursor-grab z-20'
                }`}
              >
                {/* Nested Animated Wrapper: Ambient gentle float motion around permanent/dragged center */}
                <div
                  className={`transition-transform duration-150 ${floatClass} ${
                    isSelected || isDragging
                      ? '[animation-play-state:paused] scale-105'
                      : 'group-hover:[animation-play-state:paused] group-hover:scale-105'
                  }`}
                  style={{
                    animationDelay: `-${(nodeIdx * 1.35) % 8}s`,
                  }}
                >
                  {/* Node Representation */}
                  <div
                    className={`relative flex items-center justify-center p-2 -m-2 ${
                      isLeftOfCluster ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    {node.type === 'category' ? (
                      <div
                        className={`w-3.5 h-3.5 rounded-full transition-all duration-150 flex items-center justify-center shrink-0 ${
                          isSelected || isDragging
                            ? 'bg-[#DF491E] ring-4 ring-[#DF491E]/30 scale-125'
                            : 'bg-[#171514] border-2 border-[#DF491E] group-hover:scale-125 group-hover:bg-[#DF491E]'
                        }`}
                      >
                        <div className="w-1 h-1 rounded-full bg-[#ECE8DF]" />
                      </div>
                    ) : node.type === 'skill' ? (
                      <div
                        className={`w-2.5 h-2.5 rounded-full transition-all duration-150 shrink-0 ${
                          isSelected || isDragging
                            ? 'bg-[#DF491E] ring-4 ring-[#DF491E]/30 scale-125'
                            : 'bg-[#171514] group-hover:bg-[#DF491E] group-hover:scale-125'
                        }`}
                      />
                    ) : (
                      <div
                        className={`w-2 h-2 rounded-full transition-all duration-150 shrink-0 ${
                          isSelected || isDragging
                            ? 'bg-[#DF491E] ring-4 ring-[#DF491E]/30 scale-125'
                            : 'bg-[#5A5650] border border-[#171514] group-hover:bg-[#DF491E] group-hover:scale-125'
                        }`}
                      />
                    )}

                    {/* Clean Monospace Node Label */}
                    <span
                      className={`${
                        isLeftOfCluster ? 'mr-1.5' : 'ml-1.5'
                      } font-mono text-[8.5px] sm:text-[9.5px] lg:text-[10px] tracking-tight whitespace-nowrap px-1.5 py-0.5 border rounded-xs select-none max-w-[180px] sm:max-w-[220px] truncate transition-colors duration-100 ${
                        isSelected || isDragging
                          ? 'bg-[#171514] text-[#ECE8DF] border-[#171514] font-bold shadow-[2px_2px_0px_#DF491E] z-30'
                          : node.type === 'category'
                          ? 'bg-[#ECE8DF]/95 text-[#171514] border-[#171514] font-bold group-hover:border-[#DF491E] group-hover:text-[#DF491E]'
                          : 'bg-[#ECE8DF]/90 text-[#171514] border-[#171514]/30 group-hover:border-[#DF491E] group-hover:text-[#DF491E]'
                      }`}
                    >
                      {labelText}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}

          {/* Desktop Hover / Pinned Floating Detail Card */}
          {activeNode && (
            <div
              onMouseEnter={handleCardMouseEnter}
              onMouseLeave={handleCardMouseLeave}
              style={cardPositionStyle}
              className="hidden md:block absolute z-40 w-80 lg:w-96 bg-[#ECE8DF] border-2 border-[#171514] shadow-[6px_6px_0px_#171514] p-4 font-mono text-xs animate-terminal-expand"
            >
              {/* Card Header & Dismiss Button */}
              <div className="flex items-start justify-between border-b-2 border-[#171514] pb-2.5 mb-3">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className={`px-1.5 py-0.2 text-[9px] font-bold border uppercase ${
                        activeNode.type === 'category'
                          ? 'bg-[#DF491E] text-[#171514] border-[#171514]'
                          : activeNode.type === 'skill'
                          ? 'bg-[#171514] text-[#ECE8DF] border-[#171514]'
                          : 'bg-[#5A5650] text-[#ECE8DF] border-[#171514]'
                      }`}
                    >
                      {activeNode.type === 'category'
                        ? 'DOMAIN'
                        : activeNode.type === 'skill'
                        ? 'COMPETENCY'
                        : 'TOOL'}
                    </span>
                    <span className="text-[10px] text-[#5A5650]">
                      {activeNode.categoryNum} // {activeNode.categoryTitle}
                    </span>
                  </div>
                  <h3 className="font-bold text-[#171514] text-sm sm:text-base leading-snug">
                    {activeNode.name}
                  </h3>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {pinnedNodeId === activeNode.id && (
                    <span className="text-[9px] text-[#DF491E] font-bold tracking-wider mr-1">
                      PINNED
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleDismissCard}
                    aria-label="Dismiss detail card"
                    className="w-5 h-5 flex items-center justify-center border border-[#171514] hover:bg-[#DF491E] hover:text-[#ECE8DF] transition-colors cursor-pointer text-xs font-bold leading-none"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="space-y-3">
                {activeNode.categoryDesc && (
                  <div>
                    <div className="text-[10px] text-[#5A5650] font-bold mb-0.5">
                      // DOMAIN SCOPE:
                    </div>
                    <p className="font-sans text-xs leading-relaxed text-[#171514]">
                      {activeNode.categoryDesc}
                    </p>
                  </div>
                )}

                {activeNode.type === 'category' && (
                  <>
                    {activeNode.competencies && activeNode.competencies.length > 0 && (
                      <div>
                        <div className="text-[10px] text-[#5A5650] font-bold mb-1">
                          // TECHNICAL COMPETENCIES ({activeNode.competencies.length}):
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {activeNode.competencies.map((comp, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 bg-[#ECE8DF] border border-[#171514]/40 text-[10px] text-[#171514]"
                            >
                              {comp}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeNode.toolsList && activeNode.toolsList.length > 0 && (
                      <div>
                        <div className="text-[10px] text-[#5A5650] font-bold mb-1">
                          // OPERATIONAL TOOLS ({activeNode.toolsList.length}):
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {activeNode.toolsList.map((tool, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 bg-[#171514] text-[#ECE8DF] text-[10px]"
                            >
                              {tool}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {activeNode.type === 'skill' && (
                  <div>
                    <div className="text-[10px] text-[#5A5650] font-bold mb-0.5">
                      // CATEGORY COMPETENCY:
                    </div>
                    <div className="font-sans text-xs text-[#171514]">
                      Audited &amp; verified under operational domain{' '}
                      <strong>{activeNode.categoryTitle}</strong>.
                    </div>
                  </div>
                )}

                {activeNode.type === 'tool' && (
                  <div>
                    <div className="text-[10px] text-[#5A5650] font-bold mb-0.5">
                      // TOOL IDENTIFIER:
                    </div>
                    <div className="font-sans text-xs text-[#171514]">
                      Actively deployed in offensive workflows and security assessments for{' '}
                      <strong>{activeNode.categoryTitle}</strong>.
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer Hint */}
              <div className="mt-3.5 pt-2 border-t border-[#171514]/20 flex items-center justify-between text-[10px] text-[#5A5650]">
                <span>
                  {pinnedNodeId === activeNode.id
                    ? 'ESC or click outside to unpin'
                    : 'Click node to pin open'}
                </span>
                <span className="text-[#DF491E] font-bold">AAYAN.SEC MATRIX</span>
              </div>
            </div>
          )}
        </div>

        {/* Mobile / Touch Responsive Bottom Sheet Detail Card */}
        {activeNode && (
          <div className="md:hidden fixed inset-0 z-50 bg-[#171514]/60 backdrop-blur-xs flex items-end justify-center p-3 animate-terminal-backdrop">
            <div className="w-full max-w-lg bg-[#ECE8DF] border-2 border-[#171514] shadow-[4px_4px_0px_#171514] p-4 font-mono text-xs max-h-[85vh] overflow-y-auto animate-terminal-expand">
              {/* Mobile Card Header */}
              <div className="flex items-start justify-between border-b-2 border-[#171514] pb-2.5 mb-3 sticky top-0 bg-[#ECE8DF]">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="px-1.5 py-0.2 text-[9px] font-bold bg-[#DF491E] text-[#171514] border border-[#171514] uppercase">
                      {activeNode.type}
                    </span>
                    <span className="text-[10px] text-[#5A5650]">
                      {activeNode.categoryNum} // {activeNode.categoryTitle}
                    </span>
                  </div>
                  <h3 className="font-bold text-[#171514] text-base leading-snug">
                    {activeNode.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleDismissCard}
                  aria-label="Close details"
                  className="w-7 h-7 flex items-center justify-center border-2 border-[#171514] bg-[#ECE8DF] text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Mobile Card Content */}
              <div className="space-y-3">
                {activeNode.categoryDesc && (
                  <div>
                    <div className="text-[10px] text-[#5A5650] font-bold mb-0.5">
                      // SCOPE:
                    </div>
                    <p className="font-sans text-xs leading-relaxed text-[#171514]">
                      {activeNode.categoryDesc}
                    </p>
                  </div>
                )}

                {activeNode.type === 'category' && (
                  <>
                    {activeNode.competencies && activeNode.competencies.length > 0 && (
                      <div>
                        <div className="text-[10px] text-[#5A5650] font-bold mb-1">
                          // COMPETENCIES ({activeNode.competencies.length}):
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {activeNode.competencies.map((comp, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 bg-[#ECE8DF] border border-[#171514]/40 text-[10px]"
                            >
                              {comp}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeNode.toolsList && activeNode.toolsList.length > 0 && (
                      <div>
                        <div className="text-[10px] text-[#5A5650] font-bold mb-1">
                          // TOOLS ({activeNode.toolsList.length}):
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {activeNode.toolsList.map((tool, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 bg-[#171514] text-[#ECE8DF] text-[10px]"
                            >
                              {tool}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-[#171514]/20 flex items-center justify-between text-[10px] text-[#5A5650]">
                <span>Tap ✕ to close</span>
                <span className="text-[#DF491E] font-bold">AAYAN.SEC MATRIX</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

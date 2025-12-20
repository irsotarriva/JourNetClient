'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Network, ExternalLink } from 'lucide-react';
import { Article } from '@/lib/types';
import { searchArticles } from '@/app/actions';

interface Node extends Article {
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    isFixed?: boolean;
}

interface Edge {
    sourceId: string;
    targetId: string;
}

interface GraphRecommendationPopupProps {
    initialArticles: Article[];
    onClose: () => void;
}

const COLORS = [
    '#3b82f6', // Blue
    '#8b5cf6', // Purple
    '#ef4444', // Red
    '#10b981', // Green
    '#f59e0b', // Amber
];

const GraphRecommendationPopup: React.FC<GraphRecommendationPopupProps> = ({ initialArticles, onClose }) => {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [hoveredArticle, setHoveredArticle] = useState<Node | null>(null);
    const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number>(0);

    // Simulation Constants - Augmented for non-crowding
    const REPULSION = 4000;
    const SPRING_LENGTH = 160;
    const SPRING_STRENGTH = 0.04;
    const FRICTION = 0.92;
    const CENTER_STRENGTH = 0.01;

    useEffect(() => {
        if (!containerRef.current || nodes.length > 0) return;

        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        // Requirement (1): Only select first two recommendations for initial particles
        const seeds = initialArticles.slice(0, 2);

        const initialNodes = seeds.map((article, idx) => ({
            ...article,
            x: width / 2 + (idx === 0 ? -50 : 50),
            y: height / 2,
            vx: 0,
            vy: 0,
            color: COLORS[idx % COLORS.length],
        }));

        setNodes(initialNodes);
    }, [initialArticles, nodes.length]);

    const handleAnimate = useCallback(() => {
        if (!containerRef.current) return;
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        setNodes(prevNodes => {
            const nextNodes = prevNodes.map(n => ({ ...n }));

            // 1. Repulsion between all nodes
            for (let i = 0; i < nextNodes.length; i++) {
                for (let j = i + 1; j < nextNodes.length; j++) {
                    const n1 = nextNodes[i];
                    const n2 = nextNodes[j];
                    const dx = n1.x - n2.x;
                    const dy = n1.y - n2.y;
                    const distSq = dx * dx + dy * dy + 0.1;
                    const force = REPULSION / distSq;
                    const fx = (dx / Math.sqrt(distSq)) * force;
                    const fy = (dy / Math.sqrt(distSq)) * force;

                    if (!n1.isFixed) { n1.vx += fx; n1.vy += fy; }
                    if (!n2.isFixed) { n2.vx -= fx; n2.vy -= fy; }
                }
            }

            // 2. Spring forces between edges
            edges.forEach(edge => {
                const source = nextNodes.find(n => n.id === edge.sourceId);
                const target = nextNodes.find(n => n.id === edge.targetId);
                if (!source || !target) return;

                const dx = target.x - source.x;
                const dy = target.y - source.y;
                const distance = Math.sqrt(dx * dx + dy * dy) || 1;
                const force = (distance - SPRING_LENGTH) * SPRING_STRENGTH;
                const fx = (dx / distance) * force;
                const fy = (dy / distance) * force;

                if (!source.isFixed) { source.vx += fx; source.vy += fy; }
                if (!target.isFixed) { target.vx -= fx; target.vy -= fy; }
            });

            // 3. Centering force and update positions
            nextNodes.forEach(n => {
                if (!n.isFixed) {
                    const dxCenter = width / 2 - n.x;
                    const dyCenter = height / 2 - n.y;
                    n.vx += dxCenter * CENTER_STRENGTH;
                    n.vy += dyCenter * CENTER_STRENGTH;

                    n.x += n.vx;
                    n.y += n.vy;
                    n.vx *= FRICTION;
                    n.vy *= FRICTION;

                    // Boundary padding
                    const pad = 40;
                    if (n.x < pad) { n.x = pad; n.vx *= -0.5; }
                    if (n.x > width - pad) { n.x = width - pad; n.vx *= -0.5; }
                    if (n.y < pad) { n.y = pad; n.vy *= -0.5; }
                    if (n.y > height - pad) { n.y = height - pad; n.vy *= -0.5; }
                }
            });

            return nextNodes;
        });

        animationRef.current = requestAnimationFrame(handleAnimate);
    }, [edges]);

    useEffect(() => {
        animationRef.current = requestAnimationFrame(handleAnimate);
        return () => cancelAnimationFrame(animationRef.current);
    }, [handleAnimate]);

    const handleNodeMouseDown = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setDraggedNodeId(id);
        setNodes(prev => prev.map(n => n.id === id ? { ...n, isFixed: true, vx: 0, vy: 0 } : n));
    };

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!draggedNodeId || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        setNodes(prev => prev.map(n =>
            n.id === draggedNodeId
                ? { ...n, x: mouseX, y: mouseY, vx: 0, vy: 0 }
                : n
        ));
    }, [draggedNodeId]);

    const handleMouseUp = () => {
        setDraggedNodeId(null);
    };

    const handleNodeClick = async (clickedNode: Node) => {
        if (isLoading || draggedNodeId) return;

        // Requirement (3): Keyword search and expansion
        const keyword = clickedNode.categories[0] || clickedNode.title.split(' ')[0] || 'research';

        setIsLoading(true);
        try {
            // Search for ranked results
            const results = await searchArticles(keyword, 10);

            const existingIds = new Set(nodes.map(n => n.id));
            const newArticles = results
                .filter(a => !existingIds.has(a.id))
                .slice(0, 2); // Requirement (3): Two descendent nodes

            if (newArticles.length > 0) {
                const newNodes: Node[] = newArticles.map(a => ({
                    ...a,
                    x: clickedNode.x + (Math.random() - 0.5) * 50,
                    y: clickedNode.y + (Math.random() - 0.5) * 50,
                    vx: 0,
                    vy: 0,
                    color: clickedNode.color, // Inherit color for visual grouping
                }));

                const newEdges: Edge[] = newArticles.map(a => ({
                    sourceId: clickedNode.id,
                    targetId: a.id,
                }));

                setNodes(prev => [...prev, ...newNodes]);
                setEdges(prev => [...prev, ...newEdges]);
            }
        } catch (error) {
            console.error('Expansion failed', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 pointer-events-auto"
            onClick={onClose}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        >
            <div className="relative w-1/2 h-1/2 flex items-center justify-center pointer-events-none">
                {/* Dynamic Side Details Panel */}
                {hoveredArticle && (
                    <div className="absolute top-0 right-full mr-6 w-80 h-full bg-slate-900/95 backdrop-blur-2xl border border-white/20 rounded-2xl p-6 text-white overflow-y-auto animate-in slide-in-from-right-4 fade-in duration-300 shadow-2xl z-50 pointer-events-auto">
                        <h2 className="text-xl font-bold mb-4 leading-tight decoration-blue-500/50 underline-offset-4">{hoveredArticle.title}</h2>
                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-1">Authors</p>
                                <p className="text-sm text-slate-200">{hoveredArticle.authors.map(a => a.name).join(', ')}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-1">Abstract</p>
                                <p className="text-sm text-slate-300 leading-relaxed italic">
                                    {hoveredArticle.abstract || "No abstract available for this article."}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-2">
                                {hoveredArticle.categories.map(c => (
                                    <span key={c} className="text-[10px] bg-blue-500/10 text-blue-300 px-2 py-1 rounded-md border border-blue-500/20">
                                        {c}
                                    </span>
                                ))}
                            </div>
                            <div className="pt-4 border-t border-white/10 flex justify-between items-center text-[10px] text-slate-400">
                                <span>Published: {new Date(hoveredArticle.publishDate).toLocaleDateString()}</span>
                                {hoveredArticle.pdfUrl && (
                                    <a
                                        href={hoveredArticle.pdfUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 font-medium"
                                    >
                                        View PDF <ExternalLink className="w-3 h-3" />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div
                    className="relative w-full h-full bg-white/10 border border-white/20 rounded-2xl overflow-hidden glass-panel shadow-2xl pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                    ref={containerRef}
                >
                    {/* Header */}
                    <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center bg-white/5 border-b border-white/10 z-10">
                        <div className="flex items-center gap-2 text-white">
                            <Network className="w-5 h-5 text-blue-400" />
                            <h3 className="font-semibold">Knowledge Graph Explorer</h3>
                        </div>
                        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                            <X className="w-5 h-5 text-white/70" />
                        </button>
                    </div>

                    {/* SVG for Edges */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        {edges.map((edge, idx) => {
                            const source = nodes.find(n => n.id === edge.sourceId);
                            const target = nodes.find(n => n.id === edge.targetId);
                            if (!source || !target) return null;
                            return (
                                <line
                                    key={`edge-${idx}`}
                                    x1={source.x} y1={source.y}
                                    x2={target.x} y2={target.y}
                                    stroke="rgba(255,255,255,0.2)"
                                    strokeWidth="2"
                                />
                            );
                        })}
                    </svg>

                    {/* Nodes */}
                    <div className="absolute inset-0 pointer-events-none">
                        {nodes.map((node) => (
                            <div
                                key={node.id}
                                className={`absolute pointer-events-auto cursor-grab active:cursor-grabbing transition-transform ${draggedNodeId === node.id ? '' : 'hover:scale-105'} active:scale-95`}
                                style={{
                                    left: node.x - 30,
                                    top: node.y - 30,
                                    width: 60,
                                    height: 60,
                                    zIndex: draggedNodeId === node.id ? 50 : 5,
                                }}
                                onMouseEnter={() => setHoveredArticle(node)}
                                onMouseLeave={() => setHoveredArticle(null)}
                                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                                onClick={() => handleNodeClick(node)}
                            >
                                <div
                                    className="w-full h-full rounded-full border-2 border-white/40 shadow-lg flex items-center justify-center p-2 text-center overflow-hidden"
                                    style={{ backgroundColor: node.color }}
                                >
                                    <span className="text-[8px] font-bold text-white line-clamp-3 leading-tight select-none">
                                        {node.title}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-30 pointer-events-none">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}

                    <div className="absolute bottom-4 left-4 text-[10px] text-white/40">
                        Click nodes to expand the graph • Top results prioritized
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GraphRecommendationPopup;

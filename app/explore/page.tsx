/*!
 * @file explore/page.tsx
 * @brief Interactive exploration graph view for articles.
 * @author ${author}
 * @email ${email}
 * @date ${date}
 * @copyright Copyright (c) ${year} for benefit of ${collaboration}
 */
'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import NetworkBackground from '@/components/NetworkBackground';
import { db } from '@/lib/db';
import { Article } from '@/lib/types';
import { fetchAPI } from '@/lib/api';

export default function ExplorePage() {
    const { user, isLoading, logout } = useAuth();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/');
        }
    }, [user, isLoading, router]);

    if (isLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
                <NetworkBackground />
                <div className="relative z-10 text-xl text-gray-700">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Network background */}
            <NetworkBackground />

            {/* Content */}
            <div className="relative z-10">
                {/* Header */}
                <div className="bg-white/40 backdrop-blur-md border-b border-white/30 shadow-lg">
                    <div className="container mx-auto px-6 py-4">
                        <div className="flex items-center justify-between">
                            <Link href="/home">
                                <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 cursor-pointer hover:scale-105 transition-transform">
                                    JourNet
                                </h1>
                            </Link>
                            <div className="flex items-center space-x-6">
                                <Link
                                    href="/explore"
                                    className="px-4 py-2 text-sm font-semibold text-blue-600 transition-colors flex items-center space-x-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <span>Explore</span>
                                </Link>
                                <Link
                                    href="/user"
                                    className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors flex items-center space-x-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span>User</span>
                                </Link>
                                <span className="text-gray-700 font-medium">
                                    Welcome, <span className="text-blue-600">{user.username}</span>
                                </span>
                                <button
                                    onClick={handleLogout}
                                    className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-red-600 transition-colors"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="container mx-auto px-6 py-6">
                    <div className="bg-white/50 backdrop-blur-md rounded-2xl p-4 border border-white/30 shadow-xl">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Explore Graph</h2>
                        <p className="text-sm text-gray-600 mb-4">
                            Click a node to fetch related articles. Drag to rearrange. Hover to preview.
                        </p>
                        <GraphCanvas />
                    </div>
                </div>
            </div>
        </div>
    );
}

/*!
 * @brief Force-directed graph canvas rendering component with interactions.
 * @public
 * @param none
 * @return JSX.Element
 */
function GraphCanvas() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const { user } = useAuth(); // use backend endpoints that require user id
    const authToken = (user as any)?.token ?? (user as any)?.accessToken ?? null;

    // Node and edge state
    const [nodes, setNodes] = useState<GraphNode[]>([]);
    const [edges, setEdges] = useState<GraphEdge[]>([]);
    const [hoverNodeId, setHoverNodeId] = useState<string | null>(null);
    const [dragState, setDragState] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
    const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
    const [expandingNodeId, setExpandingNodeId] = useState<string | null>(null);

    // Selected node for permanent preview (click to change)
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    // Camera state
    const [camera, setCamera] = useState<{ tx: number; ty: number; scale: number }>({ tx: 0, ty: 0, scale: 1 });
    const [isPanning, setIsPanning] = useState(false);
    const panStartRef = useRef<{ mx: number; my: number; tx: number; ty: number } | null>(null);

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

    // Seed with a single User Node
    useEffect(() => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;
        const cx = w / 2;
        const cy = h / 2;

        setNodes([{
            id: 'user-root',
            x: cx,
            y: cy,
            vx: 0,
            vy: 0,
            radius: 30, // Slightly larger
            isFixed: true,
            isUser: true,
        }]);
    }, [dpr]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const resize = () => {
            const rect = canvas.getBoundingClientRect();
            canvas.width = Math.floor(rect.width * dpr);
            canvas.height = Math.floor(rect.height * dpr);
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(canvas);
        return () => ro.disconnect();
    }, [dpr]);

    // Physics loop
    useEffect(() => {
        let raf = 0;
        const loop = () => {
            stepPhysics();
            draw();
            raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(raf);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nodes, edges, hoverNodeId, camera, expandingNodeId]);

    /*!
     * @brief Converts screen coords to world coords using camera.
     * @private
     * @param x number, y number
     * @return { x: number; y: number }
     */
    const screenToWorld = (x: number, y: number): { x: number; y: number } => {
        const wx = (x - camera.tx) / camera.scale;
        const wy = (y - camera.ty) / camera.scale;
        return { x: wx, y: wy };
    };

    /*!
     * @brief Computes a single physics step (repulsion, attraction, damping, overlap prevention).
     * @private
     * @param none
     * @return void
     */
    const stepPhysics = () => {
        if (nodes.length === 0) return;

        // Parameters
        const repulsion = 2500;
        const linkK = 0.02;
        const linkRest = 140;
        const damping = 0.85;
        const maxSpeed = 4.5;
        const minSep = 48;

        // Apply repulsion (skip fixed)
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const a = nodes[i];
                const b = nodes[j];
                let dx = a.x - b.x;
                let dy = a.y - b.y;
                let dist2 = dx * dx + dy * dy;
                if (dist2 === 0) {
                    dx = (Math.random() - 0.5) * 0.01;
                    dy = (Math.random() - 0.5) * 0.01;
                    dist2 = dx * dx + dy * dy;
                }
                const force = repulsion / dist2;
                const dist = Math.sqrt(dist2);
                const fx = (force * dx) / dist;
                const fy = (force * dy) / dist;

                if (!a.isFixed) {
                    a.vx += fx;
                    a.vy += fy;
                }
                if (!b.isFixed) {
                    b.vx -= fx;
                    b.vy -= fy;
                }

                // Prevent overlaps with a minimum separation (nudge movable nodes)
                if (dist < minSep) {
                    const push = (minSep - dist) * 0.2;
                    const ux = dx / (dist || 1);
                    const uy = dy / (dist || 1);
                    if (!a.isFixed) {
                        a.x += ux * push;
                        a.y += uy * push;
                    }
                    if (!b.isFixed) {
                        b.x -= ux * push;
                        b.y -= uy * push;
                    }
                }
            }
        }

        // Link attraction (apply forces only to non-fixed)
        for (const e of edges) {
            const a = nodes.find(n => n.id === e.sourceId);
            const b = nodes.find(n => n.id === e.targetId);
            if (!a || !b) continue;
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const stretch = dist - linkRest;
            const force = linkK * stretch;
            const ux = dx / (dist || 1);
            const uy = dy / (dist || 1);

            if (!a.isFixed) {
                a.vx += ux * force;
                a.vy += uy * force;
            }
            if (!b.isFixed) {
                b.vx -= ux * force;
                b.vy -= uy * force;
            }

            // Snapping
            if (dist > linkRest * 1.4) {
                const snap = (dist - linkRest * 1.4) * 0.015;
                if (!a.isFixed) {
                    a.x += ux * snap;
                    a.y += uy * snap;
                }
                if (!b.isFixed) {
                    b.x -= ux * snap;
                    b.y -= uy * snap;
                }
            }
        }

        // Integrate and damp
        const canvas = canvasRef.current;
        const w = canvas ? canvas.width / dpr : 0;
        const h = canvas ? canvas.height / dpr : 0;

        for (const n of nodes) {
            // If dragging or fixed, skip physics integration for that node
            if ((dragState && dragState.id === n.id) || n.isFixed) continue;

            n.vx *= damping;
            n.vy *= damping;

            const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
            if (speed > maxSpeed) {
                const scale = maxSpeed / speed;
                n.vx *= scale;
                n.vy *= scale;
            }

            n.x += n.vx;
            n.y += n.vy;

            // Keep inside world bounds loosely (use viewport size mapped to world without camera)
            n.x = Math.max(n.radius, Math.min(w - n.radius, n.x));
            n.y = Math.max(n.radius, Math.min(h - n.radius, n.y));
        }
    };

    /*!
     * @brief Renders the graph to the canvas (camera aware). Tooltip removed — preview is persistent React panel.
     * @private
     * @param none
     * @return void
     */
    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.save();
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

        // Apply camera transform
        ctx.translate(camera.tx, camera.ty);
        ctx.scale(camera.scale, camera.scale);

        // Constants for style
        const baseBlue = '#2563eb'; // blue-600
        const basePurple = '#9333ea'; // purple-600

        // draw edges
        for (const e of edges) {
            const a = nodes.find(n => n.id === e.sourceId);
            const b = nodes.find(n => n.id === e.targetId);
            if (!a || !b) continue;
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            ctx.beginPath();
            ctx.lineWidth = 1.5 / camera.scale;

            // Gradient edge
            const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
            // Alpha fades based on length/stretch
            const alpha = Math.max(0.1, Math.min(0.4, 1.0 - Math.abs(dist - 140) / 300));
            grad.addColorStop(0, `rgba(37, 99, 235, ${alpha})`); // blue
            grad.addColorStop(1, `rgba(147, 51, 234, ${alpha})`); // purple

            ctx.strokeStyle = grad;
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
        }

        // draw nodes
        for (const n of nodes) {
            const isHover = hoverNodeId === n.id;
            const isSelected = selectedNodeId === n.id;

            ctx.beginPath();
            ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);

            // Node Gradient (Glassmorphismish)
            const nodeGrad = ctx.createLinearGradient(n.x - n.radius, n.y - n.radius, n.x + n.radius, n.y + n.radius);

            if (n.isUser) {
                // Gold/Orange for User
                nodeGrad.addColorStop(0, '#f59e0b'); // amber-500
                nodeGrad.addColorStop(1, '#ea580c'); // orange-600
            } else {
                // Blue/Purple for papers
                nodeGrad.addColorStop(0, '#3b82f6'); // blue-500
                nodeGrad.addColorStop(1, '#8b5cf6'); // violet-500
            }

            ctx.fillStyle = nodeGrad;

            // Shadow/Glow
            if (isHover || isSelected) {
                ctx.shadowColor = 'rgba(59, 130, 246, 0.5)';
                ctx.shadowBlur = 15;
            } else {
                ctx.shadowColor = 'rgba(0,0,0,0.1)';
                ctx.shadowBlur = 4;
            }

            ctx.fill();

            // Reset shadow
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;

            // Border (White for glass effect)
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = (isSelected ? 3 : 1.5) / camera.scale;
            ctx.stroke();

            // Label
            const label = n.isUser ? 'You' : (n.article ? getShortTitle(n.article.title) : '');

            // Dynamic font size based on zoom, clamped
            // Using system fonts that match the app's clean look
            const fontSize = Math.max(10, (n.isUser ? 14 : 12) / camera.scale);
            ctx.font = `${n.isUser ? '700' : '600'} ${fontSize}px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial`;
            ctx.fillStyle = n.isUser ? '#ffffff' : '#1e293b'; // White for user, slate for articles
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Text background (pill) for better readability? 
            if (n.isUser) {
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = 4;
            } else {
                ctx.shadowColor = 'white';
                ctx.shadowBlur = 4;
                ctx.lineWidth = 3;
                ctx.strokeText(label, n.x, n.y - n.radius - (12 / camera.scale));
            }

            ctx.fillText(label, n.x, n.y - (n.isUser ? 0 : n.radius + (12 / camera.scale)));

            // Reset styles
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;

            // Loading pulse for expanding node
            // Loading pulse for expanding node
            if (expandingNodeId === n.id || (n.isUser && isLoadingRecommendations)) {
                const time = Date.now() / 200;
                const radius = n.radius + 6 + Math.sin(time) * 3;
                ctx.beginPath();
                ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
                ctx.strokeStyle = n.isUser ? '#f59e0b' : '#8b5cf6';
                ctx.lineWidth = 2 / camera.scale;
                ctx.setLineDash([4 / camera.scale, 4 / camera.scale]);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }

        ctx.restore();
    };

    /*!
     * @brief Handles mouse move: hover detection, node drag, or panning (camera aware).
     * @private
     * @param e MouseEvent
     * @return void
     */
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        if (isPanning && panStartRef.current) {
            const dx = mx - panStartRef.current.mx;
            const dy = my - panStartRef.current.my;
            if (panStartRef.current) {
                const startTx = panStartRef.current.tx;
                const startTy = panStartRef.current.ty;
                setCamera(prev => ({ ...prev, tx: startTx + dx, ty: startTy + dy }));
            }
            setHoverNodeId(null);
            return;
        }

        const world = screenToWorld(mx, my);

        if (dragState) {
            const node = nodes.find(n => n.id === dragState.id);
            if (node) {
                node.x = world.x + dragState.offsetX;
                node.y = world.y + dragState.offsetY;
                node.isFixed = true; // once user drags, keep node fixed
            }
            return;
        }

        let found: GraphNode | null = null;
        for (const n of nodes) {
            const dx = world.x - n.x;
            const dy = world.y - n.y;
            if (dx * dx + dy * dy <= n.radius * n.radius) {
                found = n;
                break;
            }
        }
        setHoverNodeId(found ? found.id : null);
    };

    /*!
     * @brief Starts dragging a node or starts panning if empty space.
     * @private
     * @param e MouseEvent
     * @return void
     */
    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const world = screenToWorld(mx, my);

        for (const n of nodes) {
            const dx = world.x - n.x;
            const dy = world.y - n.y;
            if (dx * dx + dy * dy <= n.radius * n.radius) {
                setDragState({ id: n.id, offsetX: n.x - world.x, offsetY: n.y - world.y });
                return;
            }
        }

        // Start panning background
        setIsPanning(true);
        panStartRef.current = { mx, my, tx: camera.tx, ty: camera.ty };
    };

    /*!
     * @brief Ends dragging or panning on mouse up.
     * @private
     * @param e MouseEvent
     * @return void
     */
    const handleMouseUp = (_e: React.MouseEvent<HTMLCanvasElement>) => {
        setDragState(null);
        setIsPanning(false);
        panStartRef.current = null;
    };

    /*!
     * @brief Mouse leave cleanup.
     * @private
     * @param e MouseEvent
     * @return void
     */
    const handleMouseLeave = (_e: React.MouseEvent<HTMLCanvasElement>) => {
        setDragState(null);
        setIsPanning(false);
        panStartRef.current = null;
        setHoverNodeId(null);
    };

    /*!
     * @brief Handles zooming with the mouse wheel (pinch-like). Zoom to cursor.
     * @private
     * @param e WheelEvent
     * @return void
     */
    const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        const zoomFactor = Math.exp(-e.deltaY * 0.001); // smooth zoom
        const newScale = Math.min(3, Math.max(0.4, camera.scale * zoomFactor));

        // Zoom towards the cursor: adjust translation so the world point under cursor stays under cursor
        const worldBefore = screenToWorld(mx, my);
        const newTx = mx - worldBefore.x * newScale;
        const newTy = my - worldBefore.y * newScale;

        setCamera({ tx: newTx, ty: newTy, scale: newScale });
    };

    /*!
     * @brief Click a node to select it for the preview panel and fetch related nodes.
     * @private
     * @param e MouseEvent
     * @return void
     */
    const handleClick = async (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const world = screenToWorld(mx, my);

        const clicked = nodes.find(n => {
            const dx = world.x - n.x;
            const dy = world.y - n.y;
            return dx * dx + dy * dy <= n.radius * n.radius;
        });
        if (!clicked) return;

        // User Node Interaction: Fetch Recommendations
        if (clicked.isUser) {
            if (isLoadingRecommendations) return; // Already loading

            setIsLoadingRecommendations(true);

            try {
                const json = await fetchAPI('/recommend/?top_k=8');
                if (Array.isArray(json) && json.length > 0) {
                    const newNodes: GraphNode[] = [];
                    const newEdges: GraphEdge[] = [];

                    // Get existing paper node IDs (excluding user node)
                    const existingPaperIds = new Set(
                        nodes.filter(n => !n.isUser && n.article).map(n => n.article!.id.toString())
                    );

                    json.forEach((a: any) => {
                        const paperId = a.id?.toString() || '';
                        if (paperId && !existingPaperIds.has(paperId)) {
                            const angle = Math.random() * Math.PI * 2;
                            const dist = 180 + Math.random() * 80;
                            newNodes.push({
                                id: paperId,
                                article: {
                                    id: paperId,
                                    title: a.title || 'Untitled',
                                    abstract: a.abstract || '',
                                    authors: a.authors || [],
                                    categories: a.categories || '',
                                    aiSummary: a.comments_summary || '',
                                    publishDate: a.updated_date || '',
                                    citation: '',
                                    content: [],
                                    averageRating: 0,
                                    totalRatings: 0,
                                    createdAt: '',
                                } as Article,
                                x: clicked.x + Math.cos(angle) * dist,
                                y: clicked.y + Math.sin(angle) * dist,
                                vx: 0,
                                vy: 0,
                                radius: 22,
                            });
                            existingPaperIds.add(paperId);
                        }
                        // Always add edge to user node
                        if (paperId) {
                            const edgeExists = edges.some(
                                e => (e.sourceId === clicked.id && e.targetId === paperId) ||
                                    (e.sourceId === paperId && e.targetId === clicked.id)
                            );
                            if (!edgeExists) {
                                newEdges.push({ sourceId: clicked.id, targetId: paperId });
                            }
                        }
                    });

                    if (newNodes.length > 0) {
                        setNodes(prev => [...prev, ...newNodes]);
                    }
                    if (newEdges.length > 0) {
                        setEdges(prev => [...prev, ...newEdges]);
                    }
                }
            } catch (err) {
                console.warn('Recommendation fetch failed', err);
            } finally {
                setIsLoadingRecommendations(false);
            }
            return;
        }

        // Article Node Interaction: Preview & Expand
        setSelectedNodeId(clicked.id);

        if (!clicked.article) return;
        if (expandingNodeId) return; // Prevent multiple expansions at once

        setExpandingNodeId(clicked.id);
        try {
            // Fetch related nodes (use auth token or cookies)
            const related = await fetchRelatedNodes(clicked.article, authToken);
            if (related.length === 0) return;

            // Registry map
            const existing = new Map<string, GraphNode>();
            nodes.forEach(n => existing.set(n.id, n));

            const newNodes: GraphNode[] = [];
            const newEdges: GraphEdge[] = [];

            for (const a of related) {
                if (existing.has(a.id)) {
                    const already = edges.some(e => (e.sourceId === clicked.id && e.targetId === a.id) || (e.sourceId === a.id && e.targetId === clicked.id));
                    if (!already) {
                        newEdges.push({ sourceId: clicked.id, targetId: a.id });
                    }
                } else {
                    const angle = Math.random() * Math.PI * 2;
                    const dist = 160 + Math.random() * 60;
                    newNodes.push({
                        id: a.id,
                        article: a,
                        x: clicked.x + Math.cos(angle) * dist,
                        y: clicked.y + Math.sin(angle) * dist,
                        vx: 0,
                        vy: 0,
                        radius: 22,
                    });
                    newEdges.push({ sourceId: clicked.id, targetId: a.id });
                }
            }

            if (newNodes.length > 0) {
                setNodes(prev => [...prev, ...newNodes]);
            }
            if (newEdges.length > 0) {
                setEdges(prev => [...prev, ...newEdges]);
            }
        } finally {
            setExpandingNodeId(null);
        }
    };

    const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;
    const isUserSelected = selectedNode?.isUser;
    const showArticle = selectedNode && selectedNode.article;

    return (
        <div className="relative w-full h-[640px] rounded-xl overflow-hidden border border-gray-200 bg-white/70 flex">
            {/* Persistent preview panel on the left */}
            <div className="w-80 min-w-[280px] bg-white/95 border-r border-gray-200 p-4 overflow-auto z-10">
                {showArticle && selectedNode && selectedNode.article ? (
                    <div className="text-xs text-slate-800">
                        <div className="mb-3">
                            <div className="text-lg font-semibold">{selectedNode.article.title}</div>
                            <div className="text-[12px] text-gray-600 mt-1">
                                {selectedNode.article.authors.map(a => a.name).join(', ')}
                            </div>
                        </div>
                        <div className="text-[13px] text-gray-700 whitespace-pre-wrap">
                            {selectedNode.article.abstract || 'No abstract available.'}
                        </div>
                        <div className="mt-3 text-[13px] text-blue-800 bg-blue-50 border border-blue-100 rounded p-2">
                            <strong>Community:</strong> {selectedNode.article.aiSummary || 'No community summary yet.'}
                        </div>
                        <a href={`/article/${selectedNode.id}`} className="mt-3 inline-block text-blue-600 hover:text-blue-800 font-medium">Open article →</a>
                    </div>
                ) : isUserSelected ? (
                    <div className="text-sm text-gray-800">
                        <div className="text-lg font-bold mb-2">My Recommendations</div>
                        <p>This is your personal node. It connects to papers recommended for you based on your reading history and interactions.</p>
                        {isLoadingRecommendations ? (
                            <div className="mt-3 flex items-center space-x-2 text-blue-600">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                <span>Loading recommendations...</span>
                            </div>
                        ) : (
                            <p className="mt-3 text-blue-600 font-medium">Click the user node again to fetch more recommendations!</p>
                        )}
                        <p className="mt-2 text-gray-500 text-xs">Click other nodes to explore deeper connections.</p>
                    </div>
                ) : (
                    <div className="text-sm text-gray-500">
                        Click a node on the graph to show a preview here.
                    </div>
                )}
            </div>

            {/* Canvas area */}
            <div className="flex-1 relative">
                <canvas
                    ref={canvasRef}
                    className="w-full h-full cursor-default"
                    onMouseMove={handleMouseMove}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    onWheel={handleWheel}
                    onClick={handleClick}
                />
            </div>
        </div>
    );
}

/*!
 * @brief Returns a short title consisting of the first few words.
 * @private
 * @param title string
 * @return string
 */
function getShortTitle(title: string): string {
    const words = title.split(/\s+/).slice(0, 4).join(' ');
    return words.length < title.length ? `${words}…` : words;
}

/*!
 * @brief Escapes HTML special characters for safe innerHTML.
 * @private
 * @param s string
 * @return string
 */
function escapeHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/*!
 * @brief Fetches related articles for an origin article (queries backend friends-recommender, falls back to local search).
 * @public
 * @param origin Article
 * @param authToken string | undefined  (optional bearer token; cookies will be sent if not provided)
 * @return Promise<Article[]>
 */
async function fetchRelatedNodes(origin: Article, authToken?: string): Promise<Article[]> {
    // Try backend friends recommender first
    try {
        const json = await fetchAPI(`/recommend/friends/?paper_id=${encodeURIComponent(origin.id)}`);
        if (Array.isArray(json) && json.length > 0) {
            // Map backend response to Article format
            return json.slice(0, 6).map((a: any) => ({
                id: a.id?.toString() || '',
                title: a.title || 'Untitled',
                abstract: a.abstract || '',
                authors: a.authors || [],
                categories: a.categories || '',
                aiSummary: a.comments_summary || '',
                publishDate: a.updated_date || '',
                citation: '',
                content: [],
                averageRating: 0,
                totalRatings: 0,
                createdAt: '',
            } as Article));
        }
    } catch (err) {
        console.warn('recommend/friends fetch failed, falling back to local DB', err);
    }

    // Fallback: search by key tokens
    const key = origin.title.split(/\W+/).filter(w => w.length > 3)[0] || origin.title.split(/\s+/)[0];
    let results = await db.articles.search(key);
    results = results.filter(a => a.id !== origin.id);
    return results.slice(0, 6);
}

/*!
 * @brief Graph node data structure.
 * @public
 * @param none
 * @return interface GraphNode
 */
interface GraphNode {
    id: string;
    article?: Article;
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    isFixed?: boolean;
    isUser?: boolean;
    visited?: boolean;
}

/*!
 * @brief Graph edge data structure.
 * @public
 * @param none
 * @return interface GraphEdge
 */
interface GraphEdge {
    sourceId: string;
    targetId: string;
}
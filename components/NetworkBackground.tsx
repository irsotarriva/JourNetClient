'use client';

import { useEffect, useRef } from 'react';

interface Node {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    baseRadius: number;
}

export default function NetworkBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mousePos = useRef({ x: 0, y: 0 });
    const animationFrameId = useRef<number | undefined>(undefined);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Create nodes
        const nodeCount = 50;
        const initialNodes: Node[] = [];
        for (let i = 0; i < nodeCount; i++) {
            initialNodes.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: 4,
                baseRadius: 4,
            });
        }

        // Mouse move handler
        const handleMouseMove = (e: MouseEvent) => {
            mousePos.current = { x: e.clientX, y: e.clientY };
        };
        window.addEventListener('mousemove', handleMouseMove);

        // Animation loop
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Update and draw nodes
            initialNodes.forEach((node, i) => {
                // Update position
                node.x += node.vx;
                node.y += node.vy;

                // Bounce off edges
                if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
                if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

                // Keep within bounds
                node.x = Math.max(0, Math.min(canvas.width, node.x));
                node.y = Math.max(0, Math.min(canvas.height, node.y));

                // Check distance to mouse
                const dx = mousePos.current.x - node.x;
                const dy = mousePos.current.y - node.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const hoverRadius = 100;

                // Animate radius based on mouse proximity
                if (distance < hoverRadius) {
                    const scale = 1 + (1 - distance / hoverRadius) * 3;
                    node.radius = node.baseRadius * scale;
                } else {
                    node.radius += (node.baseRadius - node.radius) * 0.1;
                }

                // Draw connections
                initialNodes.forEach((otherNode, j) => {
                    if (i >= j) return;
                    const dx = otherNode.x - node.x;
                    const dy = otherNode.y - node.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 150) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(59, 130, 246, ${0.2 * (1 - distance / 150)})`;
                        ctx.lineWidth = 1;
                        ctx.moveTo(node.x, node.y);
                        ctx.lineTo(otherNode.x, otherNode.y);
                        ctx.stroke();
                    }
                });

                // Draw node
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(59, 130, 246, 0.6)';
                ctx.fill();

                // Add glow effect for hovered nodes
                if (node.radius > node.baseRadius * 1.5) {
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, node.radius * 1.5, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
                    ctx.fill();
                }
            });

            animationFrameId.current = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-0 pointer-events-none"
        />
    );
}

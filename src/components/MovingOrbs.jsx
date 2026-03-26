import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const MovingOrbs = () => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springX = useSpring(mouseX, { damping: 50, stiffness: 400 });
    const springY = useSpring(mouseY, { damping: 50, stiffness: 400 });

    useEffect(() => {
        const handleMouseMove = (e) => {
            const { clientX, clientY } = e;
            const moveX = (clientX / window.innerWidth) - 0.5;
            const moveY = (clientY / window.innerHeight) - 0.5;
            mouseX.set(moveX);
            mouseY.set(moveY);
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Different depths for orbs
    const x1 = useTransform(springX, [ -0.5, 0.5 ], [ -100, 100 ]);
    const y1 = useTransform(springY, [ -0.5, 0.5 ], [ -100, 100 ]);

    const x2 = useTransform(springX, [ -0.5, 0.5 ], [ 80, -80 ]);
    const y2 = useTransform(springY, [ -0.5, 0.5 ], [ 80, -80 ]);

    const x3 = useTransform(springX, [ -0.5, 0.5 ], [ -40, 40 ]);
    const y3 = useTransform(springY, [ -0.5, 0.5 ], [ 40, -40 ]);

    return (
        <div className="orbs-container" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            pointerEvents: 'none',
            zIndex: -3,
            opacity: 0.5
        }}>
            <motion.div style={{ x: x1, y: y1 }} className="orb orb-1" />
            <motion.div style={{ x: x2, y: y2 }} className="orb orb-2" />
            <motion.div style={{ x: x3, y: y3 }} className="orb orb-3" />

            <style dangerouslySetInnerHTML={{ __html: `
                .orb {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(100px);
                    opacity: 0.45;
                    transition: background 0.5s ease;
                }
                .orb-1 {
                    width: 600px;
                    height: 600px;
                    background: var(--primary);
                    top: -15%;
                    left: -15%;
                    filter: blur(120px);
                }
                .orb-2 {
                    width: 500px;
                    height: 500px;
                    background: #ec4899;
                    bottom: -10%;
                    right: -10%;
                    filter: blur(120px);
                }
                .orb-3 {
                    width: 450px;
                    height: 450px;
                    background: #6366f1;
                    top: 30%;
                    left: 40%;
                    filter: blur(100px);
                }
            `}} />
        </div>
    );
};

export default MovingOrbs;

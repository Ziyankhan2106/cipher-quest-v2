import React, { useEffect, useRef } from 'react';

const RainEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width: number, height: number, raindrops: any[];
    const rainCount = 200; 

    class RainDrop {
      layer: number;
      x: number = 0;
      y: number = 0;
      velocity: number = 0;
      length: number = 0;
      opacity: number = 0;
      weight: number = 0;

      constructor() {
        this.layer = Math.floor(Math.random() * 3);
        this.reset();
        this.y = Math.random() * (height || window.innerHeight);
      }

      reset() {
        this.x = Math.random() * width;
        this.y = -100;

        if (this.layer === 0) { // Background
          this.velocity = Math.random() * 0.4 + 1.5;
          this.length = Math.random() * 10 + 10;
          this.opacity = 0.15;
          this.weight = 0.5;
        } else if (this.layer === 1) { // Midground
          this.velocity = Math.random() * 0.6 + 2.5;
          this.length = Math.random() * 20 + 20;
          this.opacity = 0.25;
          this.weight = 1.0;
        } else { // Foreground
          this.velocity = Math.random() * 0.8 + 4.0;
          this.length = Math.random() * 30 + 40;
          this.opacity = 0.4;
          this.weight = 1.5;
        }
      }

      draw() {
        if (!ctx) return;
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.length);
        gradient.addColorStop(0, 'rgba(170, 190, 210, 0)');
        gradient.addColorStop(1, `rgba(170, 190, 210, ${this.opacity})`);

        ctx.beginPath();
        ctx.strokeStyle = gradient;
        ctx.lineWidth = this.weight;
        ctx.lineCap = 'round';
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x, this.y + this.length);
        ctx.stroke();
      }

      update() {
        this.y += this.velocity * 2; 
        if (this.y > height) {
          this.reset();
        }
      }
    }

    const init = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;

      raindrops = [];
      for (let i = 0; i < rainCount; i++) {
        raindrops.push(new RainDrop());
      }
    };

    let animationFrameId: number;
    const animate = () => {
      ctx.clearRect(0, 0, width, height); 

      raindrops.forEach(drop => {
        drop.update();
        drop.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', init);
    init();
    animate();

    return () => {
      window.removeEventListener('resize', init);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[1]"
      style={{ mixBlendMode: 'plus-lighter' }}
    />
  );
};

export default RainEffect;

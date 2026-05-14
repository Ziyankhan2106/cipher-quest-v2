import { Chapter } from './game-data';

export const generateCertificate = (chapter: Chapter | null, operatorName: string, themeColor: string): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = 700;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';

  const isMaster = !chapter;

  // Dark void background
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, 1000, 700);
  
  // Outer Tech Border
  ctx.strokeStyle = '#222222';
  ctx.lineWidth = 4;
  ctx.strokeRect(30, 30, 940, 640);
  
  // Inner Neon Box
  ctx.strokeStyle = isMaster ? '#ffffff' : themeColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, 920, 620);
  
  // Corner accents
  ctx.fillStyle = isMaster ? '#ffffff' : themeColor;
  ctx.fillRect(35, 35, 20, 5); ctx.fillRect(35, 35, 5, 20); // Top Left
  ctx.fillRect(945, 35, 20, 5); ctx.fillRect(960, 35, 5, 20); // Top Right
  ctx.fillRect(35, 660, 20, 5); ctx.fillRect(35, 645, 5, 20); // Bottom Left
  ctx.fillRect(945, 660, 20, 5); ctx.fillRect(960, 645, 5, 20); // Bottom Right
  
  // Top Security Header
  ctx.textAlign = 'center';
  ctx.fillStyle = isMaster ? '#ffffff' : themeColor;
  ctx.font = 'bold 20px monospace';
  if (isMaster) {
    ctx.fillText('// TOTAL SYNDICATE COLLAPSE - GLOBAL CLEARANCE GRANTED //', 500, 80);
  } else {
    ctx.fillText('// SYNDICATE NETWORK DEFEATED - SECTOR SECURED //', 500, 80);
  }
  
  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 64px sans-serif';
  ctx.fillText(isMaster ? 'CIPHER MASTER' : 'PROTOCOL MASTERY', 500, 220);
  
  // Subtitle
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = 'italic 32px sans-serif';
  ctx.fillText(isMaster ? 'Ultimate Neural Transcendence' : 'Official Resistance Clearance', 500, 280);
  
  // Chapter Info
  if (isMaster) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 80px sans-serif';
    ctx.fillText('ALL PHASES CLEAR', 500, 410);
    ctx.font = '24px monospace';
    ctx.fillText('STORY MODE: COMPLETED', 500, 460);
  } else {
    ctx.fillStyle = themeColor;
    ctx.font = '80px sans-serif';
    ctx.fillText(`PHASE 0${chapter.id}`, 500, 410);
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px monospace';
    ctx.fillText(chapter.title.toUpperCase(), 500, 460);
  }
  
  // Operative details
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '20px monospace';
  ctx.fillText('OPERATIVE CALLSIGN:', 100, 550);
  ctx.fillText('TIMESTAMP OF CLEARANCE:', 100, 590);
  
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'right';
  ctx.fillText(operatorName.toUpperCase(), 900, 550);
  ctx.fillText(new Date().toLocaleString(), 900, 590);
  
  // Hex decorative elements
  ctx.fillStyle = isMaster ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)';
  ctx.beginPath();
  ctx.arc(500, 370, 180, 0, Math.PI * 2);
  ctx.fill();
  
  return canvas.toDataURL('image/png');
};

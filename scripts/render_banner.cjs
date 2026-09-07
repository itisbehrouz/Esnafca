const { chromium } = require("playwright");
const path = require("path");

async function generateBanner() {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 2400, height: 750 },
    deviceScaleFactor: 1,
  });

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      -webkit-font-smoothing: antialiased;
    }
    body {
      width: 2400px;
      height: 750px;
      background-color: #030712;
      color: #F8FAFC;
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", system-ui, sans-serif;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 64px 84px;
    }

    /* Technical Coordinate Grid */
    .bg-grid {
      position: absolute;
      inset: 0;
      background-image: 
        linear-gradient(to right, rgba(255, 255, 255, 0.032) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.032) 1px, transparent 1px);
      background-size: 60px 60px;
      pointer-events: none;
      z-index: 1;
    }

    /* Radial glow accents - Emerald & Slate for local commerce */
    .radial-glow-top {
      position: absolute;
      top: -140px;
      left: 15%;
      width: 900px;
      height: 500px;
      background: radial-gradient(circle, rgba(16, 185, 129, 0.16) 0%, transparent 70%);
      pointer-events: none;
      z-index: 1;
    }

    .radial-glow-right {
      position: absolute;
      top: 40px;
      right: -60px;
      width: 950px;
      height: 700px;
      background: radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, transparent 65%);
      pointer-events: none;
      z-index: 1;
    }

    /* 3D Geometric Structure Container */
    .canvas-3d-container {
      position: absolute;
      right: 90px;
      top: 40px;
      width: 700px;
      height: 650px;
      pointer-events: none;
      z-index: 3;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #canvas3d {
      width: 700px;
      height: 650px;
    }

    /* Top Bar */
    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
      z-index: 10;
    }

    .role-badge {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      padding: 10px 22px;
      background: rgba(30, 41, 59, 0.65);
      border: 1px solid rgba(16, 185, 129, 0.35);
      border-radius: 9999px;
      font-size: 19px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #E2E8F0;
      backdrop-filter: blur(12px);
    }

    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #10B981;
      box-shadow: 0 0 12px #10B981;
    }

    .meta-location {
      font-size: 19px;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #64748B;
      font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    }

    /* Main Identity Center */
    .hero-body {
      position: relative;
      z-index: 10;
      margin-top: 10px;
    }

    .project-name {
      font-size: 92px;
      font-weight: 800;
      line-height: 1.05;
      letter-spacing: -0.04em;
      color: #FFFFFF;
      margin-bottom: 18px;
    }

    .project-subtitle {
      font-size: 30px;
      line-height: 1.35;
      color: #94A3B8;
      font-weight: 400;
      max-width: 1550px;
      margin-bottom: 30px;
    }

    .project-subtitle strong {
      color: #F8FAFC;
      font-weight: 600;
    }

    /* CLI Chips */
    .cli-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 14px;
    }

    .cli-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 9px 18px;
      background: rgba(15, 23, 42, 0.75);
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 8px;
      font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
      font-size: 18px;
      font-weight: 500;
      color: #CBD5E1;
      backdrop-filter: blur(8px);
    }

    .cli-prompt {
      color: #10B981;
      font-weight: 600;
    }

    /* 4-Column Bottom Architecture Grid */
    .architecture-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 28px;
      position: relative;
      z-index: 10;
      padding-top: 28px;
      border-top: 1px solid rgba(255, 255, 255, 0.09);
    }

    .grid-col {
      border-left: 2px solid rgba(16, 185, 129, 0.5);
      padding-left: 18px;
      display: flex;
      flex-direction: column;
    }

    .col-header {
      font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #10B981;
      margin-bottom: 6px;
    }

    .col-title {
      font-size: 21px;
      font-weight: 700;
      color: #F8FAFC;
      letter-spacing: -0.02em;
      margin-bottom: 6px;
    }

    .col-desc {
      font-size: 15px;
      line-height: 1.45;
      color: #94A3B8;
      font-weight: 400;
    }
  </style>
</head>
<body>
  <div class="bg-grid"></div>
  <div class="radial-glow-top"></div>
  <div class="radial-glow-right"></div>

  <!-- 3D Geometric Structure -->
  <div class="canvas-3d-container">
    <canvas id="canvas3d" width="700" height="650"></canvas>
  </div>

  <!-- Top Bar -->
  <div class="top-bar">
    <div class="role-badge">
      <div class="status-dot"></div>
      Open-Source Local Commerce Engine
    </div>
    <div class="meta-location">
      Next.js 15 • Prisma 6 • Leaflet 1.9
    </div>
  </div>

  <!-- Hero Body -->
  <div class="hero-body">
    <h1 class="project-name">ESNAFÇA</h1>
    <p class="project-subtitle">
      Hyper-local platform for <strong>neighborhood merchants</strong>, <strong>interactive map discovery</strong>, and <strong>zero-friction bookings</strong>.
    </p>
    <div class="cli-chips">
      <div class="cli-chip"><span class="cli-prompt">$</span> nextjs.app-router</div>
      <div class="cli-chip"><span class="cli-prompt">$</span> prisma.postgresql</div>
      <div class="cli-chip"><span class="cli-prompt">$</span> leaflet.geo-clusters</div>
      <div class="cli-chip"><span class="cli-prompt">$</span> rfc7807.problem-details</div>
      <div class="cli-chip"><span class="cli-prompt">$</span> zero-trust.admin</div>
    </div>
  </div>

  <!-- 4-Column Architecture Grid -->
  <div class="architecture-grid">
    <div class="grid-col">
      <div class="col-header">01 / Discovery</div>
      <div class="col-title">Leaflet Geolocation</div>
      <div class="col-desc">Real-time neighborhood maps, category clustering, and instant directions.</div>
    </div>
    <div class="grid-col">
      <div class="col-header">02 / Merchant</div>
      <div class="col-title">Digital Storefronts</div>
      <div class="col-desc">Physical window QR stickers, service catalogs, and mobile self-service.</div>
    </div>
    <div class="grid-col">
      <div class="col-header">03 / Scheduling</div>
      <div class="col-title">Booking Engine</div>
      <div class="col-desc">Zero-friction appointment scheduler with double-booking prevention.</div>
    </div>
    <div class="grid-col">
      <div class="col-header">04 / Security</div>
      <div class="col-title">Zero-Trust Admin HQ</div>
      <div class="col-desc">Real-time SSE event telemetry, strict RBAC, and immutable audit logs.</div>
    </div>
  </div>

  <!-- 3D Canvas Rendering Script -->
  <script>
    const canvas = document.getElementById('canvas3d');
    const ctx = canvas.getContext('2d');
    const cx = canvas.width / 2 + 20;
    const cy = canvas.height / 2 - 15;

    // 3D Isometric projection angles
    const pitch = 26 * Math.PI / 180;
    const yaw = 40 * Math.PI / 180;

    function project(x, y, z) {
      const x1 = x * Math.cos(yaw) + z * Math.sin(yaw);
      const y1 = y;
      const z1 = -x * Math.sin(yaw) + z * Math.cos(yaw);
      const x2 = x1;
      const y2 = y1 * Math.cos(pitch) - z1 * Math.sin(pitch);
      const z2 = y1 * Math.sin(pitch) + z1 * Math.cos(pitch);
      return { x: cx + x2, y: cy + y2, z: z2 };
    }

    // Outer 3D Cube
    const S = 140;
    const vertices = [
      project(-S, -S, -S),
      project( S, -S, -S),
      project( S,  S, -S),
      project(-S,  S, -S),
      project(-S, -S,  S),
      project( S, -S,  S),
      project( S,  S,  S),
      project(-S,  S,  S)
    ];

    // Inner 3D Cube
    const S2 = 72;
    const innerVertices = [
      project(-S2, -S2, -S2),
      project( S2, -S2, -S2),
      project( S2,  S2, -S2),
      project(-S2,  S2, -S2),
      project(-S2, -S2,  S2),
      project( S2, -S2,  S2),
      project( S2,  S2,  S2),
      project(-S2,  S2,  S2)
    ];

    // Subtle 3D ground coordinates
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.08)';
    ctx.lineWidth = 1;
    for (let g = -240; g <= 240; g += 60) {
      const p1 = project(g, S + 60, -240);
      const p2 = project(g, S + 60, 240);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      const p3 = project(-240, S + 60, g);
      const p4 = project(240, S + 60, g);
      ctx.beginPath();
      ctx.moveTo(p3.x, p3.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.stroke();
    }

    function drawFace(verts, idxs, fillStyle, strokeStyle, lineWidth) {
      ctx.beginPath();
      ctx.moveTo(verts[idxs[0]].x, verts[idxs[0]].y);
      for (let i = 1; i < idxs.length; i++) {
        ctx.lineTo(verts[idxs[i]].x, verts[idxs[i]].y);
      }
      ctx.closePath();
      if (fillStyle) {
        ctx.fillStyle = fillStyle;
        ctx.fill();
      }
      if (strokeStyle) {
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth || 1.5;
        ctx.stroke();
      }
    }

    // Outer cube faces & glowing edges
    drawFace(vertices, [0, 1, 5, 4], 'rgba(16, 185, 129, 0.09)', 'rgba(16, 185, 129, 0.55)', 2);
    drawFace(vertices, [4, 0, 3, 7], 'rgba(15, 23, 42, 0.5)', 'rgba(16, 185, 129, 0.4)', 1.5);
    drawFace(vertices, [5, 4, 7, 6], 'rgba(30, 41, 59, 0.35)', 'rgba(16, 185, 129, 0.5)', 2);
    drawFace(vertices, [1, 5, 6, 2], 'rgba(15, 23, 42, 0.35)', 'rgba(16, 185, 129, 0.35)', 1.5);

    // Connecting dashed lines
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.28)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(vertices[i].x, vertices[i].y);
      ctx.lineTo(innerVertices[i].x, innerVertices[i].y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Inner cube faces & edges
    drawFace(innerVertices, [0, 1, 5, 4], 'rgba(16, 185, 129, 0.22)', 'rgba(167, 243, 208, 0.85)', 1.5);
    drawFace(innerVertices, [4, 0, 3, 7], 'rgba(5, 150, 105, 0.18)', 'rgba(16, 185, 129, 0.6)', 1.5);
    drawFace(innerVertices, [5, 4, 7, 6], 'rgba(56, 189, 248, 0.18)', 'rgba(167, 243, 208, 0.85)', 1.5);
    drawFace(innerVertices, [1, 5, 6, 2], 'rgba(30, 41, 59, 0.25)', 'rgba(16, 185, 129, 0.6)', 1.5);

    // Glowing nodes at outer vertices
    vertices.forEach(v => {
      ctx.shadowColor = '#10B981';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#10B981';
      ctx.beginPath();
      ctx.arc(v.x, v.y, 4.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Glowing nodes at inner vertices
    innerVertices.forEach(v => {
      ctx.shadowColor = '#A7F3D0';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(v.x, v.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  </script>
</body>
</html>
  `;

  await page.setContent(htmlContent, { waitUntil: "networkidle" });
  const outputPath = path.join(__dirname, "..", "public", "brand", "banner.png");
  await page.screenshot({ path: outputPath, type: "png" });
  await browser.close();
  console.log("Successfully generated pixel-perfect banner.png at:", outputPath);
}

generateBanner().catch((err) => {
  console.error("Banner generation failed:", err);
  process.exit(1);
});

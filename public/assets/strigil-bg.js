/**
 * Strigil WebGL Dynamic Background Engine (Black & Blue Theme)
 * Custom tuned for JAGESTORE dark esports aesthetic: Deep Void Black + Neon Cyan / Cobalt Blue
 * Lightweight, zero-dependency, 60fps hardware-accelerated animated gradient
 */
(function() {
  function initStrigilBackground(options = {}) {
    const canvasId = options.canvasId || 'strigil-bg';
    let canvas = document.getElementById(canvasId);
    
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = canvasId;
      canvas.style.position = 'fixed';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
      canvas.style.zIndex = options.zIndex || '-1';
      canvas.style.pointerEvents = options.interactive === false ? 'none' : 'auto';
      document.body.prepend(canvas);
    }

    const gl = canvas.getContext('webgl', { antialias: true, alpha: true });
    if (!gl) return;

    const vsSource = `
      attribute vec2 a_pos;
      void main() {
        gl_Position = vec4(a_pos, 0.0, 1.0);
      }
    `;

    const fsSource = `
      precision highp float;
      uniform vec2 u_res;
      uniform vec2 u_mouse;
      uniform vec2 u_mouse_vel;
      uniform float u_time;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
                   mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        vec2 shift = vec2(100.0);
        mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
        for (int i = 0; i < 5; ++i) {
          v += a * noise(p);
          p = rot * p * 2.0 + shift;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec2 st = gl_FragCoord.xy / u_res.xy;
        float aspect = u_res.x / u_res.y;
        vec2 uv = st;
        uv.x *= aspect;

        vec2 mouse = u_mouse;
        mouse.x *= aspect;

        // Fanning Axis Angle (45 deg diagonal smear)
        float rad = 0.785398;
        vec2 dir = vec2(cos(rad), sin(rad));
        vec2 perp = vec2(-dir.y, dir.x);

        // Pointer velocity smear
        float dist = length(uv - mouse);
        float mouseInf = smoothstep(0.8, 0.0, dist);
        vec2 warpedUV = uv + u_mouse_vel * mouseInf * 1.5;

        float t = u_time * 0.12;
        vec2 q = vec2(
          fbm(warpedUV + t * 0.2 + dir * 0.4),
          fbm(warpedUV + vec2(1.0) - t * 0.15 + perp * 0.3)
        );

        vec2 r = vec2(
          fbm(warpedUV + 1.0 * q + vec2(1.7, 9.2) + 0.1 * t),
          fbm(warpedUV + 1.0 * q + vec2(8.3, 2.8) + 0.08 * t)
        );

        float f = fbm(warpedUV + r * 1.9);
        float smearGrad = dot(uv - vec2(0.5 * aspect, 0.5), dir);
        float mixVal = smoothstep(-0.65, 0.65, smearGrad + (f - 0.5) * 1.25);

        // JAGESTORE Signature Black & Blue Palette
        vec3 colElectricBlue = vec3(0.0, 0.52, 0.95);  // #0084f3 Vibrant Royal/Neon Blue
        vec3 colDeepCobalt   = vec3(0.04, 0.12, 0.28); // #0a1e47 Deep Navy/Cobalt
        vec3 colCyanHighlight= vec3(0.0, 0.90, 1.00);  // #00e5ff Neon Cyan Ridge
        vec3 colVoidBlack    = vec3(0.024, 0.031, 0.055); // #06080e Pure Gaming Dark Black

        // Smeared fluid blending
        vec3 col = mix(colDeepCobalt, colElectricBlue, mixVal);
        
        // Neon Cyan Crest/Ridge line
        float ridge = smoothstep(0.42, 0.58, f) * (1.0 - smoothstep(0.58, 0.75, f));
        col = mix(col, colCyanHighlight, ridge * 0.75);

        // Vignette into deep obsidian black
        float vignette = smoothstep(1.35, 0.25, length(st - 0.5));
        col = mix(colVoidBlack, col, vignette);

        // Micro film grain for anti-banding & luxury texture
        float grain = (hash(gl_FragCoord.xy + fract(u_time)) - 0.5) * 0.08;
        col += grain;

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vsSource));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fsSource));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, 'u_res');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');
    const uMouseVel = gl.getUniformLocation(prog, 'u_mouse_vel');
    const uTime = gl.getUniformLocation(prog, 'u_time');

    function onResize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    }
    window.addEventListener('resize', onResize);
    onResize();

    let mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    let vel = { x: 0, y: 0, tx: 0, ty: 0 };
    let last = { x: 0.5, y: 0.5, t: performance.now() };

    window.addEventListener('pointermove', (e) => {
      const now = performance.now();
      const dt = Math.max((now - last.t) / 1000, 0.001);
      const cx = e.clientX / window.innerWidth;
      const cy = 1.0 - (e.clientY / window.innerHeight);

      mouse.tx = cx;
      mouse.ty = cy;
      vel.tx = ((cx - last.x) / dt) * 0.05;
      vel.ty = ((cy - last.y) / dt) * 0.05;

      last.x = cx;
      last.y = cy;
      last.t = now;
    });

    let simTime = 0;
    function loop() {
      simTime += 0.016;
      mouse.x += (mouse.tx - mouse.x) * 0.08;
      mouse.y += (mouse.ty - mouse.y) * 0.08;
      vel.x += (vel.tx - vel.x) * 0.06;
      vel.y += (vel.ty - vel.y) * 0.06;
      vel.tx *= 0.95;
      vel.ty *= 0.95;

      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform2f(uMouseVel, vel.x, vel.y);
      gl.uniform1f(uTime, simTime);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  window.initStrigilBackground = initStrigilBackground;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initStrigilBackground());
  } else {
    initStrigilBackground();
  }
})();

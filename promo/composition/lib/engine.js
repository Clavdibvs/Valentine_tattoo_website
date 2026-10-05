/**
 * A small deterministic compositor, in the spirit of an After Effects comp.
 *
 * - Layers are textured quads placed in a 2.5D world measured in pixels:
 *   x right, y down, z toward the viewer. At z = 0 the default camera maps one
 *   world pixel to one output pixel, so layouts can be thought of in screen
 *   terms and tilted into depth only where wanted.
 * - Precomps render a layer list into a texture that other layers can use (the
 *   browser viewport, the phone screen…).
 * - Post: bloom, radial chromatic aberration, lens distortion, zoom burst,
 *   exposure flashes, then grain, vignette and the fade.
 * - Motion blur is real: each output frame averages several renders across a
 *   180° shutter.
 *
 * Nothing here reads the clock: a frame is a pure function of its time.
 */

const LAYER_VS = `#version 300 es
in vec4 a_pos;
in vec2 a_uv;
out vec2 v_uv;
void main() { v_uv = a_uv; gl_Position = a_pos; }`;

/**
 * The layer shader is assembled per feature set: a plain textured quad
 * compiles to a texture fetch and a multiply. A single "uber" shader branching
 * on uniforms cost ~150 ms per full-screen layer under the software
 * rasteriser, because every branch was evaluated for every pixel.
 */
function layerFS(f) {
  const defs = Object.entries(f).filter(([, v]) => v).map(([k, v]) => `#define ${k} ${v === true ? 1 : v}`).join("\n");
  return `#version 300 es
precision highp float;
${defs}
in vec2 v_uv;
out vec4 o;
uniform sampler2D u_tex;
uniform vec4 u_uvRect;
uniform float u_flipY;
uniform vec4 u_color;
uniform float u_opacity;
uniform vec2 u_size;
uniform float u_radius;
uniform float u_edge;
uniform vec3 u_tint;
uniform float u_tintAmt;
uniform float u_bright;
uniform float u_contrast;
uniform float u_sat;
uniform float u_invert;
uniform vec2 u_blur;
uniform float u_rgb;
uniform vec2 u_rgbDir;
uniform float u_glitch;
uniform float u_seed;
uniform vec4 u_shine;      // position, width, angle, amount
uniform vec3 u_shineColor;
uniform vec4 u_reveal;     // -, progress, softness, angle

float h1(float n) { return fract(sin(n * 127.1 + 311.7) * 43758.5453); }
float h2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h2(i), h2(i + vec2(1, 0)), u.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), u.x), u.y);
}

vec4 src(vec2 uv) {
#ifdef SOLID
  return vec4(u_color.rgb * u_color.a, u_color.a);
#else
#if defined(BLUR) || defined(RGB) || defined(GLITCH)
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return vec4(0.0);
#endif
  vec2 t = mix(u_uvRect.xy, u_uvRect.zw, uv);
  t.y = mix(t.y, 1.0 - t.y, u_flipY);
  return texture(u_tex, t);
#endif
}

vec4 fetch(vec2 uv) {
#ifdef BLUR
  vec2 d = u_blur / u_size;
  vec4 acc = vec4(0.0);
  for (int i = 0; i < BLUR; i++) {
    float k = (float(i) + 0.5) / float(BLUR) - 0.5;
    acc += src(uv + d * k);
  }
  return acc / float(BLUR);
#else
  return src(uv);
#endif
}

void main() {
  vec2 uv = v_uv;
#ifdef GLITCH
  float row = floor(uv.y * 28.0);
  float on = step(0.55, h1(row * 7.13 + u_seed * 3.1));
  uv.x += (h1(row + u_seed) - 0.5) * u_glitch * on;
  float row2 = floor(uv.y * 90.0);
  uv.x += (h1(row2 * 1.7 + u_seed * 5.3) - 0.5) * u_glitch * 0.25 * step(0.8, h1(row2 + u_seed));
#endif

#ifdef RGB
  vec2 dd = u_rgbDir * u_rgb / u_size;
  vec4 cr = fetch(uv + dd), cg = fetch(uv), cb = fetch(uv - dd);
  vec4 c = vec4(cr.r, cg.g, cb.b, max(max(cr.a, cg.a), cb.a));
#else
  vec4 c = fetch(uv);
#endif

#if defined(GRADE) || defined(SHINE)
  float a = c.a;
  vec3 col = a > 0.0 ? c.rgb / a : vec3(0.0);
  float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
#ifdef GRADE
  col = mix(col, 1.0 - col, u_invert);
  col = mix(vec3(l), col, u_sat);
  col = (col - 0.5) * u_contrast + 0.5;
  col *= u_bright;
  col = mix(col, u_tint * max(l, 0.0) * 1.2, u_tintAmt);
#endif
#ifdef SHINE
  // Specular sweep: a narrow bright band crossing the layer, only where it is opaque.
  vec2 sp = (uv - 0.5) * u_size / max(u_size.x, u_size.y);
  float sd = dot(sp, vec2(cos(u_shine.z), sin(u_shine.z)));
  float band = exp(-pow((sd - u_shine.x) / max(u_shine.y, 1e-4), 2.0));
  col += u_shineColor * band * u_shine.w * (0.35 + 0.65 * smoothstep(0.08, 0.7, l));
#endif
  c = vec4(max(col, 0.0) * a, a);
#endif

  float m = u_opacity;
#ifdef MASK
  // Rounded-rectangle mask, in pixels.
  vec2 q = abs((uv - 0.5) * u_size) - (u_size * 0.5 - vec2(u_radius));
  float rd = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - u_radius;
  m *= u_edge > 0.0 ? 1.0 - smoothstep(-u_edge, 0.0, rd) : 1.0 - smoothstep(-1.0, 0.5, rd);
#endif
#ifdef REVEAL
  // 1 linear wipe, 2 radial, 3 noise dissolve, 4 centre-out wipe.
  float rp = u_reveal.y, rs = max(u_reveal.z, 1e-4), k = 0.0;
#if REVEAL == 1
  vec2 dir = vec2(cos(u_reveal.w), sin(u_reveal.w));
  k = (dot(uv - 0.5, dir) / (abs(dir.x) + abs(dir.y))) + 0.5;
#elif REVEAL == 2
  k = length((uv - 0.5) * u_size / max(u_size.x, u_size.y)) / 0.7072;
#elif REVEAL == 3
  k = vnoise(uv * u_size / 40.0) * 0.75 + vnoise(uv * u_size / 9.0) * 0.25;
#else
  k = abs(dot(uv - 0.5, vec2(cos(u_reveal.w), sin(u_reveal.w)))) * 2.0;
#endif
  m *= 1.0 - smoothstep(rp * (1.0 + rs) - rs, rp * (1.0 + rs), k);
#endif
  o = c * m;
}`;
}

const FS_VS = `#version 300 es
in vec2 a_p;
out vec2 v_uv;
void main() { v_uv = a_p * 0.5 + 0.5; gl_Position = vec4(a_p, 0.0, 1.0); }`;

const BRIGHT_FS = `#version 300 es
precision highp float;
in vec2 v_uv; out vec4 o;
uniform sampler2D u_tex; uniform float u_th; uniform float u_knee;
void main() {
  vec2 px = 1.0 / vec2(textureSize(u_tex, 0));
  vec3 c = (texture(u_tex, v_uv + px * vec2(-1, -1)).rgb + texture(u_tex, v_uv + px * vec2(1, -1)).rgb +
            texture(u_tex, v_uv + px * vec2(-1, 1)).rgb + texture(u_tex, v_uv + px * vec2(1, 1)).rgb) * 0.25;
  float l = max(c.r, max(c.g, c.b));
  float w = smoothstep(u_th, u_th + u_knee, l);
  o = vec4(c * w, 1.0);
}`;

const BLUR_FS = `#version 300 es
precision highp float;
in vec2 v_uv; out vec4 o;
uniform sampler2D u_tex; uniform vec2 u_dir;
void main() {
  vec2 px = u_dir / vec2(textureSize(u_tex, 0));
  vec3 c = texture(u_tex, v_uv).rgb * 0.2270270270;
  c += (texture(u_tex, v_uv + px * 1.3846153846).rgb + texture(u_tex, v_uv - px * 1.3846153846).rgb) * 0.3162162162;
  c += (texture(u_tex, v_uv + px * 3.2307692308).rgb + texture(u_tex, v_uv - px * 3.2307692308).rgb) * 0.0702702703;
  o = vec4(c, 1.0);
}`;

function compositeFS(zoom, ca, glitch) {
  return `#version 300 es
precision highp float;
${zoom ? "#define ZOOM 1" : ""}
${ca ? "#define CA 1" : ""}
${glitch ? "#define GLITCH 1" : ""}
in vec2 v_uv; out vec4 o;
uniform sampler2D u_scene, u_b1, u_b2;
uniform float u_bloom, u_bloomWide, u_exposure, u_flash, u_ca, u_distort, u_zoom;
uniform vec2 u_zoomCenter;
uniform vec3 u_flashColor;
uniform float u_weight;
uniform float u_glitch, u_gseed;
float gh(float n) { return fract(sin(n * 91.3458 + u_gseed * 17.17) * 47453.5453); }
vec3 sceneAt(vec2 uv) {
  vec2 d = uv - 0.5;
  float r2 = dot(d * vec2(1.7778, 1.0), d * vec2(1.7778, 1.0));
  vec2 base = 0.5 + d * (1.0 + u_distort * r2);
#ifdef CA
  vec2 off = d * u_ca * (0.4 + r2);
  return vec3(texture(u_scene, base + off).r, texture(u_scene, base).g, texture(u_scene, base - off).b);
#else
  return texture(u_scene, base).rgb;
#endif
}
void main() {
  vec2 uv = v_uv;
#ifdef GLITCH
  // Whole-frame slice displacement: a few horizontal bands jump sideways.
  float band = floor(uv.y * 18.0);
  float on = step(0.6, gh(band));
  uv.x += (gh(band + 3.1) - 0.5) * 0.14 * u_glitch * on;
  float fine = floor(uv.y * 140.0);
  uv.x += (gh(fine + 9.7) - 0.5) * 0.025 * u_glitch * step(0.86, gh(fine));
#endif
#ifdef ZOOM
  vec3 c = vec3(0.0);
  for (int i = 0; i < 8; i++) {
    float k = 1.0 - u_zoom * float(i) / 8.0;
    c += sceneAt(u_zoomCenter + (uv - u_zoomCenter) * k);
  }
  c /= 8.0;
#else
  vec3 c = sceneAt(uv);
#endif
#ifdef GLITCH
  c.r = mix(c.r, sceneAt(uv + vec2(0.012 * u_glitch, 0.0)).r, on);
  c.b = mix(c.b, sceneAt(uv - vec2(0.012 * u_glitch, 0.0)).b, on);
#endif
  c += texture(u_b1, v_uv).rgb * u_bloom + texture(u_b2, v_uv).rgb * u_bloomWide;
  c *= u_exposure;
  c += u_flashColor * u_flash;
  o = vec4(c * u_weight, u_weight);
}`;
}

const COPY_FS = `#version 300 es
precision highp float;
in vec2 v_uv; out vec4 o;
uniform sampler2D u_tex; uniform float u_w;
void main() { o = texture(u_tex, v_uv) * u_w; }`;

const OUTPUT_FS = `#version 300 es
precision highp float;
in vec2 v_uv; out vec4 o;
uniform sampler2D u_tex;
uniform float u_grain, u_seed, u_vignette, u_fade, u_lift, u_sat;
uniform vec3 u_tintShadow, u_tintHigh;
uniform vec2 u_res;
float h2(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  vec3 c = texture(u_tex, v_uv).rgb;
  // Shoulder above 0.9: additive light rolls off instead of clipping flat;
  // everything below is left exactly as composed.
  vec3 x = max(c, 0.0);
  c = mix(x, 0.9 + 0.1 * tanh((x - 0.9) / 0.1), step(0.9, x));
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(vec3(l), c, u_sat);
  c += u_tintShadow * (1.0 - smoothstep(0.0, 0.45, l)) + u_tintHigh * smoothstep(0.55, 1.0, l);
  c = c * (1.0 - u_lift) + u_lift;
  vec2 d = (v_uv - 0.5) * vec2(u_res.x / u_res.y, 1.0);
  c *= 1.0 - u_vignette * smoothstep(0.35, 1.15, length(d));
  // Grain: luminance-weighted, coarser than a pixel so it reads as film, not noise.
  vec2 gp = floor(v_uv * u_res / 1.6);
  float g = (h2(gp + u_seed * 17.0) + h2(gp * 1.37 + u_seed * 3.0) - 1.0);
  c += g * u_grain * (0.35 + 0.65 * (1.0 - abs(l - 0.45) * 1.6));
  c *= 1.0 - u_fade;
  c += (h2(v_uv * u_res + u_seed) - 0.5) / 255.0;
  o = vec4(clamp(c, 0.0, 1.0), 1.0);
}`;

/* -------------------------------------------------------------------------- */
/* Matrices (column-major 4×4, plain arrays)                                  */
/* -------------------------------------------------------------------------- */

export const M4 = {
  identity: () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  mul(a, b) {
    const r = new Array(16);
    for (let c = 0; c < 4; c++)
      for (let rI = 0; rI < 4; rI++)
        r[c * 4 + rI] =
          a[0 * 4 + rI] * b[c * 4 + 0] + a[1 * 4 + rI] * b[c * 4 + 1] + a[2 * 4 + rI] * b[c * 4 + 2] + a[3 * 4 + rI] * b[c * 4 + 3];
    return r;
  },
  translate: (x, y, z) => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1],
  scale: (x, y, z = 1) => [x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1],
  rx(a) { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]; },
  ry(a) { const c = Math.cos(a), s = Math.sin(a); return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]; },
  rz(a) { const c = Math.cos(a), s = Math.sin(a); return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]; },
  apply(m, x, y, z) {
    return [
      m[0] * x + m[4] * y + m[8] * z + m[12],
      m[1] * x + m[5] * y + m[9] * z + m[13],
      m[2] * x + m[6] * y + m[10] * z + m[14],
    ];
  },
};

/**
 * A transform node: position, rotation (radians), scale, about its own origin.
 * Children are expressed in the node's local space, so a card can ride on the
 * browser window that carries it.
 */
export function node({ x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1, sx = 1, sy = 1, parent = null } = {}) {
  let m = M4.translate(x, y, z);
  m = M4.mul(m, M4.ry(ry));
  m = M4.mul(m, M4.rx(rx));
  m = M4.mul(m, M4.rz(rz));
  m = M4.mul(m, M4.scale(s * sx, s * sy, s));
  return parent ? M4.mul(parent, m) : m;
}

/* -------------------------------------------------------------------------- */
/* Engine                                                                     */
/* -------------------------------------------------------------------------- */

const BLEND = {
  normal: (gl) => gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA),
  add: (gl) => gl.blendFunc(gl.ONE, gl.ONE),
  screen: (gl) => gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_COLOR),
  multiply: (gl) => gl.blendFunc(gl.DST_COLOR, gl.ONE_MINUS_SRC_ALPHA),
};

export class Engine {
  /**
   * W×H is the output in pixels; the composition is always laid out in a
   * 1920×1080 design space (DW×DH), so a half-size preview frames the same.
   */
  constructor(canvas, W, H, DW = 1920, DH = 1080) {
    this.W = W;
    this.H = H;
    this.DW = DW;
    this.DH = DH;
    canvas.width = W;
    canvas.height = H;
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, premultipliedAlpha: false, preserveDrawingBuffer: true });
    if (!gl) throw new Error("WebGL2 unavailable");
    this.gl = gl;
    gl.getExtension("EXT_color_buffer_float");
    gl.getExtension("OES_texture_float_linear");
    this.aniso = gl.getExtension("EXT_texture_filter_anisotropic");
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.enable(gl.BLEND);

    this.layerPrograms = new Map();
    this.compositePrograms = new Map();
    this.progBright = this.program(FS_VS, BRIGHT_FS);
    this.progBlur = this.program(FS_VS, BLUR_FS);
    this.progOutput = this.program(FS_VS, OUTPUT_FS);
    this.progCopy = this.program(FS_VS, COPY_FS);

    // Dynamic quad buffer: 4 vertices × (x, y, z, w, u, v).
    this.quadBuf = gl.createBuffer();
    this.quadData = new Float32Array(24);
    this.vaoLayer = gl.createVertexArray();
    gl.bindVertexArray(this.vaoLayer);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, this.quadData.byteLength, gl.DYNAMIC_DRAW);
    // Attribute slots are fixed at link time (see program()), so one VAO
    // serves every layer-shader variant.
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 24, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 24, 16);

    // Full-screen triangle strip for post passes.
    this.fsBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.fsBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    this.vaoFs = gl.createVertexArray();
    gl.bindVertexArray(this.vaoFs);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    this.white = this.solidTexture([255, 255, 255, 255]);
    this.rts = new Map();
    this.canvases = new Map();
    this.images = new Map();

    this.rtScene = this.rt("scene", W, H, true);
    this.rtComp = this.rt("comp", W, H, true);
    this.rtAccum = this.rt("accum", W, H, true);
    this.rtB1a = this.rt("b1a", W >> 2, H >> 2, true);
    this.rtB1b = this.rt("b1b", W >> 2, H >> 2, true);
    this.rtB2a = this.rt("b2a", W >> 3, H >> 3, true);
    this.rtB2b = this.rt("b2b", W >> 3, H >> 3, true);
  }

  program(vs, fs) {
    const gl = this.gl;
    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) + "\n" + src);
      return s;
    };
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(p, 0, "a_pos");
    gl.bindAttribLocation(p, 1, "a_uv");
    gl.bindAttribLocation(p, 0, "a_p");
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const uni = {}, attr = {};
    const nu = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < nu; i++) {
      const info = gl.getActiveUniform(p, i);
      uni[info.name] = gl.getUniformLocation(p, info.name);
    }
    const na = gl.getProgramParameter(p, gl.ACTIVE_ATTRIBUTES);
    for (let i = 0; i < na; i++) {
      const info = gl.getActiveAttrib(p, i);
      attr[info.name] = gl.getAttribLocation(p, info.name);
    }
    return { p, uni, attr };
  }

  solidTexture(rgba) {
    const gl = this.gl;
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(rgba));
    return { tex: t, w: 1, h: 1 };
  }

  /** A render target (float when asked), cached by name. */
  rt(name, w, h, float = false) {
    const key = `${name}:${w}x${h}`;
    if (this.rts.has(key)) return this.rts.get(key);
    const gl = this.gl;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, float ? gl.RGBA16F : gl.RGBA8, w, h, 0, gl.RGBA, float ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    const r = { tex, fbo, w, h, flipY: true, float };
    this.rts.set(key, r);
    return r;
  }

  setFilter(tex, mip) {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    if (mip) {
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      if (this.aniso) gl.texParameterf(gl.TEXTURE_2D, this.aniso.TEXTURE_MAX_ANISOTROPY_EXT, 8);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  }

  /**
   * Loads an image once. Images taller than the GPU limit are split into
   * horizontal tiles (`tiles`); everything else is a single mipmapped texture.
   */
  async image(url, { maxSide = 8192 } = {}) {
    if (this.images.has(url)) return this.images.get(url);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`asset ${url}: ${res.status}`);
    const bmp = await createImageBitmap(await res.blob(), { premultiplyAlpha: "none", colorSpaceConversion: "none" });
    const gl = this.gl;
    const upload = (source) => {
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      this.setFilter(t, true);
      return t;
    };
    let entry;
    if (bmp.height <= maxSide && bmp.width <= maxSide) {
      entry = { tex: upload(bmp), w: bmp.width, h: bmp.height, flipY: false };
    } else {
      const tileH = maxSide - 192;
      const tiles = [];
      for (let y0 = 0; y0 < bmp.height; y0 += tileH) {
        const h = Math.min(tileH, bmp.height - y0);
        const c = new OffscreenCanvas(bmp.width, h);
        c.getContext("2d").drawImage(bmp, 0, y0, bmp.width, h, 0, 0, bmp.width, h);
        tiles.push({ tex: upload(c), y0, h, w: bmp.width, flipY: false });
      }
      entry = { tiles, w: bmp.width, h: bmp.height, flipY: false, tex: tiles[0].tex };
    }
    this.images.set(url, entry);
    return entry;
  }

  /**
   * A Canvas2D surface drawn only when `key` changes: static text costs one
   * draw and one upload for the whole render instead of one per frame.
   */
  cached(name, w, h, key, draw, mip = false) {
    const c = this.canvas(name, w, h);
    if (c.key !== key) {
      c.ctx.setTransform(1, 0, 0, 1, 0, 0);
      c.ctx.clearRect(0, 0, w, h);
      draw(c.ctx, w, h);
      this.upload(c, mip);
      c.key = key;
    }
    return c;
  }

  /** A Canvas2D surface whose pixels become a texture after `upload()`. */
  canvas(name, w, h) {
    let c = this.canvases.get(name);
    if (!c) {
      // A DOM canvas rather than an OffscreenCanvas: it shares the document's
      // loaded font faces, so Bodoni and Jost are guaranteed to be there.
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      const tex = this.gl.createTexture();
      c = { canvas, ctx, tex, w, h, flipY: false, mip: false, key: null };
      this.canvases.set(name, c);
    }
    return c;
  }

  upload(c, mip = false) {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, c.tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c.canvas);
    this.setFilter(c.tex, mip);
    return c;
  }

  /* ------------------------------------------------------------------------ */
  /* Drawing                                                                  */
  /* ------------------------------------------------------------------------ */

  bindTarget(target) {
    const gl = this.gl;
    if (target) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      gl.viewport(0, 0, target.w, target.h);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, this.W, this.H);
    }
  }

  clear(target, rgba = [0, 0, 0, 0]) {
    const gl = this.gl;
    this.bindTarget(target);
    gl.clearColor(...rgba);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  /**
   * Projects a world point through a camera to clip space.
   * Camera: { x, y } the point it looks at (at z = 0), dist, zoom, roll,
   * tilt (rx), pan (ry), W/H of the target; ortho for flat precomps.
   */
  project(cam, p) {
    let x = p[0] - cam.x, y = p[1] - cam.y, z = p[2];
    if (cam.roll) {
      const c = Math.cos(cam.roll), s = Math.sin(cam.roll);
      [x, y] = [c * x - s * y, s * x + c * y];
    }
    if (cam.ry) {
      const c = Math.cos(cam.ry), s = Math.sin(cam.ry);
      [x, z] = [c * x + s * z, -s * x + c * z];
    }
    if (cam.rx) {
      const c = Math.cos(cam.rx), s = Math.sin(cam.rx);
      [y, z] = [c * y - s * z, s * y + c * z];
    }
    const zoom = cam.zoom ?? 1;
    if (cam.ortho) return [(2 * x * zoom) / cam.W, (-2 * y * zoom) / cam.H, 0, 1];
    const D = cam.dist;
    const depth = D - z + (cam.z ?? 0);
    return [(2 * x * zoom) / cam.W, (-2 * y * zoom) / cam.H, 0, depth / D];
  }

  /** The shader variant a layer needs: only the effects it actually uses. */
  layerProgram(L) {
    const blurLen = L.blur ? Math.abs(L.blur[0]) + Math.abs(L.blur[1]) : 0;
    const rv = L.reveal && L.reveal.p < 1 ? { wipe: 1, radial: 2, noise: 3, center: 4 }[L.reveal.type] : 0;
    const f = {
      SOLID: !!L.color,
      BLUR: blurLen > 0.75 ? (blurLen > 60 ? 16 : 8) : 0,
      RGB: (L.rgb ?? 0) > 0.05,
      GLITCH: (L.glitch ?? 0) > 0.0005,
      GRADE: (L.bright ?? 1) !== 1 || (L.contrast ?? 1) !== 1 || (L.sat ?? 1) !== 1 || (L.tintAmt ?? 0) > 0 || (L.invert ?? 0) > 0,
      SHINE: !!(L.shine && L.shine.amt > 0.002),
      MASK: (L.radius ?? 0) > 0 || (L.edge ?? 0) > 0,
      REVEAL: rv,
    };
    const key = Object.values(f).map((v) => +v).join(",");
    let P = this.layerPrograms.get(key);
    if (!P) {
      P = this.program(LAYER_VS, layerFS(f));
      this.layerPrograms.set(key, P);
    }
    return P;
  }

  /** Draws one layer (see the scene code for the fields it understands). */
  drawLayer(L, cam) {
    const gl = this.gl;
    const src = L.tex ?? null;
    const w = L.w ?? src?.dw ?? src?.w ?? 1;
    const h = L.h ?? src?.dh ?? src?.h ?? 1;
    const ax = L.ax ?? 0.5, ay = L.ay ?? 0.5;
    const m = L.matrix ?? node({ x: L.x ?? 0, y: L.y ?? 0, z: L.z ?? 0, rx: L.rx ?? 0, ry: L.ry ?? 0, rz: L.rz ?? 0, s: L.s ?? 1, sx: L.sx ?? 1, sy: L.sy ?? 1, parent: L.parent ?? null });
    const corners = [[0, 0], [1, 0], [0, 1], [1, 1]];
    const d = this.quadData;
    const lcam = L.screen ? this.screenCam : cam;
    for (let i = 0; i < 4; i++) {
      const [u, v] = corners[i];
      const wp = M4.apply(m, (u - ax) * w, (v - ay) * h, 0);
      const c = this.project(lcam, wp);
      if (c[3] <= 0.01) return; // behind the camera
      d.set([c[0], c[1], c[2], c[3], u, v], i * 6);
    }
    const P = this.layerProgram(L);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, d);
    gl.useProgram(P.p);
    gl.bindVertexArray(this.vaoLayer);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, src ? src.tex : this.white.tex);
    const U = P.uni;
    const set = (name, fn, ...v) => { if (U[name]) gl[fn](U[name], ...v); };
    set("u_tex", "uniform1i", 0);
    set("u_uvRect", "uniform4fv", L.uv ?? [0, 0, 1, 1]);
    set("u_flipY", "uniform1f", src?.flipY ? 1 : 0);
    set("u_color", "uniform4fv", L.color ?? [1, 1, 1, 1]);
    set("u_opacity", "uniform1f", L.opacity ?? 1);
    set("u_size", "uniform2f", w, h);
    set("u_radius", "uniform1f", L.radius ?? 0);
    set("u_edge", "uniform1f", L.edge ?? 0);
    set("u_tint", "uniform3fv", L.tint ?? [1, 1, 1]);
    set("u_tintAmt", "uniform1f", L.tintAmt ?? 0);
    set("u_bright", "uniform1f", L.bright ?? 1);
    set("u_contrast", "uniform1f", L.contrast ?? 1);
    set("u_sat", "uniform1f", L.sat ?? 1);
    set("u_invert", "uniform1f", L.invert ?? 0);
    set("u_blur", "uniform2fv", L.blur ?? [0, 0]);
    set("u_rgb", "uniform1f", L.rgb ?? 0);
    set("u_rgbDir", "uniform2fv", L.rgbDir ?? [1, 0]);
    set("u_glitch", "uniform1f", L.glitch ?? 0);
    set("u_seed", "uniform1f", L.seed ?? 0);
    const sh = L.shine;
    set("u_shine", "uniform4f", sh?.pos ?? 0, sh?.width ?? 0.08, sh?.angle ?? 0.35, sh?.amt ?? 0);
    set("u_shineColor", "uniform3fv", sh?.color ?? [1, 1, 1]);
    const rv = L.reveal;
    set("u_reveal", "uniform4f", 0, rv?.p ?? 1, rv?.soft ?? 0.1, rv?.angle ?? 0);
    (BLEND[L.blend ?? "normal"] ?? BLEND.normal)(gl);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  /** Renders a layer list into a target with a camera. */
  drawList(target, layers, cam, clearColor = [0, 0, 0, 0]) {
    this.clear(target, clearColor);
    this.bindTarget(target);
    for (const L of layers) if (L && (L.opacity ?? 1) > 0.001) this.drawLayer(L, cam);
  }

  /**
   * Renders layers into a named precomp texture with a flat camera. `w×h` is
   * the precomp's design size; its pixel size follows the output scale.
   */
  precomp(name, w, h, layers, { clear = [0, 0, 0, 0], float = false, scale = this.W / this.DW } = {}) {
    const target = this.rt("pc:" + name, Math.max(1, Math.round(w * scale)), Math.max(1, Math.round(h * scale)), float);
    target.dw = w;
    target.dh = h;
    const cam = { x: w / 2, y: h / 2, W: w, H: h, ortho: true, zoom: 1 };
    this.drawList(target, layers, cam, clear);
    return target;
  }

  fsPass(prog, target, setup) {
    const gl = this.gl;
    this.bindTarget(target);
    gl.useProgram(prog.p);
    gl.bindVertexArray(this.vaoFs);
    setup(prog.uni, gl);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  bindTex(unit, tex, loc) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(loc, unit);
  }

  /** Draws a scene's layers into `target`. */
  drawScene(scene, target) {
    const cam = { x: this.DW / 2, y: this.DH / 2, dist: 2400, zoom: 1, W: this.DW, H: this.DH, ...scene.camera };
    this.screenCam = { x: this.DW / 2, y: this.DH / 2, dist: 2400, zoom: 1, W: this.DW, H: this.DH };
    this.drawList(target, scene.layers, cam, [0.0196, 0.0196, 0.0196, 1]);
  }

  /** Bloom, lens and exposure from `src` into rtComp. */
  postPass(src, post) {
    const gl = this.gl;
    gl.disable(gl.BLEND);
    // Bloom: bright pass at 1/4, blurred twice; a wider layer at 1/8.
    this.fsPass(this.progBright, this.rtB1a, (U) => {
      this.bindTex(0, src.tex, U.u_tex);
      gl.uniform1f(U.u_th, post.bloomThreshold ?? 0.62);
      gl.uniform1f(U.u_knee, 0.35);
    });
    const blur = (a, b, spread) => {
      this.fsPass(this.progBlur, b, (U) => { this.bindTex(0, a.tex, U.u_tex); gl.uniform2f(U.u_dir, spread, 0); });
      this.fsPass(this.progBlur, a, (U) => { this.bindTex(0, b.tex, U.u_tex); gl.uniform2f(U.u_dir, 0, spread); });
    };
    blur(this.rtB1a, this.rtB1b, 1.0);
    blur(this.rtB1a, this.rtB1b, 1.0);
    this.fsPass(this.progBlur, this.rtB2a, (U) => { this.bindTex(0, this.rtB1a.tex, U.u_tex); gl.uniform2f(U.u_dir, 1.5, 0); });
    this.fsPass(this.progBlur, this.rtB2b, (U) => { this.bindTex(0, this.rtB2a.tex, U.u_tex); gl.uniform2f(U.u_dir, 0, 1.5); });
    blur(this.rtB2b, this.rtB2a, 2.5);

    const zoom = (post.zoomBlur ?? 0) > 0.01, ca = (post.ca ?? 0) > 0.0002, glitch = (post.glitch ?? 0) > 0.02;
    const ck = `${+zoom}${+ca}${+glitch}`;
    if (!this.compositePrograms.has(ck)) this.compositePrograms.set(ck, this.program(FS_VS, compositeFS(zoom, ca, glitch)));
    this.fsPass(this.compositePrograms.get(ck), this.rtComp, (U) => {
      this.bindTex(0, src.tex, U.u_scene);
      this.bindTex(1, this.rtB1a.tex, U.u_b1);
      this.bindTex(2, this.rtB2b.tex, U.u_b2);
      gl.uniform1f(U.u_bloom, post.bloom ?? 0.55);
      gl.uniform1f(U.u_bloomWide, post.bloomWide ?? 0.35);
      gl.uniform1f(U.u_exposure, post.exposure ?? 1);
      gl.uniform1f(U.u_flash, post.flash ?? 0);
      gl.uniform3fv(U.u_flashColor, post.flashColor ?? [1, 1, 1]);
      if (U.u_ca) gl.uniform1f(U.u_ca, post.ca ?? 0);
      gl.uniform1f(U.u_distort, post.distort ?? 0);
      if (U.u_zoom) gl.uniform1f(U.u_zoom, post.zoomBlur ?? 0);
      if (U.u_zoomCenter) gl.uniform2fv(U.u_zoomCenter, post.zoomCenter ?? [0.5, 0.5]);
      if (U.u_glitch) gl.uniform1f(U.u_glitch, post.glitch ?? 0);
      if (U.u_gseed) gl.uniform1f(U.u_gseed, post.glitchSeed ?? 0);
      gl.uniform1f(U.u_weight, 1);
    });
    gl.enable(gl.BLEND);
  }

  /**
   * One output frame. `build(t)` returns { layers, camera, post } and is called
   * once per motion-blur subframe; the subframes are averaged in scene light,
   * then bloom, lens and grain run once on the result.
   */
  frame(build, t, { samples = 1, shutter = 0.5 / 60, final = {} } = {}) {
    const gl = this.gl;
    let src, mid;
    if (samples <= 1) {
      mid = build(t);
      this.drawScene(mid, this.rtScene);
      src = this.rtScene;
    } else {
      this.clear(this.rtAccum, [0, 0, 0, 0]);
      for (let i = 0; i < samples; i++) {
        const ts = t + shutter * ((i + 0.5) / samples - 0.5);
        const scene = build(ts);
        if (i === samples >> 1) mid = scene;
        this.drawScene(scene, this.rtScene);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
        this.fsPass(this.progCopy, this.rtAccum, (U) => {
          this.bindTex(0, this.rtScene.tex, U.u_tex);
          gl.uniform1f(U.u_w, 1 / samples);
        });
      }
      src = this.rtAccum;
    }
    this.postPass(src, mid.post ?? {});
    const scene = build.output ? build.output(t) : final;
    gl.disable(gl.BLEND);
    this.fsPass(this.progOutput, null, (U) => {
      this.bindTex(0, this.rtComp.tex, U.u_tex);
      gl.uniform1f(U.u_grain, scene.grain ?? 0.035);
      gl.uniform1f(U.u_seed, Math.round(t * 60) % 997);
      gl.uniform1f(U.u_vignette, scene.vignette ?? 0.45);
      gl.uniform1f(U.u_fade, scene.fade ?? 0);
      gl.uniform1f(U.u_lift, scene.lift ?? 0.0);
      gl.uniform1f(U.u_sat, scene.sat ?? 1);
      gl.uniform3fv(U.u_tintShadow, scene.tintShadow ?? [0, 0, 0]);
      gl.uniform3fv(U.u_tintHigh, scene.tintHigh ?? [0, 0, 0]);
      gl.uniform2f(U.u_res, this.W, this.H);
    });
    gl.enable(gl.BLEND);
  }

  readPixels() {
    const gl = this.gl;
    const px = new Uint8Array(this.W * this.H * 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.readPixels(0, 0, this.W, this.H, gl.RGBA, gl.UNSIGNED_BYTE, px);
    return px;
  }
}

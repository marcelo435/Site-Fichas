import { useEffect, useRef } from 'react';
import type * as T from 'three';
import type { PaletaSakura } from '../lib/sakura';

/**
 * Cores da árvore. Outras ideias:
 *   flores brancas: flores: ['#e9e9e9', '#d6d6d6', '#f5f5f5'], estames: '#3a3a3a', tronco: '#5a5a5e'
 *   sakura rosa:    flores: ['#f7c6d4', '#f09ab4', '#fbe0e8'], estames: '#b0475f', tronco: '#6a5a5e'
 */
const PALETA: PaletaSakura = {
  tronco: '#c4c5c9',
  flores: ['#1d1d20', '#26262a', '#303034', '#18181a'],
  estames: '#9a9a9e',
};
/** Pétalas soltas: sorteadas entre esses tons. */
const CORES_PETALA_SOLTA = ['#2c2c30', '#36363b', '#424247', '#24242a'];
/** Cor da névoa no horizonte (também a cor do céu lá embaixo). */
const COR_HORIZONTE = '#1c1c1f';
/** Cor das camadas de névoa que passeiam perto do chão. */
const COR_NEVOA = '#9a9aa2';

const VERTICE_MUNDO = /* glsl */ `
  varying vec3 vMundo;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 m = modelMatrix * vec4(position, 1.0);
    vMundo = m.xyz;
    gl_Position = projectionMatrix * viewMatrix * m;
  }`;

/** Ruído fractal (fbm) com deformação, usado pelas duas névoas. */
const RUIDO = /* glsl */ `
  uniform vec3 uCor;
  uniform float uTempo, uOpacidade, uSemente, uVel;
  varying vec3 vMundo;
  varying vec2 vUv;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float ruido(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * ruido(p); p = p * 2.03 + vec2(17.1, 9.2); a *= 0.5; }
    return v;
  }
  float densidade(vec2 p) {
    vec2 desvio = vec2(fbm(p * 0.7 + uTempo * 0.015), fbm(p * 0.7 + 5.2 - uTempo * 0.01));
    return smoothstep(0.3, 0.8, fbm(p + desvio * 1.6));
  }`;

/** Cortinas de névoa em pé, ao fundo: densas embaixo, somem para cima e nas laterais. */
const FRAGMENTO_CORTINA = RUIDO + /* glsl */ `
  uniform float uAltura, uBase;
  void main() {
    float d = densidade(vec2(vMundo.x * 0.05 + uTempo * uVel, vMundo.y * 0.13) + uSemente);
    float vertical = exp(-max(vMundo.y, 0.0) / uAltura) * smoothstep(0.0, uBase, vMundo.y);
    float bordas = smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x) * smoothstep(1.0, 0.5, vUv.y);
    gl_FragColor = vec4(uCor, d * vertical * bordas * uOpacidade);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;


/** Altura da árvore em unidades da cena. Maior que a tela: a copa "vem do topo". */
const ALTURA_ARVORE = 15;

/**
 * Fundo 3D: céu escuro com névoa e uma grande cerejeira cinza de flores negras
 * que desce do topo da tela, com pétalas caindo.
 * O Three.js é carregado só depois da página, para não atrasar o site.
 */
export function FundoArvore() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let parar = () => {};
    let cancelado = false;

    (async () => {
      const THREE = await import('three');
      const { mergeGeometries } = await import('three/addons/utils/BufferGeometryUtils.js');
      const { criarSakura } = await import('../lib/sakura');
      if (cancelado || !ref.current) return;
      const alvo = ref.current;
      const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // ---------- aleatório com semente (a árvore é sempre a mesma) ----------
      let semente = 20240;
      const rand = () => {
        semente = (semente + 0x6d2b79f5) | 0;
        let t = Math.imul(semente ^ (semente >>> 15), 1 | semente);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
      const entre = (a: number, b: number) => a + rand() * (b - a);

      // ---------- renderizador / cena ----------
      const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;
      // Sombras: calculadas uma vez (a árvore não se move), então custam quase nada.
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      renderer.shadowMap.autoUpdate = false;
      alvo.appendChild(renderer.domElement);

      const cena = new THREE.Scene();
      cena.fog = new THREE.Fog(COR_HORIZONTE, 10, 46);

      // Céu: cúpula com degradê pela altura do olhar. No horizonte tem exatamente a cor
      // da névoa, então o chão some no céu sem aquela "linha" separando os dois.
      const ceu = new THREE.Mesh(
        new THREE.SphereGeometry(150, 32, 16),
        new THREE.ShaderMaterial({
          side: THREE.BackSide,
          depthWrite: false,
          uniforms: {
            uTopo: { value: new THREE.Color('#020202') },
            // em sRGB, igual ao three faz com a cor da névoa (fog_fragment)
            uHorizonte: { value: new THREE.Color(COR_HORIZONTE).getRGB(new THREE.Color(), THREE.SRGBColorSpace) },
          },
          vertexShader: VERTICE_MUNDO,
          fragmentShader: /* glsl */ `
            uniform vec3 uTopo, uHorizonte;
            varying vec3 vMundo;
            void main() {
              float h = normalize(vMundo - cameraPosition).y;
              // Mesma ordem do three: tom/espaço de cor primeiro, "névoa" (horizonte) por último.
              // Assim o horizonte sai exatamente da cor do chão coberto de névoa.
              gl_FragColor = vec4(uTopo, 1.0);
              #include <tonemapping_fragment>
              #include <colorspace_fragment>
              gl_FragColor.rgb = mix(uHorizonte, gl_FragColor.rgb, smoothstep(-0.02, 0.55, h));
            }`,
        }),
      );
      ceu.renderOrder = -10;
      cena.add(ceu);

      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
      const alvoCamera = new THREE.Vector3(0, 6, 0);
      const ALTURA_CAMERA = 2.4;

      // ---------- luzes ----------
      cena.add(new THREE.HemisphereLight('#c4c4c8', '#2a2a2d', 1.1));
      const lua = new THREE.DirectionalLight('#f1f1f4', 2.4);
      lua.castShadow = true;
      lua.shadow.mapSize.set(2048, 2048);
      lua.shadow.bias = -0.0004;
      lua.shadow.normalBias = 0.04;
      lua.shadow.radius = 3;
      // Sombra da copa mais suave, para o tronco não ficar preto e "descolado" da base.
      lua.shadow.intensity = 0.6;
      cena.add(lua, lua.target);
      const contraLuz = new THREE.DirectionalLight('#7c7c84', 1.3);
      contraLuz.position.set(8, 9, -12);
      cena.add(contraLuz);

      // Brilho da lua no céu (não sofre névoa).
      const brilho = document.createElement('canvas');
      brilho.width = brilho.height = 128;
      const gb = brilho.getContext('2d')!;
      const rg = gb.createRadialGradient(64, 64, 0, 64, 64, 64);
      rg.addColorStop(0, 'rgba(255,255,255,1)');
      rg.addColorStop(0.25, 'rgba(255,255,255,0.35)');
      rg.addColorStop(1, 'rgba(255,255,255,0)');
      gb.fillStyle = rg;
      gb.fillRect(0, 0, 128, 128);
      const texBrilho = new THREE.CanvasTexture(brilho);
      const spriteLua = new THREE.Sprite(new THREE.SpriteMaterial({
        map: texBrilho, color: '#e6e6ea', transparent: true, opacity: 0.5, fog: false, depthWrite: false,
      }));
      spriteLua.scale.set(14, 14, 1);
      spriteLua.position.set(-24, 16, -60);
      cena.add(spriteLua);

      // ---------- chão ----------
      const chao = new THREE.Mesh(
        new THREE.PlaneGeometry(400, 400),
        new THREE.MeshStandardMaterial({ color: '#161618', roughness: 1 }),
      );
      chao.rotation.x = -Math.PI / 2;
      chao.receiveShadow = true;
      cena.add(chao);

      // ---------- árvore ----------
      const sakura = criarSakura(THREE, mergeGeometries, rand, PALETA);
      const arvore = sakura.grupo;
      sakura.madeira.castShadow = true;
      sakura.madeira.receiveShadow = true;
      for (const m of sakura.flores) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
      cena.add(arvore);
      // Um pouco para trás, para a perspectiva não distorcer a copa.
      const PROFUNDIDADE = -5;
      arvore.position.z = PROFUNDIDADE;

      const caixaBruta = new THREE.Box3().setFromObject(arvore);
      const escala = ALTURA_ARVORE / caixaBruta.max.y;
      arvore.scale.setScalar(escala);
      const caixaCopa = sakura.caixaCopa.clone();
      caixaCopa.min.multiplyScalar(escala);
      caixaCopa.max.multiplyScalar(escala);

      const matPetala = new THREE.MeshStandardMaterial({
        color: '#ffffff', roughness: 0.55, metalness: 0.05, side: THREE.DoubleSide,
      });
      const tmp = new THREE.Object3D();
      const corTmp = new THREE.Color();
      const corPetala = () => corTmp.set(CORES_PETALA_SOLTA[Math.floor(rand() * CORES_PETALA_SOLTA.length)])
        .multiplyScalar(entre(0.85, 1.15));

      // Pétalas caídas no chão, debaixo da copa.
      const noChao = new THREE.InstancedMesh(sakura.geoPetala, matPetala, 900);
      for (let i = 0; i < noChao.count; i++) {
        tmp.position.set(
          entre(caixaCopa.min.x - 1, caixaCopa.max.x + 1),
          0.03,
          entre(caixaCopa.min.z - 1.5, caixaCopa.max.z + 3),
        );
        tmp.rotation.set(-Math.PI / 2 + entre(-0.2, 0.2), entre(-0.2, 0.2), entre(0, Math.PI * 2));
        tmp.scale.setScalar(entre(1.2, 1.8));
        tmp.updateMatrix();
        noChao.setMatrixAt(i, tmp.matrix);
        noChao.setColorAt(i, corPetala());
      }
      noChao.position.z = PROFUNDIDADE;
      noChao.receiveShadow = true;
      cena.add(noChao);

      // Pétalas caindo.
      const QTD_CAINDO = 180;
      const caindo = new THREE.InstancedMesh(sakura.geoPetala, matPetala, QTD_CAINDO);
      const estado = Array.from({ length: QTD_CAINDO }, () => ({
        pos: new THREE.Vector3(),
        rot: new THREE.Euler(),
        giro: new THREE.Vector3(entre(-1.6, 1.6), entre(-1.6, 1.6), entre(-1.6, 1.6)),
        vel: entre(0.35, 0.8),
        fase: entre(0, Math.PI * 2),
        escala: entre(1.1, 1.6),
      }));
      for (let i = 0; i < QTD_CAINDO; i++) caindo.setColorAt(i, corPetala());
      const renascer = (e: (typeof estado)[number], qualquerAltura: boolean) => {
        e.pos.set(
          entre(caixaCopa.min.x, caixaCopa.max.x),
          qualquerAltura ? entre(0, caixaCopa.max.y) : entre(caixaCopa.min.y, caixaCopa.max.y),
          entre(caixaCopa.min.z, caixaCopa.max.z + 2),
        );
        e.rot.set(entre(0, 6.28), entre(0, 6.28), entre(0, 6.28));
      };
      estado.forEach(e => renascer(e, true));
      caindo.position.z = PROFUNDIDADE;
      cena.add(caindo);

      // ---------- névoa: camadas de ruído animado em várias profundidades ----------
      // Nenhuma camada cruza o tronco (z entre -9 e -1), senão apareceria um corte nele.
      const materialNevoa = (fragmento: string, opacidade: number, vel: number, extra: Record<string, T.IUniform>) =>
        new THREE.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          uniforms: {
            uCor: { value: new THREE.Color(COR_NEVOA) },
            uTempo: { value: 0 },
            uOpacidade: { value: opacidade },
            uSemente: { value: entre(0, 100) },
            uVel: { value: vel },
            ...extra,
          },
          vertexShader: VERTICE_MUNDO,
          fragmentShader: fragmento,
        });
      const nevoas: T.ShaderMaterial[] = [];

      // Cortinas em pé, ao fundo e na frente.
      const cortinas = [
        { z: -46, opacidade: 0.6, altura: 5.0, vel: 0.012 },
        { z: -34, opacidade: 0.5, altura: 4.0, vel: -0.018 },
        { z: -24, opacidade: 0.45, altura: 3.2, vel: 0.022 },
        { z: -14, opacidade: 0.4, altura: 2.4, vel: -0.028 },
        { z: 1.5, opacidade: 0.3, altura: 1.6, vel: 0.035 },
        { z: 7, opacidade: 0.2, altura: 1.1, vel: -0.045 },
      ];
      for (const c of cortinas) {
        const distancia = 15 - c.z;
        const alturaPlano = Math.min(18, distancia * 0.45 + 4);
        const material = materialNevoa(FRAGMENTO_CORTINA, c.opacidade, c.vel, { uAltura: { value: c.altura }, uBase: { value: 0.4 + distancia * 0.045 } });
        const plano = new THREE.Mesh(new THREE.PlaneGeometry(distancia * 2 + 20, alturaPlano), material);
        plano.position.set(0, alturaPlano / 2 - 0.5, c.z);
        cena.add(plano);
        nevoas.push(material);
      }


      // ---------- posição / redimensionar ----------
      const ajustar = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        // Tronco à direita; a copa se abre para a esquerda e sai pelo topo da tela.
        const meiaLargura = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * (15 - PROFUNDIDADE) * camera.aspect;
        const x = meiaLargura * (camera.aspect > 1 ? 0.62 : 0.4);
        arvore.position.x = x;
        noChao.position.x = x;
        caindo.position.x = x;

        // A luz da lua acompanha a árvore e cobre a copa inteira com sombra.
        const caixa = new THREE.Box3().setFromObject(arvore);
        const centro = caixa.getCenter(new THREE.Vector3());
        const raio = caixa.getSize(new THREE.Vector3()).length() / 2;
        lua.target.position.copy(centro);
        lua.position.copy(centro).add(new THREE.Vector3(-14, 13, 24));
        const sc = lua.shadow.camera;
        sc.left = sc.bottom = -raio;
        sc.right = sc.top = raio;
        sc.near = 1;
        sc.far = 80;
        sc.updateProjectionMatrix();
        lua.target.updateMatrixWorld();
        renderer.shadowMap.needsUpdate = true;

        if (semMovimento) desenhar(0);
      };

      // Leve paralaxe com o mouse.
      const mouse = { x: 0, y: 0 };
      const aoMover = (e: PointerEvent) => {
        mouse.x = e.clientX / window.innerWidth - 0.5;
        mouse.y = e.clientY / window.innerHeight - 0.5;
      };

      const relogio = new THREE.Timer();
      const desenhar = (dt: number) => {
        const t = relogio.getElapsed();
        camera.position.x += (mouse.x * 1.2 - camera.position.x) * 0.03;
        camera.position.y += (ALTURA_CAMERA - mouse.y * 0.5 - camera.position.y) * 0.03;
        camera.position.z = 15;
        camera.lookAt(alvoCamera);

        for (let i = 0; i < QTD_CAINDO; i++) {
          const e = estado[i];
          e.pos.y -= e.vel * dt;
          e.pos.x += Math.sin(t * 0.8 + e.fase) * 0.4 * dt - 0.2 * dt;
          e.pos.z += Math.cos(t * 0.6 + e.fase) * 0.25 * dt;
          e.rot.x += e.giro.x * dt;
          e.rot.y += e.giro.y * dt;
          e.rot.z += e.giro.z * dt;
          if (e.pos.y < 0.05) renascer(e, false);
          tmp.position.copy(e.pos);
          tmp.rotation.copy(e.rot);
          tmp.scale.setScalar(e.escala);
          tmp.updateMatrix();
          caindo.setMatrixAt(i, tmp.matrix);
        }
        caindo.instanceMatrix.needsUpdate = true;

        for (const m of nevoas) m.uniforms.uTempo.value = t;

        renderer.render(cena, camera);
      };

      let quadro = 0;
      const loop = (agora?: number) => {
        quadro = requestAnimationFrame(loop);
        relogio.update(agora);
        const dt = Math.min(relogio.getDelta(), 0.05);
        if (!document.hidden) desenhar(dt);
      };

      camera.position.set(0, ALTURA_CAMERA, 15);
      ajustar();
      window.addEventListener('resize', ajustar);
      window.addEventListener('pointermove', aoMover);
      if (semMovimento) desenhar(0);
      else loop();
      alvo.classList.add('pronto');

      parar = () => {
        cancelAnimationFrame(quadro);
        window.removeEventListener('resize', ajustar);
        window.removeEventListener('pointermove', aoMover);
        cena.traverse(o => {
          const m = o as T.Mesh;
          m.geometry?.dispose();
          const mat = m.material;
          if (Array.isArray(mat)) mat.forEach(x => x.dispose());
          else mat?.dispose();
        });
        [texBrilho, ...sakura.texturas].forEach(t => t.dispose());
        renderer.dispose();
        renderer.domElement.remove();
      };
    })().catch(e => console.warn('Fundo 3D indisponível:', e));

    return () => {
      cancelado = true;
      parar();
    };
  }, []);

  return <div ref={ref} className="fundo-3d" aria-hidden="true" />;
}

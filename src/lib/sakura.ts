import type * as T from 'three';

type Three = typeof import('three');
type Juntar = (geos: T.BufferGeometry[]) => T.BufferGeometry;

export interface PaletaSakura {
  /** cor base da madeira (multiplica a textura da casca) */
  tronco: string;
  /** cores sorteadas para as pétalas das flores */
  flores: string[];
  /** cor dos estames (o "miolo" de cada flor) */
  estames: string;
}

/** Pétala de sakura: oval alongado, com um entalhe pequeno na ponta (nada de coração). */
function formaPetala(THREE: Three) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(0.028, 0.012, 0.046, 0.075, 0.036, 0.132);
  s.quadraticCurveTo(0.027, 0.16, 0.009, 0.161);
  s.lineTo(0, 0.151);
  s.lineTo(-0.009, 0.161);
  s.quadraticCurveTo(-0.027, 0.16, -0.036, 0.132);
  s.bezierCurveTo(-0.046, 0.075, -0.028, 0.012, 0, 0);
  return s;
}

/** Geometria da pétala solta: côncava na largura e curvada no comprimento, como pétala de verdade. */
export function geometriaPetala(THREE: Three) {
  const g = new THREE.ShapeGeometry(formaPetala(THREE), 8);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    p.setZ(i, 9 * x * x + 1.6 * y * y);
  }
  g.center();
  g.computeVertexNormals();
  return g;
}

/* ------------------------------------------------------------------ */
/* Texturas desenhadas em canvas                                       */
/* ------------------------------------------------------------------ */

/** Desenha uma flor de 5 pétalas (vista de frente, levemente inclinada). */
function desenharFlor(g: CanvasRenderingContext2D, x: number, y: number, s: number, giro: number,
  inclinacao: number, cor: string, estames: string, aberta: number) {
  g.save();
  g.translate(x, y);
  g.rotate(giro);
  g.scale(1, inclinacao);
  for (let k = 0; k < 5; k++) {
    g.save();
    g.rotate((k / 5) * Math.PI * 2);
    g.scale(aberta, 1);
    g.beginPath();
    g.moveTo(0, 0);
    g.bezierCurveTo(s * 0.48, -s * 0.15, s * 0.58, -s * 0.78, s * 0.22, -s * 0.98);
    g.lineTo(0, -s * 0.84);
    g.lineTo(-s * 0.22, -s * 0.98);
    g.bezierCurveTo(-s * 0.58, -s * 0.78, -s * 0.48, -s * 0.15, 0, 0);
    const grad = g.createLinearGradient(0, 0, 0, -s);
    grad.addColorStop(0, '#000000');
    grad.addColorStop(0.35, cor);
    grad.addColorStop(1, cor);
    g.fillStyle = grad;
    g.fill();
    // borda clara bem sutil separa uma pétala da outra
    g.strokeStyle = 'rgba(255,255,255,0.13)';
    g.lineWidth = Math.max(0.6, s * 0.05);
    g.stroke();
    // nervura central
    g.strokeStyle = 'rgba(255,255,255,0.05)';
    g.beginPath();
    g.moveTo(0, -s * 0.15);
    g.lineTo(0, -s * 0.75);
    g.stroke();
    g.restore();
  }
  // estames
  g.strokeStyle = estames;
  g.fillStyle = estames;
  g.lineWidth = Math.max(0.5, s * 0.03);
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2 + 0.3;
    const r = s * (0.28 + (k % 3) * 0.05);
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    g.stroke();
    g.beginPath();
    g.arc(Math.cos(a) * r, Math.sin(a) * r, Math.max(0.7, s * 0.05), 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
}

/** Textura de um "cacho": raminhos com dezenas de florzinhas e botões, fundo transparente. */
function texturaCacho(THREE: Three, rand: () => number, paleta: PaletaSakura) {
  const tam = 512;
  const cv = document.createElement('canvas');
  cv.width = cv.height = tam;
  const g = cv.getContext('2d')!;
  const entre = (a: number, b: number) => a + rand() * (b - a);
  const meio = tam / 2;

  // raminhos finos
  g.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    const a = entre(0, Math.PI * 2);
    g.strokeStyle = '#2b2b2e';
    g.lineWidth = entre(2, 4);
    g.beginPath();
    g.moveTo(meio + entre(-20, 20), meio + entre(-20, 20));
    g.quadraticCurveTo(
      meio + Math.cos(a + 0.4) * 110, meio + Math.sin(a + 0.4) * 110,
      meio + Math.cos(a) * 210, meio + Math.sin(a) * 210,
    );
    g.stroke();
  }

  // flores (das de trás para as da frente)
  const flores = Array.from({ length: 85 }, () => {
    const a = entre(0, Math.PI * 2);
    const d = Math.sqrt(rand()) * tam * 0.4;
    return { x: meio + Math.cos(a) * d, y: meio + Math.sin(a) * d * 0.9, s: tam * entre(0.03, 0.058) };
  }).sort((p, q) => p.s - q.s);
  for (const f of flores) {
    const cor = paleta.flores[Math.floor(rand() * paleta.flores.length)];
    desenharFlor(g, f.x, f.y, f.s, entre(0, Math.PI * 2), entre(0.55, 1), cor, paleta.estames, entre(0.85, 1.05));
  }
  // botões fechados
  for (let i = 0; i < 18; i++) {
    const a = entre(0, Math.PI * 2);
    const d = entre(0.25, 0.45) * tam;
    g.fillStyle = paleta.flores[0];
    g.strokeStyle = 'rgba(255,255,255,0.15)';
    g.lineWidth = 1;
    g.beginPath();
    g.ellipse(meio + Math.cos(a) * d, meio + Math.sin(a) * d, entre(4, 7), entre(6, 10), a, 0, Math.PI * 2);
    g.fill();
    g.stroke();
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Casca de cerejeira: fissuras verticais + as listras horizontais (lenticelas) típicas. */
function texturasCasca(THREE: Three, rand: () => number) {
  const w = 256;
  const h = 512;
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const g = cv.getContext('2d')!;
  const entre = (a: number, b: number) => a + rand() * (b - a);

  // Tudo é desenhado "dando a volta" nas bordas, para a textura repetir sem emenda.
  const emVolta = (desenho: (dx: number, dy: number) => void) => {
    for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) desenho(dx, dy);
  };

  g.fillStyle = '#a2a2a2';
  g.fillRect(0, 0, w, h);
  // manchas largas e suaves
  for (let i = 0; i < 40; i++) {
    const x = entre(0, w);
    const y = entre(0, h);
    const r = entre(20, 60);
    const tom = Math.floor(entre(120, 180));
    emVolta((dx, dy) => {
      const rg = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
      rg.addColorStop(0, `rgba(${tom},${tom},${tom},0.35)`);
      rg.addColorStop(1, `rgba(${tom},${tom},${tom},0)`);
      g.fillStyle = rg;
      g.fillRect(x + dx - r, y + dy - r, r * 2, r * 2);
    });
  }
  // grão fino, esticado na vertical
  for (let i = 0; i < 4000; i++) {
    const tom = Math.floor(entre(115, 185));
    g.fillStyle = `rgba(${tom},${tom},${tom},0.3)`;
    g.fillRect(entre(0, w), entre(0, h), entre(1, 2), entre(2, 7));
  }
  // fissuras verticais: ondulação periódica, então o topo encaixa na base
  for (let i = 0; i < 12; i++) {
    const x0 = entre(0, w);
    const ondas = [1, 2, 3].map(k => ({ k, amp: entre(2, 7) / k, fase: entre(0, 6.28) }));
    const largura = entre(0.8, 2.4);
    const alfa = entre(0.15, 0.35);
    emVolta(dx => {
      g.strokeStyle = `rgba(40,40,40,${alfa})`;
      g.lineWidth = largura;
      g.beginPath();
      for (let y = 0; y <= h; y += 8) {
        const x = x0 + dx + ondas.reduce((s, o) => s + o.amp * Math.sin((y / h) * Math.PI * 2 * o.k + o.fase), 0);
        if (y === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.stroke();
    });
  }
  // lenticelas horizontais (marca registrada da cerejeira): finas e espaçadas
  for (let i = 0; i < 110; i++) {
    const x = entre(0, w);
    const y = entre(0, h);
    const larg = entre(8, 30);
    const alt = entre(1, 2);
    const alfa = entre(0.3, 0.6);
    emVolta((dx, dy) => {
      g.fillStyle = `rgba(55,55,55,${alfa})`;
      g.fillRect(x + dx, y + dy, larg, alt);
      g.fillStyle = 'rgba(205,205,205,0.25)';
      g.fillRect(x + dx, y + dy + alt + 0.5, larg, 1);
    });
  }

  const cor = new THREE.CanvasTexture(cv);
  cor.colorSpace = THREE.SRGBColorSpace;
  const relevo = new THREE.CanvasTexture(cv);
  for (const t of [cor, relevo]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(2, 1);
    t.anisotropy = 4;
  }
  return { cor, relevo };
}

/* ------------------------------------------------------------------ */
/* A árvore                                                            */
/* ------------------------------------------------------------------ */

/**
 * Cerejeira (sakura) procedural: tronco grosso, retorcido e alargado na base,
 * galhos longos quase horizontais, raminhos finos e cachos de flores.
 * A copa se abre para a ESQUERDA a partir do tronco.
 */
export function criarSakura(THREE: Three, juntar: Juntar, rand: () => number, paleta: PaletaSakura) {
  const V = THREE.Vector3;
  const lerp = THREE.MathUtils.lerp;
  const entre = (a: number, b: number) => a + rand() * (b - a);
  const cima = new V(0, 1, 0);

  const madeiras: T.BufferGeometry[] = [];
  const cachos: { c: T.Vector3; r: number }[] = [];

  const ultimo = { quadros: null as { normals: T.Vector3[]; binormals: T.Vector3[] } | null };

  /**
   * Tubo que afina ao longo de uma curva, com nós na casca.
   * `alargarBase` abre a base; com `lobos` > 0 ela se abre em "contrafortes"
   * (as raízes nascem do próprio tronco, sem emenda).
   */
  const tubo = (pts: T.Vector3[], r0: number, r1: number, radiais: number, segs: number,
    nodoso = 0.07, alargarBase = 0, lobos = 0) => {
    const curva = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    const quadros = curva.computeFrenetFrames(segs, false);
    ultimo.quadros = quadros;
    const comprimento = curva.getLength();
    const pos: number[] = [];
    const uv: number[] = [];
    const idx: number[] = [];
    const fase = rand() * 100;
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const c = curva.getPointAt(t);
      const N = quadros.normals[i];
      const B = quadros.binormals[i];
      const raioBase = lerp(r0, r1, Math.pow(t, 0.75));
      const abertura = alargarBase * Math.exp(-t * (lobos ? 6.5 : 9));
      for (let j = 0; j <= radiais; j++) {
        const a = (j / radiais) * Math.PI * 2;
        const s = Math.sin(a);
        const co = -Math.cos(a);
        const lobo = lobos ? 0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.cos(lobos * a), 2.2) : 1;
        const r = raioBase * (1 + abertura * lobo) * (1
          + nodoso * Math.sin(t * 19 + fase) * Math.sin(a * 3 + t * 7 + fase)
          + nodoso * 0.6 * Math.sin(a * 7 + fase)
          + nodoso * 0.5 * Math.sin(a * 2 + t * 31 + fase));
        pos.push(c.x + r * (co * N.x + s * B.x), c.y + r * (co * N.y + s * B.y), c.z + r * (co * N.z + s * B.z));
        // u em volta (proporcional ao raio), v ao longo do comprimento
        uv.push((j / radiais) * Math.max(0.5, r0 * 3), t * comprimento * 0.6);
      }
    }
    for (let i = 0; i < segs; i++) {
      for (let j = 0; j < radiais; j++) {
        const a = i * (radiais + 1) + j;
        const b = (i + 1) * (radiais + 1) + j;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    // tampa a ponta (senão dá para ver o galho "oco")
    const ponta = curva.getPointAt(1).addScaledVector(curva.getTangentAt(1), r1 * 0.6);
    const iPonta = pos.length / 3;
    pos.push(ponta.x, ponta.y, ponta.z);
    uv.push(0.5, comprimento * 0.6 + 0.1);
    const ultimoAnel = segs * (radiais + 1);
    for (let j = 0; j < radiais; j++) idx.push(ultimoAnel + j, iPonta, ultimoAnel + j + 1);

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    madeiras.push(g);
    return curva;
  };

  const NIVEL_MAX = 5;

  const crescer = (inicio: T.Vector3, dir: T.Vector3, comp: number, r0: number, nivel: number) => {
    const pts = [inicio.clone()];
    let p = inicio.clone();
    let d = dir.clone();
    const n = nivel >= 4 ? 3 : 4;
    for (let i = 1; i <= n; i++) {
      d = d.clone().add(new V(entre(-0.3, 0.3), entre(-0.14, 0.16), entre(-0.3, 0.3))).normalize();
      d.y = d.y * 0.8 - (i === n && nivel >= 2 ? 0.1 : 0); // galhos abertos, pontas caindo
      d.normalize();
      p = p.clone().addScaledVector(d, comp / n);
      pts.push(p);
    }
    const r1 = nivel >= NIVEL_MAX ? Math.max(r0 * 0.35, 0.012) : r0 * 0.52;
    const radiais = nivel <= 1 ? 12 : nivel === 2 ? 8 : nivel === 3 ? 6 : 4;
    const segs = nivel <= 1 ? 20 : nivel <= 3 ? 10 : 6;
    const curva = tubo(pts, r0, r1, radiais, segs, nivel <= 1 ? 0.08 : 0.04);

    // Cachos de flores nos galhos mais finos.
    if (nivel >= 3) {
      const passo = nivel === 3 ? 0.3 : 0.4;
      for (let t = 0.4; t <= 1.001; t += passo) {
        cachos.push({ c: curva.getPointAt(Math.min(t, 1)), r: entre(0.45, 0.8) });
      }
    }
    if (nivel >= NIVEL_MAX) return;

    const qtd = nivel === 1 ? 3 : rand() < 0.45 ? 3 : 2;
    for (let k = 0; k < qtd; k++) {
      const t = 0.3 + ((k + entre(0.1, 0.9)) / qtd) * 0.65;
      const pt = curva.getPointAt(t);
      const tg = curva.getTangentAt(t);
      let lado = new V().crossVectors(tg, cima);
      if (lado.lengthSq() < 1e-4) lado = new V(1, 0, 0);
      lado.normalize();
      const sinal = k % 2 === 0 ? 1 : -1;
      const nd = tg.clone().multiplyScalar(entre(0.5, 0.9))
        .addScaledVector(lado, sinal * entre(0.5, 1))
        .add(new V(0, entre(-0.05, 0.35), 0))
        .normalize();
      crescer(pt, nd, comp * entre(0.52, 0.7), lerp(r0, r1, t) * 0.8, nivel + 1);
    }
    // Os galhos principais continuam além da ponta, alongando a copa.
    if (nivel <= 2) {
      const tg = curva.getTangentAt(1);
      crescer(curva.getPointAt(1), tg.add(new V(0, -0.04, 0)).normalize(), comp * 0.62, r1 * 0.95, nivel + 1);
    }
  };

  // ---------- tronco retorcido, inclinado para a esquerda ----------
  const troncoR0 = 0.6;
  const troncoR1 = 0.34;
  const LOBOS = 5;
  const tronco = tubo(
    [new V(0, -0.4, 0), new V(0.3, 1.0, 0.08), new V(-0.1, 2.1, -0.06), new V(-0.7, 3.0, 0.12), new V(-1.3, 3.65, 0)],
    troncoR0, troncoR1, 40, 48, 0.1, 1.0, LOBOS,
  );
  const quadrosTronco = ultimo.quadros!;

  // Galhos principais (azimute 0 = direita, π = esquerda; z+ = para a câmera).
  const bracos = [
    { t: 0.6, az: 0.08, elev: 0.42, comp: 2.4 },
    { t: 0.78, az: Math.PI * 0.62, elev: 0.4, comp: 4.0 },
    { t: 0.9, az: Math.PI * 1.32, elev: 0.36, comp: 4.2 },
    { t: 1.0, az: Math.PI * 0.97, elev: 0.24, comp: 5.6 },
    { t: 0.97, az: Math.PI * 1.12, elev: 0.9, comp: 3.2 },
  ];
  for (const b of bracos) {
    const p = tronco.getPointAt(b.t);
    const r = lerp(troncoR0, troncoR1, b.t) * 0.72;
    const d = new V(Math.cos(b.az) * Math.cos(b.elev), Math.sin(b.elev), Math.sin(b.az) * Math.cos(b.elev));
    crescer(p, d, b.comp, r, 1);
  }

  // ---------- raízes: continuam cada contraforte da base e afundam no chão ----------
  // Direção de cada lobo, no mesmo referencial em que o tronco foi construído.
  const N0 = quadrosTronco.normals[0];
  const B0 = quadrosTronco.binormals[0];
  const centroBase = tronco.getPointAt(0.06);
  const direcaoNoAngulo = (a: number) => {
    const d = N0.clone().multiplyScalar(-Math.cos(a)).addScaledVector(B0, Math.sin(a));
    d.y = 0;
    return d.normalize();
  };
  const raiz = (a: number, comp: number, r0: number, alturaInicio: number) => {
    const d = direcaoNoAngulo(a);
    const lado = new V(-d.z, 0, d.x).multiplyScalar(entre(-0.25, 0.25));
    const P = (dist: number, y: number, curva = 0) =>
      new V(centroBase.x + d.x * dist + lado.x * curva, y, centroBase.z + d.z * dist + lado.z * curva);
    tubo(
      [P(0.25, alturaInicio), P(comp * 0.45, alturaInicio * 0.35, 1), P(comp * 0.8, 0.02, 1.6), P(comp, -0.25, 2), P(comp + 0.4, -0.6, 2.2)],
      r0, 0.035, 12, 18, 0.08,
    );
  };
  for (let k = 0; k < LOBOS; k++) {
    raiz((k / LOBOS) * Math.PI * 2, entre(1.7, 2.4), 0.27, 0.7);
  }

  const grupo = new THREE.Group();

  // ---------- madeira ----------
  const casca = texturasCasca(THREE, rand);
  const madeira = new THREE.Mesh(
    juntar(madeiras),
    new THREE.MeshStandardMaterial({
      color: paleta.tronco, map: casca.cor, bumpMap: casca.relevo, bumpScale: 1.3, roughness: 0.95,
    }),
  );
  madeiras.forEach(g => g.dispose());
  grupo.add(madeira);

  // ---------- flores: "cartões" com textura de cacho, cruzados em volta de cada ponto ----------
  const variacoes = 3;
  const texturasFlor = Array.from({ length: variacoes }, () => texturaCacho(THREE, rand, paleta));
  const geoCartao = new THREE.PlaneGeometry(1, 1);
  const CARTOES_POR_CACHO = 7;
  const porVariacao = Array.from({ length: variacoes }, () => [] as { pos: T.Vector3; olhar: T.Vector3; tam: number; giro: number; brilho: number }[]);
  const caixaCopa = new THREE.Box3();

  for (const { c, r } of cachos) {
    for (let i = 0; i < CARTOES_POR_CACHO; i++) {
      const dir = new V(entre(-1, 1), entre(-0.5, 1), entre(-1, 1)).normalize();
      const pos = c.clone().add(new V(dir.x * r * entre(0.1, 0.65), dir.y * r * entre(0.1, 0.45) + r * 0.1, dir.z * r * entre(0.1, 0.65)));
      porVariacao[Math.floor(rand() * variacoes)].push({
        pos,
        // cartões olham para fora e um pouco para cima (pegam a luz da lua)
        olhar: pos.clone().add(dir).add(new V(0, 0.6, 0)),
        tam: r * entre(1.4, 2.1),
        giro: entre(0, Math.PI * 2),
        brilho: entre(0.75, 1.1),
      });
      caixaCopa.expandByPoint(pos);
    }
  }

  const tmp = new THREE.Object3D();
  const cor = new THREE.Color();
  const malhasFlor = texturasFlor.map((tex, v) => {
    const lista = porVariacao[v];
    const mat = new THREE.MeshStandardMaterial({
      map: tex, alphaTest: 0.42, alphaToCoverage: true, side: THREE.DoubleSide, roughness: 0.75, metalness: 0,
    });
    const malha = new THREE.InstancedMesh(geoCartao, mat, lista.length);
    lista.forEach((cartao, i) => {
      tmp.position.copy(cartao.pos);
      tmp.rotation.set(0, 0, 0);
      tmp.lookAt(cartao.olhar);
      tmp.rotateZ(cartao.giro);
      tmp.scale.setScalar(cartao.tam);
      tmp.updateMatrix();
      malha.setMatrixAt(i, tmp.matrix);
      malha.setColorAt(i, cor.setScalar(cartao.brilho));
    });
    grupo.add(malha);
    return malha;
  });

  const geoPetala = geometriaPetala(THREE);

  return {
    grupo,
    madeira,
    flores: malhasFlor,
    caixaCopa,
    geoPetala,
    texturas: [casca.cor, casca.relevo, ...texturasFlor],
  };
}

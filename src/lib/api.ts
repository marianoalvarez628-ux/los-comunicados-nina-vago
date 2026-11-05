// Capa cliente para consumir las API routes de Prisma.
// Las pantallas usan estas funciones asíncronas en lugar del data.ts sincrónico.

export type CategoriaDTO = {
  id: string; // slug
  dbId: string;
  nombre: string;
  short: string;
  descripcion: string;
  imagen: string;
  duracionDias: number;
  orden: number;
  anunciosCount: number;
};

export type ComercianteDTO = {
  id: string;
  nombre: string;
  avatar: string;
  categoria: { slug: string; short: string; nombre: string };
  barrio: string;
  direccion: string;
  instagram?: string;
  whatsapp: string;
  telefono?: string;
  abierto: boolean;
  verificado: boolean;
  metricas: { totalVistas: number; totalLikes: number; totalGuardados: number };
  anunciosCount: number;
};

export type AnuncioDTO = {
  id: string;
  comerciante: {
    id: string;
    nombre: string;
    avatar: string;
    direccion: string;
    barrio: string;
    instagram?: string;
    whatsapp: string;
    telefono?: string;
    abierto: boolean;
    categoriaId: string; // es el ID interno de Prisma (cuid), NO el slug
  };
  categoria: { id: string; short: string; nombre: string }; // id = slug
  titulo: string;
  imagen: string;
  estado: "ABIERTO" | "CERRADO" | "PROMO";
  descripcion: string;
  precio?: string;
  publicadoEn: string;
  venceEn: string;
  metricas: {
    vistas: number;
    likes: number;
    guardados: number;
    compartidos: number;
  };
  galeria: string[];
};

const API_BASE = "";

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

// ============================================================
// CATEGORÍAS
// ============================================================
export async function fetchCategorias(): Promise<CategoriaDTO[]> {
  const data = await fetchJSON<{ categorias: CategoriaDTO[] }>(
    `${API_BASE}/api/categorias`
  );
  return data.categorias;
}

export async function fetchCategoria(slug: string): Promise<CategoriaDTO | null> {
  try {
    const data = await fetchJSON<{ categoria: CategoriaDTO }>(
      `${API_BASE}/api/categorias/${slug}`
    );
    return data.categoria;
  } catch {
    return null;
  }
}

// ============================================================
// ANUNCIOS
// ============================================================
export async function fetchAnuncios(opts: {
  categoria?: string;
  comerciante?: string;
  estado?: string;
  limit?: number;
  offset?: number;
  orderBy?: "recientes" | "populares" | "likes";
} = {}): Promise<{ anuncios: AnuncioDTO[]; total: number }> {
  const params = new URLSearchParams();
  if (opts.categoria) params.set("categoria", opts.categoria);
  if (opts.comerciante) params.set("comerciante", opts.comerciante);
  if (opts.estado) params.set("estado", opts.estado);
  if (opts.limit) params.set("limit", String(opts.limit));
  if (opts.offset) params.set("offset", String(opts.offset));
  if (opts.orderBy) params.set("orderBy", opts.orderBy);

  const data = await fetchJSON<{ anuncios: AnuncioDTO[]; total: number }>(
    `${API_BASE}/api/anuncios?${params.toString()}`
  );
  return data;
}

export async function fetchAnuncio(id: string): Promise<AnuncioDTO | null> {
  try {
    const data = await fetchJSON<{ anuncio: AnuncioDTO }>(
      `${API_BASE}/api/anuncios/${id}`
    );
    return data.anuncio;
  } catch {
    return null;
  }
}

// ============================================================
// COMERCIANTES
// ============================================================
export async function fetchComerciantes(categoria?: string): Promise<ComercianteDTO[]> {
  const url = categoria
    ? `${API_BASE}/api/comerciantes?categoria=${categoria}`
    : `${API_BASE}/api/comerciantes`;
  const data = await fetchJSON<{ comerciantes: ComercianteDTO[] }>(url);
  return data.comerciantes;
}

// ============================================================
// ACCIONES (likes, compartir)
// ============================================================
export async function toggleLike(
  anuncioId: string,
  whatsapp: string
): Promise<{ liked: boolean; likes: number } | null> {
  try {
    const res = await fetch(`${API_BASE}/api/anuncios/${anuncioId}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ whatsapp }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function compartirAnuncio(
  anuncioId: string
): Promise<{ compartidos: number; whatsappUrl: string } | null> {
  try {
    const res = await fetch(`${API_BASE}/api/anuncios/${anuncioId}/compartir`, {
      method: "POST",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

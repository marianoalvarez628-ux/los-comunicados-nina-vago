// Mock data for the Folleto Clasificados prototype.
// Modelo: 5 categorías. Cada categoría agrupa comerciantes que publican anuncios.
// El usuario navega: Home (categorías) → Categoría (anuncios) → Detalle (anuncio).

export type Categoria = {
  id: string;
  nombre: string;
  // nombre corto para chips/tags:
  short: string;
  descripcion: string;
  imagen: string; // imagen de referencia
};

export type Comerciante = {
  id: string;
  nombre: string;
  avatar: string;
  categoriaId: string; // cada comerciante pertenece a una categoría
  barrio: string;
  direccion: string;
  instagram?: string;
  whatsapp?: string;
  telefono?: string;
  abierto: boolean;
};

export type Anuncio = {
  id: string;
  comercianteId: string;
  titulo: string; // máximo 3 palabras
  imagen: string;
  estado: "ABIERTO" | "CERRADO" | "PROMO" | "NUEVO" | "OFERTA";
  descripcion: string; // hasta 90 palabras
  precio?: string;
};

// ============================================================
// CATEGORÍAS — las 5 categorías que pidió el usuario
// ============================================================
export const categorias: Categoria[] = [
  {
    id: "restobares",
    nombre: "RestoBares & Comidas al paso",
    short: "RestoBares",
    descripcion:
      "Restaurantes, bares, comida al paso, rotiserías y delivery casero.",
    imagen:
      "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/d0ad512486e7.jpg",
  },
  {
    id: "kioscos",
    nombre: "Kioscos & Despensas",
    short: "Kioscos",
    descripcion:
      "Kioscos, almacenes, despensas y mini-markets de barrio.",
    imagen:
      "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/895e4fde39ba.jpg",
  },
  {
    id: "tiendas",
    nombre: "Tiendas & Comercios",
    short: "Tiendas",
    descripcion:
      "Tiendas de barrio, locales comerciales y comercios minoristas.",
    imagen:
      "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/beeaba60f2a7.jpg",
  },
  {
    id: "servicios",
    nombre: "Servicios Profesionales & Oficios",
    short: "Servicios",
    descripcion:
      "Electricistas, plomeros, electricidad, belleza, estética y oficios varios.",
    imagen:
      "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/970a9d6d99c3.jpg",
  },
  {
    id: "compraventa",
    nombre: "Compra Venta",
    short: "Compra Venta",
    descripcion:
      "Productos en venta, segunda mano, artesanías y trueque entre particulares y comercios.",
    imagen: "/categorias/compra-venta.png",
  },
  {
    id: "anuncios",
    nombre: "Anuncios",
    short: "Anuncios",
    descripcion:
      "Promociones, ofertas, eventos y avisos generales del barrio.",
    imagen: "/categorias/anuncios.png",
  },
];

// ============================================================
// COMERCIANTES — reasignados a las 5 categorías
// ============================================================
export const comerciantes: Comerciante[] = [
  {
    id: "la-esquina",
    nombre: "La Esquina",
    avatar:
      "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/234d79046682.png",
    categoriaId: "restobares",
    barrio: "Caballito, CABA",
    direccion: "Av. Rivadavia 1234, Caballito",
    instagram: "@laesquina",
    whatsapp: "+54 11 5555-1234",
    telefono: "+54 11 5555-1234",
    abierto: true,
  },
  {
    id: "las-empanadas",
    nombre: "Las Empanadas",
    avatar:
      "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/d0ad512486e7.jpg",
    categoriaId: "restobares",
    barrio: "Caballito, CABA",
    direccion: "Perú 456, Caballito",
    instagram: "@empanadas.ok",
    whatsapp: "+54 11 5566-1234",
    telefono: "+54 11 5566-1234",
    abierto: true,
  },
  {
    id: "almacen-don-pedro",
    nombre: "Almacén Don Pedro",
    avatar:
      "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/895e4fde39ba.jpg",
    categoriaId: "kioscos",
    barrio: "Caballito, CABA",
    direccion: "Av. Rivadavia 4500, Caballito",
    instagram: "@donpedro.almacen",
    whatsapp: "+54 11 5544-3322",
    telefono: "+54 11 5544-3322",
    abierto: true,
  },
  {
    id: "kiosco-lucia",
    nombre: "Kiosco Lucía",
    avatar:
      "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/9bf2627834af.jpg",
    categoriaId: "kioscos",
    barrio: "Flores, CABA",
    direccion: "Av. Carabobo 250, Flores",
    instagram: "@kiosco.lucia",
    whatsapp: "+54 11 5500-1100",
    telefono: "+54 11 5500-1100",
    abierto: false,
  },
  {
    id: "frente-local",
    nombre: "Frente de Local",
    avatar:
      "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/beeaba60f2a7.jpg",
    categoriaId: "tiendas",
    barrio: "Caballito, CABA",
    direccion: "Av. La Plata 800, Caballito",
    instagram: "@frentedelocal",
    whatsapp: "+54 11 5577-1100",
    telefono: "+54 11 5577-1100",
    abierto: true,
  },
  {
    id: "servicios-barrio",
    nombre: "Servicios del Barrio",
    avatar:
      "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/ff3078d85532.jpg",
    categoriaId: "servicios",
    barrio: "Flores, CABA",
    direccion: "Av. Carabobo 250, Flores",
    instagram: "@servicios.barrio",
    whatsapp: "+54 11 5566-7890",
    telefono: "+54 11 5566-7890",
    abierto: false,
  },
  {
    id: "belleza-estilo",
    nombre: "Belleza & Estilo",
    avatar:
      "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/7fb83c9216e4.jpg",
    categoriaId: "servicios",
    barrio: "Caballito, CABA",
    direccion: "Av. Rivadavia 3200, Caballito",
    instagram: "@belleza.estilo",
    whatsapp: "+54 11 5599-3300",
    telefono: "+54 11 5599-3300",
    abierto: true,
  },
  {
    id: "mano-artesano",
    nombre: "Mano del Artesano",
    avatar:
      "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/3c02bc0d3ea1.jpg",
    categoriaId: "compraventa",
    barrio: "San Telmo, CABA",
    direccion: "Defensa 900, San Telmo",
    instagram: "@mano.artesano",
    whatsapp: "+54 11 5588-2200",
    telefono: "+54 11 5588-2200",
    abierto: false,
  },
  // === Comerciantes adicionales para que cada categoría tenga 4 anuncios ===
  {
    id: "rotiseria-mama",
    nombre: "Rotisería Mamá",
    avatar:
      "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/d16caf7fdb4c.webp",
    categoriaId: "restobares",
    barrio: "Caballito, CABA",
    direccion: "Rivadavia 2300, Caballito",
    instagram: "@rotiseria.mama",
    whatsapp: "+54 11 5544-9988",
    telefono: "+54 11 5544-9988",
    abierto: true,
  },
  {
    id: "maxikiosco-tito",
    nombre: "Maxikiosco Tito",
    avatar:
      "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/895e4fde39ba.jpg",
    categoriaId: "kioscos",
    barrio: "Flores, CABA",
    direccion: "Av. Directorio 1200, Flores",
    instagram: "@maxikiosco.tito",
    whatsapp: "+54 11 5533-1100",
    telefono: "+54 11 5533-1100",
    abierto: true,
  },
  {
    id: "boutique-malena",
    nombre: "Boutique Malena",
    avatar:
      "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/20a5319b965d.jpeg",
    categoriaId: "tiendas",
    barrio: "Caballito, CABA",
    direccion: "Av. Rivadavia 4800, Caballito",
    instagram: "@boutique.malena",
    whatsapp: "+54 11 5511-2233",
    telefono: "+54 11 5511-2233",
    abierto: true,
  },
  {
    id: "joyeria-luz",
    nombre: "Joyería Luz",
    avatar:
      "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/52ce36d21e15.jpeg",
    categoriaId: "compraventa",
    barrio: "San Telmo, CABA",
    direccion: "Defensa 1100, San Telmo",
    instagram: "@joyeria.luz",
    whatsapp: "+54 11 5522-3344",
    telefono: "+54 11 5522-3344",
    abierto: false,
  },
  // === Comerciantes para la categoría nueva Anuncios ===
  {
    id: "radio-barrial",
    nombre: "Radio Barrial",
    avatar:
      "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/d0ad512486e7.jpg",
    categoriaId: "anuncios",
    barrio: "Caballito, CABA",
    direccion: "Av. Rivadavia 1500, Caballito",
    instagram: "@radio.barrial",
    whatsapp: "+54 11 5566-1212",
    telefono: "+54 11 5566-1212",
    abierto: true,
  },
  {
    id: "cooperativa-vientos",
    nombre: "Cooperativa Vientos",
    avatar:
      "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/beeaba60f2a7.jpg",
    categoriaId: "anuncios",
    barrio: "Flores, CABA",
    direccion: "Av. Carabobo 800, Flores",
    instagram: "@coope.vientos",
    whatsapp: "+54 11 5577-9988",
    telefono: "+54 11 5577-9988",
    abierto: true,
  },
];

// Galería de imágenes por comerciante (4 imágenes para el detalle)
export const galeriaImagenes: Record<string, string[]> = {
  "la-esquina": [
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/234d79046682.png",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/d0ad512486e7.jpg",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/d16caf7fdb4c.webp",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/234d79046682.png",
  ],
  "las-empanadas": [
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/d0ad512486e7.jpg",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/234d79046682.png",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/d16caf7fdb4c.webp",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/d0ad512486e7.jpg",
  ],
  "almacen-don-pedro": [
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/895e4fde39ba.jpg",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/9bf2627834af.jpg",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/895e4fde39ba.jpg",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/9bf2627834af.jpg",
  ],
  "kiosco-lucia": [
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/9bf2627834af.jpg",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/895e4fde39ba.jpg",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/9bf2627834af.jpg",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/895e4fde39ba.jpg",
  ],
  "frente-local": [
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/beeaba60f2a7.jpg",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/20a5319b965d.jpeg",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/52ce36d21e15.jpeg",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/beeaba60f2a7.jpg",
  ],
  "servicios-barrio": [
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/ff3078d85532.jpg",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/91263666b73c.jpg",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/a1adc79363b4.jpg",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/ff3078d85532.jpg",
  ],
  "belleza-estilo": [
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/7fb83c9216e4.jpg",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/6d29ddbb5dd9.jpg",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/2b239f755f28.png",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/7fb83c9216e4.jpg",
  ],
  "mano-artesano": [
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/3c02bc0d3ea1.jpg",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/f1b22e517d60.jpg",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/52a823c1841b.jpg",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/3c02bc0d3ea1.jpg",
  ],
  "rotiseria-mama": [
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/d16caf7fdb4c.webp",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/234d79046682.png",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/d0ad512486e7.jpg",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/d16caf7fdb4c.webp",
  ],
  "maxikiosco-tito": [
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/895e4fde39ba.jpg",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/9bf2627834af.jpg",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/895e4fde39ba.jpg",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/9bf2627834af.jpg",
  ],
  "boutique-malena": [
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/20a5319b965d.jpeg",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/52ce36d21e15.jpeg",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/beeaba60f2a7.jpg",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/20a5319b965d.jpeg",
  ],
  "joyeria-luz": [
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/52ce36d21e15.jpeg",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/20a5319b965d.jpeg",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/52ce36d21e15.jpeg",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/20a5319b965d.jpeg",
  ],
  "radio-barrial": [
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/d0ad512486e7.jpg",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/234d79046682.png",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/d0ad512486e7.jpg",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/234d79046682.png",
  ],
  "cooperativa-vientos": [
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/beeaba60f2a7.jpg",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/52ce36d21e15.jpeg",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/beeaba60f2a7.jpg",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/52ce36d21e15.jpeg",
  ],
};

// ============================================================
// ANUNCIOS — reasignados a las nuevas categorías (via comercianteId)
// ============================================================
export const anuncios: Anuncio[] = [
  // === RestoBares ===
  {
    id: "an-1",
    comercianteId: "la-esquina",
    titulo: "Milanesa de la abuela",
    imagen: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/234d79046682.png",
    estado: "ABIERTO",
    descripcion:
      "Hecha en el día, pan rallado puro, panificado por la mañana. Llevala caliente a casa. Entrega en el barrio sin recargo. Promo: 2×1 los martes y miércoles. Pedí con 24hs de anticipación para entregas grandes.",
    precio: "$1.250",
  },
  {
    id: "an-2",
    comercianteId: "las-empanadas",
    titulo: "Empanadas al horno",
    imagen: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/d0ad512486e7.jpg",
    estado: "PROMO",
    descripcion:
      "Salteñas y árabes al horno, hechas en el día. Docena $4.500. Pedí con 24hs de anticipación para llevar caliente. Combo familiar disponible. Sabores: carne suave, pollo, jamón y queso, humita.",
    precio: "$4.500",
  },
  {
    id: "an-3",
    comercianteId: "la-esquina",
    titulo: "Sándwich de milanesa",
    imagen: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/d16caf7fdb4c.webp",
    estado: "ABIERTO",
    descripcion:
      "Pan artesanal, milanesa completa con lechuga, tomate, queso y huevo frito. Combo con gaseosa $2.800. Delivery en Caballito y alrededores. Horario: lun a sáb de 11 a 15 y de 19 a 23.",
    precio: "$2.800",
  },
  // === Kioscos ===
  {
    id: "an-4",
    comercianteId: "almacen-don-pedro",
    titulo: "Pack almacén mensual",
    imagen: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/895e4fde39ba.jpg",
    estado: "OFERTA",
    descripcion:
      "Combo de productos esenciales: harina, azúcar, aceite, yerba, fideos, arroz, leche en polvo. Pack familiar mensual con 20% de descuento. Retirá en local o pedí delivery en el barrio. Stock renovado semanalmente.",
    precio: "$12.500",
  },
  {
    id: "an-5",
    comercianteId: "kiosco-lucia",
    titulo: "Golosinas al por mayor",
    imagen: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/9bf2627834af.jpg",
    estado: "NUEVO",
    descripcion:
      "Cajas de alfajores, chocolates y caramelos para eventos y cumpleaños. Precios mayoristas a partir de 10 unidades. Marcas nacionales y regionales. Envío sin cargo en el barrio por compras superiores a $15.000.",
    precio: "$8.200",
  },
  // === Tiendas ===
  {
    id: "an-6",
    comercianteId: "frente-local",
    titulo: "Alquiler de local",
    imagen: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/beeaba60f2a7.jpg",
    estado: "NUEVO",
    descripcion:
      "Local comercial de 35m² en zona céntrica de Caballito. Frente a avenida con mucho paso. Ideal para emprendimiento gastronómico o retail. Sin gastos comunes. Posibilidad de reformas a cargo del inquilino.",
    precio: "$450.000",
  },
  {
    id: "an-7",
    comercianteId: "frente-local",
    titulo: "Showroom temporario",
    imagen: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/20a5319b965d.jpeg",
    estado: "PROMO",
    descripcion:
      "Espacio en alquiler por día o semana. Ideal para pop-ups, lanzamientos, eventos pequeños. Capacidad para 30 personas. Incluye baño y cocina. Descuento del 15% por contrataciones de más de 3 días.",
    precio: "$35.000",
  },
  // === Servicios ===
  {
    id: "an-8",
    comercianteId: "servicios-barrio",
    titulo: "Reparaciones de plomería",
    imagen: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/ff3078d85532.jpg",
    estado: "CERRADO",
    descripcion:
      "Servicio técnico para pérdida de agua, destapación de cañerías y reparación de grifería. Presupuesto sin cargo en el barrio. Atendemos en el día en Caballito, Flores y alrededores. Materiales con garantía.",
    precio: "$2.500",
  },
  {
    id: "an-9",
    comercianteId: "servicios-barrio",
    titulo: "Electricista domiciliario",
    imagen: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/91263666b73c.jpg",
    estado: "PROMO",
    descripcion:
      "Instalación de tomacorrientes, reparación de tableros y colocación de luminarias. Trabajos con certificado eléctrico. Presupuesto sin cargo. Promo: 10% off en instalaciones completas durante este mes.",
    precio: "$3.200",
  },
  {
    id: "an-10",
    comercianteId: "belleza-estilo",
    titulo: "Corte y peinado",
    imagen: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/7fb83c9216e4.jpg",
    estado: "ABIERTO",
    descripcion:
      "Corte de cabello profesional para mujer, lavado y peinado final. Productos premium sin amoníaco. Asesoría de estilo según tu rostro y rutina. Turnos por WhatsApp con confirmación previa. Promo primer corte 15% off.",
    precio: "$6.500",
  },
  {
    id: "an-11",
    comercianteId: "belleza-estilo",
    titulo: "Manicuria y esmaltado",
    imagen: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/6d29ddbb5dd9.jpg",
    estado: "PROMO",
    descripcion:
      "Manicuria clásica, esmaltado semipermanente y nail-art básico. Higiene con materiales esterilizados. Esmaltes veganos libres de tóxicos. Promo: 2×1 los martes y miércoles en tratamientos de manicuria.",
    precio: "$4.200",
  },
  // === Compra Venta ===
  {
    id: "an-12",
    comercianteId: "mano-artesano",
    titulo: "Tejidos de lana",
    imagen: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/3c02bc0d3ea1.jpg",
    estado: "NUEVO",
    descripcion:
      "Bufandas, gorros y mantas de lana merino tejidas a mano. Cada pieza es única. Personalización en color y tamaño. Entregas a todo el país por correo. Trabajos especiales para fechas: Navidad, Día de la Madre.",
    precio: "$15.000",
  },
  {
    id: "an-13",
    comercianteId: "mano-artesano",
    titulo: "Cerámica artesanal",
    imagen: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/f1b22e517d60.jpg",
    estado: "ABIERTO",
    descripcion:
      "Vasijas, tazas y platos hechos a mano con técnicas tradicionales. Cada pieza cocida a 980°C. Ideal para regalar o decorar. Aceptamos pedidos personalizados. Visitá el taller en San Telmo con cita previa.",
    precio: "$7.500",
  },
  {
    id: "an-14",
    comercianteId: "mano-artesano",
    titulo: "Cueros y marroquinería",
    imagen: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/52a823c1841b.jpg",
    estado: "CERRADO",
    descripcion:
      "Billeteras, cinturones y bolsos en cuero vacuno curtido al vegetal. Costuras a mano. Grabado de iniciales sin cargo. Garantía de por vida. Stock disponible y pedidos especiales con 15 días de anticipación.",
    precio: "$22.000",
  },
  // === Anuncios adicionales para completar 4 por categoría ===
  // RestoBares (4to anuncio)
  {
    id: "an-15",
    comercianteId: "rotiseria-mama",
    titulo: "Viandas saludables",
    imagen: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/d16caf7fdb4c.webp",
    estado: "ABIERTO",
    descripcion:
      "Menús semanales variados: pollo al horno, wok de vegetales, ensaladas completas. Porciones individuales y familiares. Entrega lunes a viernes de 18 a 21h en Caballito. Promo: pedí 5 viandas y la 6ta va por nuestra cuenta.",
  },
  // Kioscos (3ro y 4to anuncio)
  {
    id: "an-16",
    comercianteId: "almacen-don-pedro",
    titulo: "Pack almacén mensual",
    imagen: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/895e4fde39ba.jpg",
    estado: "OFERTA",
    descripcion:
      "Combo de productos esenciales: harina, azúcar, aceite, yerba, fideos, arroz, leche en polvo. Pack familiar mensual con 20% de descuento. Retirá en local o pedí delivery en el barrio. Stock renovado semanalmente.",
  },
  {
    id: "an-17",
    comercianteId: "maxikiosco-tito",
    titulo: "Promo cumpleaños",
    imagen: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/9bf2627834af.jpg",
    estado: "PROMO",
    descripcion:
      "Globos, serpentinas, velas y golosinas para fiestas infantiles. Pack armado desde $8.000 según cantidad de chicos. Repartimos el día del evento sin cargo en Flores y Caballito. Reservá con 7 días de anticipación.",
  },
  // Tiendas (3ro y 4to anuncio)
  {
    id: "an-18",
    comercianteId: "boutique-malena",
    titulo: "Colección primavera verano",
    imagen: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/20a5319b965d.jpeg",
    estado: "NUEVO",
    descripcion:
      "Vestidos, camisas y accesorios en algodón y lino. Talles del 38 al 48. Probá en el local o pedí por WhatsApp con envío a domicilio. Promo lanzamiento: 15% off en toda la colección durante octubre.",
  },
  {
    id: "an-19",
    comercianteId: "frente-local",
    titulo: "Alquiler de local",
    imagen: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/beeaba60f2a7.jpg",
    estado: "NUEVO",
    descripcion:
      "Local comercial de 35m² en zona céntrica de Caballito. Frente a avenida con mucho paso. Ideal para emprendimiento gastronómico o retail. Sin gastos comunes. Posibilidad de reformas a cargo del inquilino.",
  },
  // Compra Venta (4to anuncio)
  {
    id: "an-20",
    comercianteId: "joyeria-luz",
    titulo: "Catálogo plata 925",
    imagen: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/52ce36d21e15.jpeg",
    estado: "PROMO",
    descripcion:
      "Anillos, cadenas, aros y pulseras en plata 925. Grabado sin cargo hasta 10 caracteres. Limpieza y pulido gratis de por vida. Promo: 2×1 en aros cargados todos los viernes. Visita con cita previa a nuestro local en San Telmo.",
  },
  // Anuncios (4 anuncios para esta categoría nueva)
  {
    id: "an-21",
    comercianteId: "radio-barrial",
    titulo: "Programa en vivo",
    imagen: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/d0ad512486e7.jpg",
    estado: "ABIERTO",
    descripcion:
      "Saludamos comercios, eventos y cumpleaños del barrio en el aire. Llamanos o escribinos por WhatsApp para participar del próximo programa. Transmisión los sábados de 11 a 13h por Instagram en vivo.",
  },
  {
    id: "an-22",
    comercianteId: "cooperativa-vientos",
    titulo: "Feria de trueque",
    imagen: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/beeaba60f2a7.jpg",
    estado: "NUEVO",
    descripcion:
      "Llevá lo que ya no usás y llevate algo nuevo para vos. Ropa, libros, juguetes, herramientas. Entrada libre y gratuita. Último sábado de cada mes de 15 a 19h en Plaza Flores. Coordiná por WhatsApp si querés participar como expositor.",
  },
  {
    id: "an-23",
    comercianteId: "radio-barrial",
    titulo: "Aviso solidario",
    imagen: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/d0ad512486e7.jpg",
    estado: "ABIERTO",
    descripcion:
      "Buscamos ropa de abrigo y mantas para donar a familias del barrio. Acercá tus donaciones de lunes a viernes de 10 a 18h. Coordiná por WhatsApp si necesitás que pasemos a buscar. Todas las donaciones son bienvenidas.",
  },
  {
    id: "an-24",
    comercianteId: "cooperativa-vientos",
    titulo: "Taller gratuito",
    imagen: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/beeaba60f2a7.jpg",
    estado: "PROMO",
    descripcion:
      "Taller de costura y reparación de ropa. Traé esa prenda que no usás y aprendé a darle una segunda vida. Materiales incluidos. Cupos limitados, anotate por WhatsApp. Todos los miércoles de 18 a 20h en nuestra sede.",
  },
];

// ============================================================
// Helpers
// ============================================================
export function getCategoria(id: string) {
  return categorias.find((c) => c.id === id);
}

export function getComerciante(id: string) {
  return comerciantes.find((c) => c.id === id);
}

export function getComerciantesByCategoria(categoriaId: string) {
  return comerciantes.filter((c) => c.categoriaId === categoriaId);
}

export function getAnunciosByCategoria(categoriaId: string): Anuncio[] {
  const comerciantesIds = getComerciantesByCategoria(categoriaId).map(
    (c) => c.id
  );
  return anuncios.filter((a) => comerciantesIds.includes(a.comercianteId));
}

export function getAnunciosByComerciante(comercianteId: string) {
  return anuncios.filter((a) => a.comercianteId === comercianteId);
}

export function getAnuncio(id: string) {
  return anuncios.find((a) => a.id === id);
}

export function getGaleria(comercianteId: string) {
  return (
    galeriaImagenes[comercianteId] || [
      "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/3c02bc0d3ea1.jpg",
    ]
  );
}

export function countAnunciosByCategoria(categoriaId: string) {
  return getAnunciosByCategoria(categoriaId).length;
}

export function countComerciantesByCategoria(categoriaId: string) {
  return getComerciantesByCategoria(categoriaId).length;
}

// Helpers de presentación
export function estadoChipColor(estado: Anuncio["estado"]) {
  switch (estado) {
    case "ABIERTO":
      return "bg-[#5CD9A0]/12 text-[#5CD9A0] border-[#5CD9A0]/30";
    case "CERRADO":
      return "bg-[#FF6B5C]/12 text-[#FF6B5C] border-[#FF6B5C]/30";
    case "PROMO":
    case "OFERTA":
      return "bg-[#FFB547]/12 text-[#FFB547] border-[#FFB547]/30";
    case "NUEVO":
      return "bg-[#FF6B5C]/12 text-[#FF6B5C] border-[#FF6B5C]/30";
    default:
      return "bg-white/8 text-[#C9C2B6] border-white/15";
  }
}

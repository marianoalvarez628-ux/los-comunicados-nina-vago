// Generador del documento "Folleto Clasificados — Reglas de Negocio"
// Especificación técnica del producto con todas las reglas confirmadas.

const {
  Document, Packer, Paragraph, TextRun, Header, Footer,
  AlignmentType, HeadingLevel, PageNumber, PageBreak,
  Table, TableRow, TableCell, WidthType, BorderStyle,
  ShadingType, LevelFormat, convertInchesToTwip,
  TableOfContents,
} = require("docx");
const fs = require("fs");
const path = require("path");

// ============================================================
// PALETA — Grafito + Coral (consistente con el prototipo web)
// ============================================================
const P = {
  primary: "#14141A",     // grafito profundo
  body: "#2A2A33",        // grafito card
  muted: "#8A8579",       // gris cálido
  accent: "#FF6B5C",      // coral
  accentLight: "#FF8C7A", // coral claro
  amber: "#FFB547",       // ámbar
  ok: "#5CD9A0",          // verde suave
  bg: "#F5F0E8",          // blanco hueso (para fondos claros)
};
const c = (hex) => hex.replace("#", "");

// ============================================================
// COMPONENT BUILDERS
// ============================================================

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 480, after: 200 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 36, // 18pt
        color: c(P.primary),
        font: { ascii: "Calibri", eastAsia: "Calibri" },
      }),
    ],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 140 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 28, // 14pt
        color: c(P.accent),
        font: { ascii: "Calibri", eastAsia: "Calibri" },
      }),
    ],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 100 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 24, // 12pt
        color: c(P.primary),
        font: { ascii: "Calibri", eastAsia: "Calibri" },
      }),
    ],
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 312, after: 100 },
    children: [
      new TextRun({
        text,
        size: 22, // 11pt
        color: c(P.body),
        font: { ascii: "Calibri", eastAsia: "Calibri" },
        ...opts,
      }),
    ],
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    spacing: { line: 312, after: 60 },
    indent: { left: 360 + level * 360 },
    children: [
      new TextRun({ text: "• ", size: 22, color: c(P.accent), bold: true }),
      new TextRun({
        text,
        size: 22,
        color: c(P.body),
        font: { ascii: "Calibri", eastAsia: "Calibri" },
      }),
    ],
  });
}

function bulletKV(label, value, level = 0) {
  return new Paragraph({
    spacing: { line: 312, after: 60 },
    indent: { left: 360 + level * 360 },
    children: [
      new TextRun({ text: "• ", size: 22, color: c(P.accent), bold: true }),
      new TextRun({
        text: label + ": ",
        size: 22,
        bold: true,
        color: c(P.primary),
        font: { ascii: "Calibri", eastAsia: "Calibri" },
      }),
      new TextRun({
        text: value,
        size: 22,
        color: c(P.body),
        font: { ascii: "Calibri", eastAsia: "Calibri" },
      }),
    ],
  });
}

function ruleLine() {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: c(P.accent) } },
    children: [new TextRun({ text: "" })],
  });
}

// ============================================================
// TABLA PARA RESUMEN DE REGLAS
// ============================================================

function buildRulesTable(rows) {
  const headerCells = ["#", "Regla", "Valor"].map((t) =>
    new TableCell({
      width: { size: t === "#" ? 10 : t === "Regla" ? 35 : 55, type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.CLEAR, color: "auto", fill: c(P.primary) },
      margins: { top: 100, bottom: 100, left: 120, right: 120 },
      children: [
        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [
            new TextRun({
              text: t,
              bold: true,
              size: 22,
              color: "F5F0E8",
              font: { ascii: "Calibri", eastAsia: "Calibri" },
            }),
          ],
        }),
      ],
    })
  );

  const bodyRows = rows.map(([num, rule, val]) => {
    const fill = "FFFFFF";
    return new TableRow({
      cantSplit: true,
      children: [
        new TableCell({
          width: { size: 10, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.CLEAR, color: "auto", fill: c(P.accent) },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: num,
                  bold: true,
                  size: 20,
                  color: "FFFFFF",
                  font: { ascii: "Calibri", eastAsia: "Calibri" },
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 35, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.CLEAR, color: "auto", fill },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: rule,
                  bold: true,
                  size: 21,
                  color: c(P.primary),
                  font: { ascii: "Calibri", eastAsia: "Calibri" },
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 55, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.CLEAR, color: "auto", fill },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: val,
                  size: 21,
                  color: c(P.body),
                  font: { ascii: "Calibri", eastAsia: "Calibri" },
                }),
              ],
            }),
          ],
        }),
      ],
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: headerCells,
      }),
      ...bodyRows,
    ],
  });
}

// ============================================================
// CONTENIDO — Cover y 6 secciones
// ============================================================

// COVER — Recipe R1 simplificado (página de título limpia)
function buildCover() {
  const wrapper = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: "auto" },
      bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
      left: { style: BorderStyle.NONE, size: 0, color: "auto" },
      right: { style: BorderStyle.NONE, size: 0, color: "auto" },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
    },
    rows: [
      new TableRow({
        height: { value: 14000, rule: "exact" },
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, color: "auto", fill: c(P.primary) },
            margins: { top: 1800, bottom: 1200, left: 1200, right: 1200 },
            children: [
              // Chip superior
              new Paragraph({
                spacing: { after: 480 },
                children: [
                  new TextRun({
                    text: "PROYECTO DIGITAL  ·  ESPECIFICACIÓN  ·  2026",
                    size: 18,
                    bold: true,
                    color: c(P.accent),
                    font: { ascii: "Calibri", eastAsia: "Calibri" },
                    characterSpacing: 80,
                  }),
                ],
              }),
              // Título principal
              new Paragraph({
                spacing: { after: 240 },
                children: [
                  new TextRun({
                    text: "Folleto de Clasificados",
                    size: 88, // 44pt
                    bold: true,
                    italics: true,
                    color: "F5F0E8",
                    font: { ascii: "Playfair Display", eastAsia: "Playfair Display" },
                  }),
                ],
              }),
              // Subtítulo
              new Paragraph({
                spacing: { after: 800 },
                children: [
                  new TextRun({
                    text: "Reglas de negocio y especificación funcional del producto mobile-first.",
                    size: 26, // 13pt
                    color: "C9C2B6",
                    font: { ascii: "Calibri", eastAsia: "Calibri" },
                  }),
                ],
              }),
              // Línea coral
              new Paragraph({
                spacing: { after: 600 },
                border: { bottom: { style: BorderStyle.SINGLE, size: 18, color: c(P.accent) } },
                children: [new TextRun({ text: "" })],
              }),
              // Chips de tecnologías
              new Paragraph({
                spacing: { after: 1200 },
                children: [
                  new TextRun({ text: "Multi-rubro  ·  Mobile-first  ·  6 imágenes × 90 palabras  ·  6 categorías", size: 18, color: "8A8579", font: { ascii: "Calibri", eastAsia: "Calibri" } }),
                ],
              }),
              // Metadata al pie
              new Paragraph({
                spacing: { before: 2400, after: 80 },
                children: [
                  new TextRun({
                    text: "Versión 1.0  ·  Iteración 1",
                    size: 18,
                    color: "8A8579",
                    font: { ascii: "Calibri", eastAsia: "Calibri" },
                    characterSpacing: 40,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Z.ai  ·  Octubre 2026",
                    size: 18,
                    color: "8A8579",
                    font: { ascii: "Calibri", eastAsia: "Calibri" },
                    characterSpacing: 40,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
  return [wrapper];
}

// ============================================================
// SECCIONES DE CONTENIDO
// ============================================================

function buildResumenEjecutivo() {
  return [
    h1("Resumen ejecutivo"),
    body("Este documento consolida las reglas de negocio del producto digital Folleto de Clasificados, un folleto mobile-first donde comerciantes barriales publican productos y servicios. Las reglas fueron definidas en una sesión de análisis estructurada en seis grupos temáticos: usuarios y registro, reglas del anuncio, visibilidad y alcance, interacción social, modelo comercial y moderación."),
    body("La primera fase del producto arranca con un modelo 100% gratuito para fomentar adopción durante los primeros seis meses. Toda publicación es anónima para el visitante pero requiere login OTP por WhatsApp para el comerciante, con moderación posterior y un sistema de strikes para prevenir abuso. El folleto tendrá seis categorías con duraciones diferenciadas: las categorías estables duran 30 días, las de oferta y avisos puntuales duran 5 días."),
    body("Cada comerciante puede publicar hasta 5 anuncios gratuitos, cada uno con un máximo de 4 imágenes y 90 palabras de descripción. Las métricas de vistas, me gusta y compartidos se muestran en el detalle del anuncio. Los estados posibles de un anuncio son tres: ABIERTO, CERRADO y PROMO."),
    ruleLine(),
    h2("Stack técnico confirmado"),
    bulletKV("Frontend", "Next.js 16 con App Router, TypeScript, Tailwind CSS 4, shadcn/ui"),
    bulletKV("Backend", "Next.js API Routes + Prisma ORM (SQLite para desarrollo, PostgreSQL en producción)"),
    bulletKV("Auth", "Login OTP por WhatsApp (sin contraseña) + NextAuth.js para sesiones"),
    bulletKV("Estado", "Zustand para navegación, TanStack Query para datos del servidor"),
    bulletKV("Tiempo real", "Socket.io para notificaciones en vivo (opcional, segunda fase)"),
    bulletKV("Paleta visual", "Grafito #14141A + Blanco hueso #F5F0E8 + Coral #FF6B5C"),
    bulletKV("Tipografía", "Playfair Display (títulos) + Source Sans 3 (cuerpo) + JetBrains Mono (datos)"),
  ];
}

function buildGrupoA() {
  return [
    h1("Grupo A — Usuarios y registro"),
    body("Este grupo define quién puede usar el producto, cómo se registra y qué datos pedimos. Es la base para todas las demás reglas porque afecta directamente las pantallas de login, registro, perfil del comerciante y el flujo de publicación."),

    h2("Resumen de reglas"),
    buildRulesTable([
      ["A1", "Visita", "Cualquier persona, sin registro"],
      ["A2", "Publicación", "Solo registrados con WhatsApp + OTP"],
      ["A3", "Datos mínimos", "Nombre del comercio + WhatsApp + dirección + categoría"],
      ["A4", "Verificación", "OTP por WhatsApp (sin email)"],
      ["A5", "Sucursales", "1 comerciante = 1 dirección (escalar después)"],
      ["A6", "Edición", "Libre del propio anuncio"],
      ["A7", "Reseñas", "Sin sistema de reseñas (fase 1)"],
    ]),

    h2("Detalle de cada regla"),
    h3("A1 — Visita anónima"),
    body("Cualquier persona puede abrir el folleto y ver todos los anuncios sin necesidad de registro. Esto minimiza la fricción para que el folleto crezca orgánicamente. El login solo se pide cuando el usuario quiere dar me gusta, guardar un anuncio o publicar uno propio."),

    h3("A2 — Publicación con registro OTP"),
    body("Para publicar un anuncio, el comerciante debe registrarse con su número de WhatsApp y verificarlo con un código OTP enviado por mensaje. No hay contraseña: cada ingreso requiere OTP. Esto elimina la fricción de recordar contraseñas y valida automáticamente que el WhatsApp sea real."),

    h3("A3 — Datos mínimos del comerciante"),
    body("Al registrarse, el comerciante completa cuatro campos obligatorios: nombre del comercio, número de WhatsApp (verificado por OTP), dirección física y categoría principal. Instagram es opcional. Estos datos se reflejan luego en el header de cada anuncio que publique."),

    h3("A4 — Verificación OTP por WhatsApp"),
    body("La verificación se hace enviando un código de 6 dígitos por WhatsApp al número ingresado. El código expira en 5 minutos. Si falla 3 veces, se bloquea el intento por 15 minutos para prevenir abuso. No hay verificación por email para mantener el flujo en mobile."),

    h3("A5 — Una dirección por comerciante"),
    body("Cada comerciante tiene una única dirección física. Si tiene varias sucursales, debe crear cuentas separadas. Esta limitación se revisará en la fase 2 del producto, cuando se agregue el soporte multi-sucursal con un panel más complejo."),

    h3("A6 — Edición libre de anuncios propios"),
    body("El comerciante puede editar o eliminar sus anuncios en cualquier momento, sin necesidad de aprobación del admin. Los cambios se reflejan inmediatamente en el folleto. Esta libertad acelera el ciclo de iteración del comerciante y reduce la carga operativa del admin."),

    h3("A7 — Sin sistema de reseñas en fase 1"),
    body("No se implementa un sistema de reseñas o calificaciones en esta fase. La reputación del comerciante se infiere de las métricas del anuncio (vistas, likes, compartidos). Las reseñas se agregan en una iteración futura cuando haya suficiente masa crítica de usuarios activos."),
  ];
}

function buildGrupoB() {
  return [
    h1("Grupo B — Reglas del anuncio"),
    body("Este grupo define la estructura del anuncio: cuántos se pueden publicar, cuánto duran, quién elige la categoría, qué estados pueden tener y cómo se renuevan. Afecta directamente el Editor (pantalla de publicación) y el Detalle del anuncio."),

    h2("Resumen de reglas"),
    buildRulesTable([
      ["B1", "Máx. anuncios por comerciante", "5 gratuitos"],
      ["B2", "Duración RestoBares/Kioscos/Tiendas/Servicios", "30 días + botón Republicar"],
      ["B2", "Duración Compra Venta / Anuncios", "5 días + botón Republicar"],
      ["B3", "Categoría", "La elige el comerciante al publicar"],
      ["B4", "Republicación", "Botón Republicar con un click"],
      ["B5", "Variantes", "No (un anuncio = un producto)"],
      ["B6", "Multi-categoría", "No (una categoría por anuncio)"],
      ["B7", "Estados", "ABIERTO / CERRADO / PROMO (3 estados)"],
    ]),

    h2("Detalle de cada regla"),
    h3("B1 — Máximo 5 anuncios gratuitos"),
    body("Cada comerciante puede tener hasta 5 anuncios activos simultáneamente. Esta cantidad cubre la mayoría de los comercios barriales (que suelen tener 2-3 productos principales) y deja espacio para escalar a un modelo freemium en la fase 2. Para publicar un 6to anuncio, el comerciante debe pausar o eliminar uno existente."),

    h3("B2 — Duración diferenciada por categoría"),
    body("Las categorías con productos o servicios más estables duran 30 días: RestoBares & Comidas al paso, Kioscos & Despensas, Tiendas & Comercios, Servicios Profesionales & Oficios. Las categorías de oferta puntual o anuncios puntuales duran 5 días: Compra Venta y Anuncios. Esta diferenciación evita que el folleto se llene de anuncios viejos y mantiene rotación natural en las categorías más dinámicas."),

    h3("B3 — Categoría elegida por el comerciante"),
    body("En el Editor, el comerciante debe seleccionar obligatoriamente una categoría de las seis disponibles. Esta elección define la duración del anuncio (30 o 5 días) y se muestra en el header del detalle del anuncio. No es posible cambiar la categoría después de publicado (debe borrarse y republicarse)."),

    h3("B4 — Botón Republicar"),
    body("Cuando un anuncio está por vencer (3 días antes) o ya venció, el comerciante ve un botón Republicar en su panel y en el detalle del anuncio. Al tocarlo, el anuncio se reinicia con la duración original de su categoría. La acción es inmediata y no requiere aprobación del admin."),

    h3("B5 — Sin variantes del anuncio"),
    body("Cada anuncio es un producto o servicio único. No se implementan variantes (tamaño, color, etc.) en esta fase. Si un comerciante quiere ofrecer un producto en distintas versiones, debe crear anuncios separados. Por ejemplo: Milanesa individual y Milanesa familiar son dos anuncios distintos, contando cada uno dentro del máximo de 5."),

    h3("B6 — Una categoría por anuncio"),
    body("Un anuncio pertenece a una sola categoría. Si un comerciante quiere que su anuncio aparezca en dos categorías (ej: una rotisería que también vende viandas saludables), debe publicar dos anuncios separados. Esta regla simplifica la moderación y mantiene el conteo de anuncios por categoría claro."),

    h3("B7 — Tres estados: ABIERTO, CERRADO, PROMO"),
    body("Los estados posibles de un anuncio son tres, simplificados desde la versión original que tenía cinco (ABIERTO, CERRADO, PROMO, NUEVO, OFERTA). Eliminamos NUEVO y OFERTA porque NUEVO es automático (primeros 7 días) y OFERTA se confunde con PROMO. Los estados se muestran con colores: ABIERTO (verde), CERRADO (coral), PROMO (ámbar)."),
  ];
}

function buildGrupoC() {
  return [
    h1("Grupo C — Visibilidad y alcance"),
    body("Este grupo define qué anuncios ve cada usuario, en qué orden, y cómo se determina la cercanía. Afecta el Home (grilla de categorías con badges de cantidad) y el orden de los anuncios dentro de cada categoría."),

    h2("Resumen de reglas"),
    buildRulesTable([
      ["C1", "Barrio del usuario", "Lo ingresa manualmente al registrarse (barrio + ciudad)"],
      ["C2", "Anuncios visibles", "Todos, ordenados por cercanía"],
      ["C3", "Radio por defecto", "10 cuadras (con slider para ajustar)"],
      ["C4", "Destacados", "Automáticos según métricas (más vistos suben)"],
      ["C5", "Orden por defecto", "Más recientes primero (con opción de cambiar)"],
      ["C6", "Estado NUEVO", "Eliminado (solo ABIERTO/CERRADO/PROMO)"],
    ]),

    h2("Detalle de cada regla"),
    h3("C1 — Barrio ingresado manualmente"),
    body("El usuario ingresa su barrio y ciudad al registrarse. No usamos geolocalización por GPS en esta fase porque requiere permisos del navegador, puede fallar en móviles con configuraciones restrictivas, y complica la primera experiencia. El barrio del usuario se usa para calcular cercanía de los comerciantes."),

    h3("C2 — Todos los anuncios, ordenados por cercanía"),
    body("El usuario ve todos los anuncios publicados, no solo los de su barrio. Esto evita que el folleto se vea vacío en barrios con pocos comerciantes. Sin embargo, el orden por defecto prioriza cercanía: los anuncios más cercanos al usuario aparecen primero."),

    h3("C3 — Radio por defecto de 10 cuadras"),
    body("El sistema calcula la cercanía con un radio por defecto de 10 cuadras (aprox. 1 km). El usuario puede ajustar este radio con un slider en el header de cada categoría: 5, 10, 20, 50 cuadras, o toda la ciudad. A mayor radio, más anuncios pero menos relevantes geográficamente."),

    h3("C4 — Destacados automáticos según métricas"),
    body("Los anuncios se destacan automáticamente cuando superan un umbral de vistas en los últimos 7 días. No hay destacados pagos en esta fase. El comerciante no paga por destacar: el sistema lo hace automáticamente cuando el anuncio tiene tracción. Esto premia el contenido de calidad y desincentiva la compra de visibilidad."),

    h3("C5 — Orden por defecto: más recientes primero"),
    body("El orden por defecto dentro de cada categoría es cronológico inverso: el anuncio más nuevo arriba. El usuario puede cambiar el orden con un selector en el header de la categoría: más cercanos primero, más vistos primero, más likes primero. Esta opción se guarda en localStorage para que persista entre sesiones."),

    h3("C6 — Estado NUEVO eliminado"),
    body("Originalmente teníamos 5 estados: ABIERTO, CERRADO, PROMO, NUEVO, OFERTA. Decidimos simplificar a 3 (ABIERTO, CERRADO, PROMO) porque NUEVO era redundante con el orden por defecto (más recientes primero) y OFERTA se confundía con PROMO. La simplicidad de 3 estados mejora la legibilidad del chip en el header del anuncio."),
  ];
}

function buildGrupoD() {
  return [
    h1("Grupo D — Interacción social"),
    body("Este grupo define cómo interactúan los usuarios con los anuncios: dar me gusta, compartir, llamar, guardar. Afecta directamente el Detalle del anuncio (barra de métricas y botones de acción) y el panel del usuario (lista de favoritos)."),

    h2("Resumen de reglas"),
    buildRulesTable([
      ["D1", "Visibilidad métricas", "Comerciante ve todo, visitante solo ve Me gusta"],
      ["D2", "Me gusta", "Solo registrados, 1 por anuncio por usuario"],
      ["D3", "Compartir", "WhatsApp directo con mensaje prearmado"],
      ["D4", "Llamar", "Modal con el número antes de llamar"],
      ["D5", "WhatsApp", "WhatsApp con mensaje prearmado"],
      ["D6", "Guardar", "Lista de favoritos del usuario"],
      ["D7", "Notificaciones", "Boletín diario por WhatsApp con resumen"],
    ]),

    h2("Detalle de cada regla"),
    h3("D1 — Visibilidad de métricas diferenciada"),
    body("El comerciante ve todas las métricas de su anuncio (vistas, me gusta, compartidos) en su panel de control. El visitante solo ve el contador de Me gusta del anuncio; las vistas y compartidos no son visibles para él. Esto evita que un visitante infiera qué tan popular es un anuncio en base a las vistas (que pueden sesgar su decisión) y protege la privacidad del comerciante."),

    h3("D2 — Me gusta con login, 1 por usuario"),
    body("Para dar me gusta, el usuario debe estar logueado. Cada usuario puede dar me gusta a un anuncio solo una vez (toggle on/off). Esto previene manipulación de las métricas. Si el usuario no está logueado y toca Me gusta, se abre el modal de login OTP por WhatsApp y al confirmar se registra el like automáticamente."),

    h3("D3 — Compartir por WhatsApp con mensaje prearmado"),
    body("El botón Compartir publicación abre directamente WhatsApp con un mensaje prearmado que incluye el título del anuncio y un link al detalle. El usuario puede editar el mensaje antes de enviar. No usamos el menú nativo de compartir del navegador porque WhatsApp es el canal dominante en Argentina y esto reduce un paso."),

    h3("D4 — Llamar con modal de confirmación"),
    body("Al tocar Llamar, se abre un modal que muestra el número de teléfono del comerciante y dos botones: Llamar ahora y Cancelar. Esto previene llamadas accidentales (especialmente importante en mobile donde un tap mal dado puede iniciar una llamada real). El modal también permite copiar el número al portapapeles."),

    h3("D5 — WhatsApp con mensaje prearmado"),
    body("El botón WhatsApp del action row abre WhatsApp Web/App con un mensaje prearmado: Hola, te consulto por el anuncio de [título]. El comerciante recibe el mensaje con contexto claro de qué anuncio se trata. Esto mejora la tasa de respuesta y reduce la fricción para el comprador."),

    h3("D6 — Lista de favoritos"),
    body("El botón Guardar agrega el anuncio a la lista de favoritos del usuario. Esta lista se accede desde el ícono Guardados en la bottom nav. El usuario puede ver sus favoritos, quitarlos de la lista y recibir notificaciones si el anuncio cambia de estado (ej: pasa de ABIERTO a CERRADO) o si se republica. Los favoritos requieren login."),

    h3("D7 — Boletín diario por WhatsApp"),
    body("El comerciante recibe un boletín diario por WhatsApp con un resumen de actividad de sus anuncios: cuántas vistas, likes, compartidos y consultas recibió el día anterior. Este boletín se envía automáticamente a las 9 AM y se puede desactivar desde el panel del comerciante. Las notificaciones push en tiempo real se consideran para la fase 2."),
  ];
}

function buildGrupoE() {
  return [
    h1("Grupo E — Modelo comercial"),
    body("Este grupo define cómo se genera ingresos el producto, qué es gratis y qué es pago, y qué recibe el comerciante a cambio. Las decisiones de esta fase priorizan la adopción y el crecimiento orgánico sobre la monetización inmediata."),

    h2("Resumen de reglas"),
    buildRulesTable([
      ["E1", "Fase 1", "100% gratis 6 meses (adopción)"],
      ["E2", "Después de 6 meses", "Freemium con 5 anuncios gratis"],
      ["E3", "Método de cobro", "Suscripción mensual + boost por anuncio (mixto)"],
      ["E4", "Costo destacado", "$1.000 por 7 días"],
      ["E5", "Visitante", "100% gratis, login solo para like/guardar/publicar"],
      ["E6", "Panel de métricas", "Sí, métricas detalladas para el comerciante"],
    ]),

    h2("Detalle de cada regla"),
    h3("E1 — 100% gratis durante los primeros 6 meses"),
    body("Para fomentar la adopción y conseguir masa crítica de comerciantes, el producto es 100% gratuito durante los primeros 6 meses desde el lanzamiento. No hay límite de anuncios en este periodo (más allá del máximo de 5 simultáneos), no hay cobro por destacar, no hay planes premium. El objetivo es validar el producto y construir una base de comerciantes activos antes de monetizar."),

    h3("E2 — Freemium después de 6 meses"),
    body("Pasados los 6 meses iniciales, se introduce el modelo freemium: el comerciante puede publicar hasta 5 anuncios gratis (igual que antes) y tiene la opción de suscribirse a un plan pago para subir el límite a 20 anuncios, obtener descuentos en destacados y acceso a métricas avanzadas. La transición se comunica con 30 días de anticipación."),

    h3("E3 — Modelo mixto: suscripción + boost"),
    body("El cobro combina dos vías. Primero, una suscripción mensual opcional que desbloquea funcionalidades premium (más anuncios, métricas avanzadas, soporte prioritario). Segundo, un cobro por boost: el comerciante paga por destacar un anuncio específico por 7 días, subiendo en el orden de los resultados. Esto da flexibilidad al comerciante que no quiere suscribirse pero sí quiere dar un impulso puntual a un anuncio."),

    h3("E4 — Costo del boost: $1.000 por 7 días"),
    body("El boost cuesta $1.000 ARS por 7 días de destacado. El comerciante lo compra desde el panel de su anuncio, paga con Mercado Pago, y el anuncio sube al top de los resultados de su categoría durante los 7 días. No hay límite de boosts por anuncio. El precio se ajustará según feedback del mercado después de los primeros 3 meses."),

    h3("E5 — Visitante 100% gratis"),
    body("El visitante (usuario final que ve anuncios) nunca paga. No hay login obligatorio para ver, no hay límite de vistas, no hay anuncios intrusivos. El login solo se pide para acciones sociales (like, guardar, publicar). Esta regla es inmutable y define el producto como una herramienta de acceso libre."),

    h3("E6 — Panel de métricas para el comerciante"),
    body("El comerciante tiene acceso a un panel con métricas detalladas: vistas por día, evolución de likes, comparativa entre anuncios, tasa de conversión (vistas vs consultas recibidas), picos de actividad. Estas métricas se actualizan en tiempo real y se pueden exportar en CSV. El panel es accesible desde el bottom nav (botón Perfil) y es la principal palanca de engagement del comerciante."),
  ];
}

function buildGrupoF() {
  return [
    h1("Grupo F — Moderación y reportes"),
    body("Este grupo define cómo se cuida la calidad del folleto, cómo se previene el abuso y cómo se gestiona el contenido inapropiado. Las reglas combinan moderación automática (filtros) con intervención humana del admin cuando es necesario."),

    h2("Resumen de reglas"),
    buildRulesTable([
      ["F1", "Reportes", "Solo usuarios registrados"],
      ["F2", "Motivos", "Engañoso / Ilegal / Spam / No responde / Lenguaje inapropiado"],
      ["F3", "Auto-ocultamiento", "Después de 3 reportes (hasta revisión)"],
      ["F4", "Acciones admin", "Eliminar, pausar, En revisión, advertir, banear"],
      ["F5", "Reincidentes", "Sistema de strikes (3 = ban temporal; reincidencia = permanente)"],
      ["F6", "Moderación", "Híbrida (verificados automáticos, nuevos = moderación previa primeros 3 anuncios)"],
      ["F7", "Filtros automáticos", "Palabras prohibidas + detección de duplicados"],
      ["F8", "Contacto admin", "Botón Ayuda en el panel del comerciante"],
    ]),

    h2("Detalle de cada regla"),
    h3("F1 — Reportes solo de usuarios registrados"),
    body("Solo los usuarios registrados pueden reportar un anuncio. Esto evita denuncias anónimas maliciosas o automatizadas. El reporte incluye el motivo, un comentario opcional del reportante, y queda registrado en el panel del admin con el ID del usuario que reportó (para detectar patrones de abuso)."),

    h3("F2 — Cinco motivos de reporte"),
    body("Cuando un usuario reporta un anuncio, debe seleccionar uno de cinco motivos: anuncio engañoso (foto no real), producto o servicio ilegal/prohibido, spam o duplicado, comerciante no responde o estafa, lenguaje inapropiado. Estos cinco motivos cubren los casos más comunes y permiten al admin priorizar la revisión. El motivo se guarda en el historial del anuncio."),

    h3("F3 — Auto-ocultamiento tras 3 reportes"),
    body("Cuando un anuncio recibe 3 reportes de distintos usuarios registrados, se oculta automáticamente del folleto (sigue visible para el comerciante en su panel, con un badge Reportado). El admin recibe una notificación para revisarlo en las próximas 24 horas. Si el admin lo aprueba, se vuelve a mostrar y los reportes se descartan. Si lo elimina, se notifica al comerciante con el motivo."),

    h3("F4 — Cinco acciones del admin"),
    body("El admin tiene cinco acciones posibles sobre un anuncio reportado: eliminarlo (sin aviso previo al comerciante), pausarlo (el comerciante lo puede editar y republicar), marcarlo como En revisión (sigue visible pero con un badge amarillo), enviar advertencia al comerciante, o banear al comerciante (si es reincidente). Cada acción queda registrada con timestamp y motivo en el historial."),

    h3("F5 — Sistema de strikes"),
    body("Cada anuncio eliminado por el admin suma un strike al comerciante. Tres strikes en 90 días resultan en un ban temporal de 30 días (no puede publicar ni editar). Si el comerciante reincide después del ban temporal, se aplica ban permanente. Los strikes se reinician después de 6 meses sin infracciones. Este sistema da margen para errores honestos pero sanciona el abuso sistemático."),

    h3("F6 — Moderación híbrida"),
    body("La moderación combina dos enfoques. Para comerciantes verificados (más de 3 anuncios publicados sin reportes), los nuevos anuncios se publican automáticamente sin revisión previa. Para comerciantes nuevos (menos de 3 anuncios), los primeros 3 anuncios pasan por moderación previa del admin antes de aparecer públicamente. Esto reduce la fricción para comerciantes establecidos y protege el folleto de cuentas recién creadas con malas intenciones."),

    h3("F7 — Filtros automáticos"),
    body("El sistema aplica dos filtros automáticos al momento de publicar. Primero, un filtro de palabras prohibidas (lista configurable: insultos, drogas, servicios ilegales, etc.) que bloquea la publicación y muestra un mensaje pidiendo al comerciante que corrija el texto. Segundo, una detección de duplicados: si el comerciante intenta publicar un anuncio con el mismo título y descripción que otro ya existente suyo, se bloquea con un mensaje sugiriendo editar el existente."),

    h3("F8 — Botón Ayuda en el panel"),
    body("El comerciante tiene un botón Ayuda en su panel que abre un chat directo con el admin. Las consultas se canalizan por WhatsApp (número del admin) con un mensaje prearmado que incluye el ID del comerciante. Esto da un canal de comunicación directo para resolver dudas, pedir aclaraciones sobre moderación, o reportar problemas técnicos sin tener que usar el sistema de reportes públicos."),
  ];
}

function buildImplementacion() {
  return [
    h1("Próximos pasos — Implementación"),
    body("Con las reglas de negocio confirmadas en este documento, el siguiente paso es implementar el backend y las pantallas faltantes. El orden recomendado respeta las dependencias entre componentes."),

    h2("Fase 1 — Persistencia (1-2 días)"),
    bullet("Configurar Prisma schema con modelos: Comerciante, Anuncio, Categoria, Reporte, Like, Guardado, Vista"),
    bullet("Crear migración inicial con SQLite para desarrollo"),
    bullet("Seed con los 6 comerciantes y 24 anuncios mock ya cargados"),
    bullet("API routes CRUD para anuncios y comerciantes"),

    h2("Fase 2 — Login OTP por WhatsApp (2-3 días)"),
    bullet("Integrar Twilio o WhatsApp Business API para enviar OTP"),
    bullet("Pantalla de login: input de WhatsApp + botón Enviar código"),
    bullet("Pantalla de verificación OTP (6 dígitos, expira 5 min)"),
    bullet("NextAuth.js con estrategia OTP (sin contraseña)"),
    bullet("Persistencia de sesión con cookies HTTP-only"),

    h2("Fase 3 — Pantalla de Registro (1 día)"),
    bullet("Formulario de alta de comerciante (4 campos obligatorios)"),
    bullet("Validación de barrio contra lista predefinida de CABA"),
    bullet("Integración con el login OTP existente"),

    h2("Fase 4 — Editor funcional (1-2 días)"),
    bullet("Conectar el Editor actual con la base de datos"),
    bullet("Selector de categoría obligatorio (dropdown con las 6 opciones)"),
    bullet("Validación automática de palabras prohibidas en el backend"),
    bullet("Detección de duplicados por comerciante"),
    bullet("Al publicar: calcular fecha de vencimiento según categoría"),

    h2("Fase 5 — Panel del comerciante (2 días)"),
    bullet("Pantalla Mis anuncios (lista con contador de días restantes)"),
    bullet("Botón Republicar en anuncios por vencer o vencidos"),
    bullet("Botón Editar y Eliminar en cada anuncio propio"),
    bullet("Métricas detalladas por anuncio (vistas, likes, compartidos por día)"),
    bullet("Botón Ayuda que abre WhatsApp con el admin"),

    h2("Fase 6 — Moderación admin (2 días)"),
    bullet("Pantalla de admin con lista de anuncios reportados"),
    bullet("Cinco acciones: eliminar, pausar, marcar En revisión, advertir, banear"),
    bullet("Sistema de strikes automático"),
    bullet("Filtro automático de palabras prohibidas (configurable)"),
    bullet("Detección de duplicados cross-comerciante"),

    h2("Fase 7 — Métricas y notificaciones (1-2 días)"),
    bullet("Cron job diario: boletín por WhatsApp a comerciantes con actividad"),
    bullet("Tracking de vistas (con middleware en API de detalle)"),
    bullet("Tracking de likes con UNIQUE constraint en (userId, anuncioId)"),
    bullet("Tracking de compartidos con auto-incremento en cada click"),

    h2("Resumen de tiempos"),
    bulletKV("Total estimado", "10-14 días de desarrollo"),
    bulletKV("Próximo hito", "Fase 1 + 2 (persistencia + login)"),
    bulletKV("Revisiónes", "Cada 2 fases con el usuario"),
  ];
}

// ============================================================
// ENSAMBLAJE FINAL
// ============================================================

const allContent = [
  ...buildResumenEjecutivo(),
  ...buildGrupoA(),
  ...buildGrupoB(),
  ...buildGrupoC(),
  ...buildGrupoD(),
  ...buildGrupoE(),
  ...buildGrupoF(),
  ...buildImplementacion(),
];

const doc = new Document({
  creator: "Z.ai",
  title: "Folleto Clasificados — Reglas de Negocio",
  description: "Especificación funcional del producto mobile-first.",
  styles: {
    default: {
      document: {
        run: {
          font: { ascii: "Calibri", eastAsia: "Calibri" },
          size: 22,
          color: c(P.body),
        },
        paragraph: { spacing: { line: 312 } },
      },
    },
  },
  sections: [
    // Sección 1: Cover (sin márgenes, sin header/footer)
    {
      properties: {
        page: { margin: { top: 0, bottom: 0, left: 0, right: 0 } },
      },
      children: buildCover(),
    },
    // Sección 2: Body (con márgenes estándar, footer con número de página)
    {
      properties: {
        page: {
          margin: { top: 1440, bottom: 1440, left: 1417, right: 1417 },
          pageNumbers: { start: 1 },
        },
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  children: [PageNumber.CURRENT],
                  size: 18,
                  color: c(P.muted),
                  font: { ascii: "Calibri", eastAsia: "Calibri" },
                }),
              ],
            }),
          ],
        }),
      },
      children: allContent,
    },
  ],
});

const outputPath = "/home/z/my-project/download/folleto_clasificados_reglas_negocio.docx";
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(outputPath, buf);
  console.log(`✅ Documento generado: ${outputPath}`);
  console.log(`   Tamaño: ${(buf.length / 1024).toFixed(2)} KB`);
});

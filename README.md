# Creador de carruseles

Replica un carrusel de Instagram slide por slide y lo adapta a tu marca: traduce el texto, cambia la arroba y el color de acento, y reemplaza el avatar del autor por uno con tu cara. Mantiene el layout, la tipografía y la composición del original.

Usa GPT Image 2 a través de la API de [KIE](https://kie.ai) y está pensado para usarse con [Claude Code](https://claude.com/claude-code), que analiza los slides y escribe el guion de traducción.

## Requisitos

- Node.js 20.11 o superior
- Una cuenta en KIE con créditos y su API key
- macOS para el redimensionado final a 1080×1350 (usa `sips`). En otros sistemas el script funciona igual, pero deja la imagen en el tamaño que devuelve el modelo.

## Configuración

1. Guarda tu API key de KIE en `~/.config/kie/.env`:

   ```
   KIE_API_KEY=tu_key
   ```

2. Copia la plantilla de marca y complétala:

   ```bash
   cp marca/marca.ejemplo.json marca/marca.json
   ```

   | Campo | Qué es |
   |---|---|
   | `instagram` | Tu arroba, que reemplaza a la del autor original |
   | `color_acento` | Tu color de marca |
   | `idioma` | Idioma al que se traduce el carrusel |
   | `rasgos` | Descripción breve de tu cara, para que el avatar se te parezca |
   | `ropa` | Ropa del avatar |

3. Pon de 1 a 5 fotos de tu cara en `marca/fotos/cara/`: de frente, con buena luz y sin filtros.

## Uso con Claude Code

Abre la carpeta en Claude Code y pásale los slides del carrusel que quieres replicar. Claude sigue el flujo de `CLAUDE.md`: ordena los slides, escribe el guion, genera las imágenes y las revisa contra el original.

## Uso manual

1. Guarda los slides en orden en `inspiracion/<nombre>/original/` como `slide_01.jpg`, `slide_02.jpg`, etc.
2. Escribe `inspiracion/<nombre>/guion.json` a partir de [`ejemplos/guion.ejemplo.json`](ejemplos/guion.ejemplo.json).
3. Genera primero el slide 1, que queda como referencia del avatar para los demás:

   ```bash
   node scripts/replicar.mjs inspiracion/<nombre> --slides 1 --res 1K
   ```

4. Genera el resto:

   ```bash
   node scripts/replicar.mjs inspiracion/<nombre> --slides 2,3,4,5 --res 1K
   ```

Los resultados quedan en `salida/<nombre>/` y las versiones sin redimensionar en `salida/<nombre>/hd/`.

### Opciones

| Opción | Valor por defecto | Descripción |
|---|---|---|
| `--slides` | todos | Números de slide a generar, separados por coma |
| `--model` | `gpt-image-2-image-to-image` | Modelo de KIE |
| `--res` | `2K` | `1K`, `2K` o `4K`. Con formato 4:5, GPT Image 2 solo acepta `1K` o `4K` |

## Costo

En la prueba inicial cada slide en 1K costó 6 créditos de KIE. El script muestra los créditos antes y después de cada ejecución.

## Privacidad

- Tus fotos y los slides originales se suben a los servidores de KIE para generar las imágenes. KIE borra esos archivos a los 3 días.
- `marca/marca.json`, `marca/fotos/`, `inspiracion/` y `salida/` están en `.gitignore`, así que tus datos no se suben si haces un fork.

## Uso responsable

Los carruseles que repliques son obra de sus autores. Úsalo como base para tu propio contenido y respeta los derechos de autor y las normas de Instagram.

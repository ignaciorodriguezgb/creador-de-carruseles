# Creador de carruseles

Replica carruseles de Instagram slide por slide, adaptados a la marca del usuario. Las reglas de fidelidad están en `docs/reglas.md`: léelas antes de replicar.

## Flujo cuando el usuario pasa un carrusel

1. Crea `inspiracion/<nombre>/original/` y guarda ahí los slides en orden como `slide_01.jpg`, `slide_02.jpg`, etc. Mira cada imagen para confirmar el orden real; no te fíes del nombre de archivo.
2. Escribe `inspiracion/<nombre>/guion.json` siguiendo `ejemplos/guion.ejemplo.json`:
   - `textos`: cada bloque de texto editorial con su traducción, de longitud parecida.
   - `mantener`: textos técnicos que no se traducen (nombres de archivos, productos, comandos).
   - `footer`: textos repetidos en todos los slides. Usa `{{instagram}}` para la arroba de la marca.
   - `estilo_avatar` y `acento_original`: cómo es el avatar del autor y qué color de acento usa el original.
3. Genera primero el slide 1 solo: `node scripts/replicar.mjs inspiracion/<nombre> --slides 1 --res 1K`. Revísalo. Ese slide queda como referencia del avatar para los demás.
4. Genera el resto: `node scripts/replicar.mjs inspiracion/<nombre> --slides 2,3,... --res 1K`.
5. Mira cada resultado contra su original con la lista de control de `docs/reglas.md` y regenera los que fallen.

## Datos a tener en cuenta

- Cada imagen gasta créditos de KIE. Avisa del costo antes de generar un carrusel completo.
- `gpt-image-2-image-to-image` no acepta 4:5 en 2K: usa `1K` o `4K`.
- Las fotos de `marca/fotos/cara/` se suben a KIE para generar, y KIE las borra a los 3 días.
- Nunca leas ni muestres la API key (`~/.config/kie/.env`).
- `marca/marca.json`, `marca/fotos/`, `inspiracion/` y `salida/` son datos privados del usuario y están en `.gitignore`. No los subas al repositorio.

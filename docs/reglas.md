# Reglas de réplica

El objetivo no es "inspirarse" en un carrusel: es hacer una **versión localizada de la misma pieza**. Quien vea el original y la adaptación tiene que pensar: "es el mismo carrusel, pero en mi idioma y con mi marca".

## Qué se mantiene

- La cantidad de slides y su orden. Si hay 6, se entregan 6.
- Cada slide como imagen independiente. Nunca un collage.
- Layout, posiciones, jerarquía, proporciones, tipografías y fondo.
- La cantidad de elementos: no se agregan ni se quitan bloques.
- El concepto y la narrativa.

## Qué se cambia

| Elemento | Regla |
|---|---|
| Idioma | Se traduce todo el copy editorial: titulares, subtítulos, notas manuscritas, CTA, footer. |
| Arroba | La del autor original se reemplaza por la de `marca.json`. |
| Color de acento | Se reemplaza por el de la marca, conservando contraste y jerarquía. Si el original es claro, sigue siendo claro. |
| Avatar del autor | Se reemplaza por un avatar del usuario en el mismo estilo (pixel art, foto, 3D, ilustración). |

## Traducción

- Fiel, natural y de longitud parecida al original, para que entre en el mismo espacio.
- **No se traducen**: nombres de productos y marcas, términos técnicos (API, workflow), nombres de archivos y carpetas, comandos, código ni URLs. Van en el campo `mantener` del guion.
- El CTA conserva su lógica y su palabra clave: `COMMENT "SKILLS"` pasa a `COMENTA "SKILLS"`.

## Personas

Se reemplaza por el usuario **solo** a quien representa al autor del carrusel: su foto, su avatar o su mascota de marca.

No se reemplaza a las personas que son parte del contenido: referentes citados, famosos, clientes, personajes históricos. Tampoco a robots, mascotas u objetos.

## Control de calidad

Antes de dar por terminado un carrusel:

- [ ] Número y orden de slides correctos
- [ ] No quedó texto en el idioma original por accidente
- [ ] Términos técnicos y código sin modificar
- [ ] Sin faltas de ortografía ni texto cortado
- [ ] Arroba correcta en todos los footers; no aparece la del autor original
- [ ] Avatar consistente entre slides y en la pose del original
- [ ] Misma composición y mismo número de elementos que el original

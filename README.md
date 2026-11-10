# 5 clases en programación

Juego de terror estilo FNAF 1 hecho con HTML, Tailwind (CDN), CSS y JavaScript.
Autor: Javier Colque

## Cómo ejecutarlo
Abre la carpeta con **Live Server** (VS Code) o cualquier servidor local.
Si abres `index.html` con doble clic (file://) todo funciona, pero el navegador
bloquea el recorte automático del fondo negro de los animatrónicos.

## Estructura
```
index.html
static/
  css/style.css
  js/script.js       <- juego principal
  js/minigames.js    <- mini-juegos
  images/            <- oficina.jpg, camara1-6.jpg, freddy/bonnie/chica/foxy.png,
                        *Screamer.png, fondoFnaf.(png|jpg)
```

## Personajes
Ariel (freddy) · Vicente (bonnie) · Fernando (chica) · Alan (foxy)

## Cámaras
1 Salida · 2 Computadores · 3 Sillas del fondo (Alan) · 4 Pasillo · 5 PC del profesor · 6 Pizarrón

## Controles
- Mouse a los lados: girar la oficina
- Barra inferior (hover) o Espacio: abrir/cerrar monitor
- Esc: pausa · H: bocina de Ariel

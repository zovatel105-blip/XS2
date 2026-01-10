"""
Constants for VotaTok Backend
Contains all valid configurations and constants used across the application
"""

# Valid layout types for polls/posts
VALID_LAYOUTS = [
    'off',                  # Pantalla Completa (Carrusel) - Multiple images in fullscreen
    'vertical',             # Lado a lado - Screen split in 2 parts side by side
    'horizontal',           # Arriba y abajo - Screen split in 2 parts top and bottom
    'triptych-vertical',    # Triptych lado a lado - Screen split in 3 parts side by side
    'triptych-horizontal',  # Triptych arriba y abajo - Screen split in 3 parts top and bottom
    'grid-2x2',            # Grid 2x2 - Screen split in 4 parts (2x2 grid)
    'grid-3x2',            # Grid 3x2 - Screen split in 6 parts (3x2 grid)
    'horizontal-3x2',      # Grid 2x3 - Screen split in 6 parts (2x3 grid)
    'moment',              # Momento - Single image post with voting
]

# Layout descriptions for documentation
LAYOUT_DESCRIPTIONS = {
    'off': 'Múltiples imágenes en pantalla completa (mínimo 2)',
    'vertical': 'Pantalla dividida en 2 partes lado a lado',
    'horizontal': 'Pantalla dividida en 2 partes arriba y abajo',
    'triptych-vertical': 'Pantalla dividida en 3 partes lado a lado',
    'triptych-horizontal': 'Pantalla dividida en 3 partes arriba y abajo',
    'grid-2x2': 'Pantalla dividida en 4 partes (cuadrícula de 2x2)',
    'grid-3x2': 'Pantalla dividida en 6 partes (cuadrícula de 3x2)',
    'horizontal-3x2': 'Pantalla dividida en 6 partes (cuadrícula de 2x3)',
    'moment': 'Imagen única con votación (Momento)',
}

# Default layout if none specified
DEFAULT_LAYOUT = 'off'

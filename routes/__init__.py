"""
API routes for the maps application.
"""

from .projects import projects_bp
from .map_areas import map_areas_bp
from .boundaries import boundaries_bp
from .layers import layers_bp
from .annotations import annotations_bp
from .exports import exports_bp

__all__ = [
    'projects_bp',
    'map_areas_bp',
    'boundaries_bp',
    'layers_bp',
    'annotations_bp',
    'exports_bp'
]

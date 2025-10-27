"""
Module: backend.export_service

Export service for generating map images.

Classes:
    ExportService:
        Service class for exporting maps as images.
"""


# Standard library imports
from typing import (
    Optional,
    Dict,
    Any
)
from datetime import (
    datetime,
    timezone
)
import os
import base64


class ExportService:
    """
    Service class for exporting maps as images.

    Methods:
        __init__:
            Initialize ExportService
        export_map:
            Export a map as PNG
        get_export_path:
            Get the file path for an export
    """

    def __init__(
        self,
        export_folder: str
    ) -> None:
        """
        Initialize the ExportService.

        Args:
            export_folder (str): Directory for export files

        Returns:
            None
        """

        # Initialize export folder
        self.export_folder = export_folder
        if not os.path.exists(self.export_folder):
            os.makedirs(self.export_folder)

    def export_map(
        self,
        map_id: int,
        image_data: str,
        filename: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Export a map as PNG from base64 image data.

        Args:
            map_id (int): Map ID
            image_data (str): Base64 encoded PNG data
            filename (Optional[str]): Custom filename

        Returns:
            Dict[str, Any]: Export result with file path
        """

        # Automatically generate filename if not provided
        if filename is None:
            timestamp = datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')
            filename = f"map_{map_id}_{timestamp}.png"

        # Remove data URL prefix if present
        if ',' in image_data:
            image_data = image_data.split(',', 1)[1]

        # Construct full file path
        filepath = os.path.join(self.export_folder, filename)

        # Decode base64 and write to file
        try:
            image_bytes = base64.b64decode(image_data)

            # Write image bytes to file
            with open(filepath, 'wb') as f:
                f.write(image_bytes)

            return {
                'success': True,
                'filename': filename,
                'filepath': filepath,
                'size': len(image_bytes)
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def get_export_path(
        self,
        filename: str
    ) -> Optional[str]:
        """
        Get the full file path for an export.

        Args:
            filename (str): Export filename

        Returns:
            Optional[str]: Full file path if exists, None otherwise
        """

        # Construct full file path
        filepath = os.path.join(self.export_folder, filename)

        # Check if file exists
        if os.path.exists(filepath):
            return filepath

        return None

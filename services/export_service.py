"""
Export service for generating map images.
"""

from typing import Optional, Dict, Any
import os
import base64
from datetime import datetime


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
        cleanup_old_exports:
            Remove old export files
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
        
        self.export_folder = export_folder
        self._ensure_directory()

    def _ensure_directory(self) -> None:
        """
        Ensure the export directory exists.
        
        Returns:
            None
        """
        
        if not os.path.exists(self.export_folder):
            os.makedirs(self.export_folder)

    def export_map(
        self,
        map_area_id: int,
        image_data: str,
        filename: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Export a map as PNG from base64 image data.
        
        Args:
            map_area_id (int): Map area ID
            image_data (str): Base64 encoded PNG data
            filename (Optional[str]): Custom filename
        
        Returns:
            Dict[str, Any]: Export result with file path
        """
        
        if filename is None:
            timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
            filename = f"map_{map_area_id}_{timestamp}.png"
        
        # Remove data URL prefix if present
        if ',' in image_data:
            image_data = image_data.split(',', 1)[1]
        
        filepath = os.path.join(self.export_folder, filename)
        
        try:
            image_bytes = base64.b64decode(image_data)
            
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
        
        filepath = os.path.join(self.export_folder, filename)
        
        if os.path.exists(filepath):
            return filepath
        
        return None

    def cleanup_old_exports(
        self,
        days: int = 7
    ) -> int:
        """
        Remove export files older than specified days.
        
        Args:
            days (int): Age threshold in days
        
        Returns:
            int: Number of files deleted
        """
        
        if not os.path.exists(self.export_folder):
            return 0
        
        cutoff_time = datetime.utcnow().timestamp() - (days * 86400)
        deleted_count = 0
        
        for filename in os.listdir(self.export_folder):
            filepath = os.path.join(self.export_folder, filename)
            
            if os.path.isfile(filepath):
                file_time = os.path.getmtime(filepath)
                
                if file_time < cutoff_time:
                    try:
                        os.remove(filepath)
                        deleted_count += 1
                    except OSError:
                        pass
        
        return deleted_count

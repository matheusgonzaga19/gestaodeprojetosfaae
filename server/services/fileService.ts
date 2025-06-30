import { promises as fs } from 'fs';
import path from 'path';
import type { Response } from 'express';
import { storage } from '../storage';
import type { File, InsertFile } from '@shared/schema';

interface FileUploadData {
  taskId?: number;
  projectId?: number;
  uploadedUserId: string;
}

class FileService {
  private uploadsDir = path.join(process.cwd(), 'uploads');

  constructor() {
    this.ensureUploadsDir();
  }

  private async ensureUploadsDir(): Promise<void> {
    try {
      await fs.access(this.uploadsDir);
    } catch {
      await fs.mkdir(this.uploadsDir, { recursive: true });
    }
  }

  async saveFile(
    file: Express.Multer.File,
    metadata: FileUploadData
  ): Promise<File> {
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const extension = path.extname(file.originalname);
      const filename = `${timestamp}-${Math.random().toString(36).substring(2)}${extension}`;
      const filePath = path.join(this.uploadsDir, filename);

      // Move file to permanent location
      await fs.rename(file.path, filePath);

      // Save file metadata to database
      const fileData: InsertFile = {
        filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: filePath,
        taskId: metadata.taskId,
        projectId: metadata.projectId,
        uploadedUserId: metadata.uploadedUserId,
      };

      const savedFile = await storage.uploadFile(fileData);
      return savedFile;
    } catch (error) {
      // Clean up file if database save fails
      try {
        await fs.unlink(file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
      throw error;
    }
  }

  async downloadFile(file: File, res: Response): Promise<void> {
    try {
      // Check if file exists
      await fs.access(file.path);

      // Set appropriate headers
      res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Length', file.size.toString());

      // Stream file to response
      const fileStream = await fs.readFile(file.path);
      res.send(fileStream);
    } catch (error) {
      console.error('Error downloading file:', error);
      res.status(404).json({ message: 'File not found' });
    }
  }

  async deleteFile(file: File): Promise<void> {
    try {
      // Delete from filesystem
      await fs.unlink(file.path);
      
      // Delete from database
      await storage.deleteFile(file.id);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  async getFilePreview(file: File): Promise<{
    isImage: boolean;
    isPDF: boolean;
    isCAD: boolean;
    thumbnail?: string;
  }> {
    const isImage = file.mimeType.startsWith('image/');
    const isPDF = file.mimeType === 'application/pdf';
    const isCAD = file.mimeType.includes('dwg') || 
                  file.mimeType.includes('autocad') ||
                  file.originalName.toLowerCase().endsWith('.dwg');

    const result = {
      isImage,
      isPDF,
      isCAD,
      thumbnail: undefined as string | undefined,
    };

    // For images, we could generate thumbnails here in the future
    // For now, we'll just return the metadata

    return result;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileIcon(mimeType: string, fileName: string): string {
    if (mimeType.startsWith('image/')) {
      return 'fas fa-image';
    } else if (mimeType === 'application/pdf') {
      return 'fas fa-file-pdf';
    } else if (mimeType.includes('dwg') || fileName.toLowerCase().endsWith('.dwg')) {
      return 'fas fa-drafting-compass';
    } else if (mimeType.includes('word') || fileName.toLowerCase().endsWith('.doc') || fileName.toLowerCase().endsWith('.docx')) {
      return 'fas fa-file-word';
    } else if (mimeType.includes('excel') || fileName.toLowerCase().endsWith('.xls') || fileName.toLowerCase().endsWith('.xlsx')) {
      return 'fas fa-file-excel';
    } else if (mimeType.includes('powerpoint') || fileName.toLowerCase().endsWith('.ppt') || fileName.toLowerCase().endsWith('.pptx')) {
      return 'fas fa-file-powerpoint';
    } else if (mimeType.startsWith('video/')) {
      return 'fas fa-file-video';
    } else if (mimeType.startsWith('audio/')) {
      return 'fas fa-file-audio';
    } else if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) {
      return 'fas fa-file-archive';
    } else {
      return 'fas fa-file';
    }
  }
}

export const fileService = new FileService();

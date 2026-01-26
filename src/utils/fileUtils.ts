import heic2any from 'heic2any';

export const getMimeType = (filename: string, fallback: string = 'image/jpeg'): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'heic': 'image/heic',
    'heif': 'image/heif',
  };
  return (ext && mimeTypes[ext]) || fallback;
};

export const convertHeicToJpeg = async (file: File): Promise<File> => {
  const isHeic = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif') || file.type === 'image/heic' || file.type === 'image/heif';
  
  if (!isHeic) return file;

  try {
    const blob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.8
    });
    
    const resultBlob = Array.isArray(blob) ? blob[0] : blob;
    const newFilename = file.name.replace(/\.(heic|heif)$/i, '.jpg');
    
    return new File([resultBlob], newFilename, { type: 'image/jpeg' });
  } catch (error) {
    console.error('HEIC conversion failed, falling back to original file:', error);
    return file;
  }
};

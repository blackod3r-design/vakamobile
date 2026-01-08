import { supabase } from '../supabase';

/**
 * Sube un archivo a Supabase Storage y devuelve la URL pública.
 * @param file El archivo seleccionado por el usuario (File object)
 * @param bucket El nombre del bucket (por defecto 'images')
 */
export const uploadImage = async (file: File, bucket: string = 'images'): Promise<string | null> => {
  try {
    // 1. Crear un nombre único usando la fecha y un número aleatorio (Sin librerías extra)
    const fileExt = file.name.split('.').pop();
    const uniqueId = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const fileName = `${uniqueId}.${fileExt}`;
    const filePath = `${fileName}`;

    // 2. Subir el archivo
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error subiendo imagen:', uploadError);
      return null;
    }

    // 3. Obtener la URL pública para guardarla en la base de datos
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Error en el proceso de subida:', error);
    return null;
  }
};
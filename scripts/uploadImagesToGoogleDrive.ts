import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { storage } from "./firebaseConfig";

const uploadToFirebase = async (
  imageUri: string,
  index?: number
): Promise<string | null> => {
  try {
    console.log(`🚀 Iniciando upload para: ${imageUri}`);

    const unique =
      `${Date.now()}_${index ?? "x"}_${Math.random().toString(16).slice(2)}`;
    const fileName = `imagem_${unique}.jpg`;

    const storageRef = ref(storage, `uploads/${fileName}`);

    const response = await fetch(imageUri);
    const blob = await response.blob();

    const uploadTask = uploadBytesResumable(storageRef, blob, {
      contentType: "image/jpeg",
    });

    return await new Promise((resolve) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`📤 Upload de ${fileName}: ${progress.toFixed(2)}%`);
        },
        (error) => {
          console.error(`❌ Erro no upload de ${fileName}:`, error);
          resolve(null);
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            console.log(`✅ Upload concluído: ${downloadUrl}`);
            resolve(downloadUrl);
          } catch (e) {
            console.error("❌ Erro ao obter downloadURL:", e);
            resolve(null);
          }
        }
      );
    });
  } catch (error) {
    console.error("❌ Erro ao fazer upload para o Firebase:", error);
    return null;
  }
};

export default uploadToFirebase;
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { storage } from "./firebaseConfig";

const uploadToFirebase = async (imageUri: string): Promise<string | null> => {
  try {
    console.log(`🚀 Iniciando upload para: ${imageUri}`);

    const fileName = `imagem_${Date.now()}.jpg`;
    const storageRef = ref(storage, `uploads/${fileName}`);

    // 🔹 Converte a imagem para Blob corretamente
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // 🔹 Faz o upload com progresso
    const uploadTask = uploadBytesResumable(storageRef, blob, { contentType: "image/jpeg" });

    await new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`📤 Upload de ${fileName}: ${progress.toFixed(2)}%`);
        },
        (error) => {
          console.error(`❌ Erro no upload de ${fileName}:`, error);
          reject(error);
        },
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          console.log(`✅ Upload concluído: ${downloadUrl}`);
          resolve(downloadUrl);
        }
      );
    });

    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error("❌ Erro ao fazer upload para o Firebase:", error);
    return null;
  }
};

export default uploadToFirebase;

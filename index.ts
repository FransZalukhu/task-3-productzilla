import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

const algorithm = "aes-256-cbc";
const ivLength = 16;
const logDir = "logs"; // Direktori untuk menyimpan file log

async function log(message: string): Promise<void> {
  const now = new Date();
  const logFile = `${now.getHours()}_${now.getMinutes()}_${now.getSeconds()}_${
    now.getMonth() + 1
  }_${now.getDate()}_${now.getFullYear()}.log`;
  const logPath = path.join(logDir, logFile);

  // Buat direktori logs jika belum ada
  try {
    await fs.mkdir(logDir, { recursive: true });
  } catch (error) {
    // Abaikan error jika direktori sudah ada
  }

  await fs.appendFile(logPath, `${message}\n`);
}

async function encrypt(inputPath: string, password: string): Promise<void> {
  try {
    const content = await fs.readFile(inputPath);
    const key = crypto.scryptSync(password, "salt", 32);
    const iv = crypto.randomBytes(ivLength);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const encrypted = Buffer.concat([
      iv,
      cipher.update(content),
      cipher.final(),
    ]);

    const outputPath = inputPath.replace(".txt", "_encrypted.txt");
    await fs.writeFile(outputPath, encrypted);
    console.log(`File berhasil dienkripsi: ${outputPath}`);
  } catch (error) {
    const errorMessage = (error as Error).message || "Error tidak diketahui";
    console.error(`Error: ${errorMessage}`);
    await log(`Error: ${errorMessage}`);
  }
}

async function decrypt(inputPath: string, password: string): Promise<void> {
  try {
    const content = await fs.readFile(inputPath);
    const key = crypto.scryptSync(password, "salt", 32);
    const iv = content.subarray(0, ivLength);
    const encryptedContent = content.subarray(ivLength);

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    const decrypted = Buffer.concat([
      decipher.update(encryptedContent),
      decipher.final(),
    ]);

    const outputPath = inputPath.replace("_encrypted.txt", ".txt");
    await fs.writeFile(outputPath, decrypted);
    console.log(`File berhasil didekripsi: ${outputPath}`);
  } catch (error) {
    throw new Error("Password salah atau file rusak");
  }
}

async function main() {
  const [action, filePath, password] = process.argv.slice(2);

  if (!action || !filePath || !password) {
    console.error(
      "Penggunaan: ts-node index.ts <encrypt|decrypt> <filePath> <password>"
    );
    process.exit(1);
  }

  try {
    await log(`Mulai ${action} file ${filePath}`);
    if (action === "encrypt") {
      await encrypt(filePath, password);
    } else if (action === "decrypt") {
      await decrypt(filePath, password);
    } else {
      throw new Error('Perintah tidak valid. Gunakan "encrypt" atau "decrypt"');
    }
    await log(`Selesai ${action} file ${filePath}`);
  } catch (error: any) {
    const errorMessage =
      error instanceof Error ? error.message : "Error tidak diketahui";
    console.error(`Error: ${errorMessage}`);
    await log(`Error: ${errorMessage}`);
  }
}

main();

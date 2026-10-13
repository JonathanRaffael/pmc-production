import "dotenv/config";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

async function main() {
  const connection = await mysql.createConnection({
    uri: process.env.DATABASE_URL,
  });

  try {
    const adminPassword = await bcrypt.hash("ADMINHTMF@@", 12);
    const userPassword = await bcrypt.hash("USERHTMF@@", 12);

    await connection.execute(
      `
      INSERT INTO User
        (name, email, passwordHash, role, isActive, createdAt, updatedAt)
      VALUES
        (?, ?, ?, 'ADMIN', 1, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        passwordHash = VALUES(passwordHash),
        role = 'ADMIN',
        isActive = 1,
        updatedAt = NOW()
      `,
      [
        "Administrator",
        "admin@htm.com",
        adminPassword,
      ]
    );

    await connection.execute(
      `
      INSERT INTO User
        (name, email, passwordHash, role, isActive, createdAt, updatedAt)
      VALUES
        (?, ?, ?, 'USER', 1, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        passwordHash = VALUES(passwordHash),
        role = 'USER',
        isActive = 1,
        updatedAt = NOW()
      `,
      [
        "PMC User",
        "user@htm.com",
        userPassword,
      ]
    );

    console.log("");
    console.log("=================================");
    console.log("PMC SEED BERHASIL");
    console.log("=================================");
    console.log("ADMIN");
    console.log("Email    : admin@htm.com");
    console.log("Password : ADMINHTMF@@");
    console.log("---------------------------------");
    console.log("USER");
    console.log("Email    : user@htm.com");
    console.log("Password : USERHTMF@@");
    console.log("=================================");
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error("Seed error:", error);
  process.exit(1);
});     
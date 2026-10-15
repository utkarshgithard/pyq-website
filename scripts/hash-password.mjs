import bcrypt from "bcryptjs";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const terminal = createInterface({ input: stdin, output: stdout });
const password = await terminal.question("Admin password: ");
terminal.close();

if (password.length < 12) {
  console.error("Use a password with at least 12 characters.");
  process.exitCode = 1;
} else {
  console.log(await bcrypt.hash(password, 12));
}

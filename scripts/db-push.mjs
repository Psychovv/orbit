/**
 * `drizzle-kit push` seguro para o build de produção.
 *
 * Sem `--force`: mudanças que apagam dados (remover coluna/tabela, truncar) pedem confirmação,
 * e fora de um terminal o drizzle-kit recusa e não aplica nada. Só que ele sai com código 0
 * nesse caso, e o deploy seguiria com o schema desatualizado. Aqui o build falha quando a saída
 * traz erro, para a mudança destrutiva ser revisada e aplicada à mão.
 */
import { spawnSync } from "node:child_process";

const result = spawnSync("drizzle-kit", ["push", ...process.argv.slice(2)], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
  shell: process.platform === "win32",
});

const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
process.stdout.write(output);

if (result.error || result.status !== 0 || /\berror\b/i.test(output)) {
  console.error(
    "\n[db-push] drizzle-kit push não aplicou o schema. Se a mudança apaga dados, revise e rode " +
      "`pnpm db:push` num terminal apontando para o banco certo antes de publicar."
  );
  process.exit(1);
}

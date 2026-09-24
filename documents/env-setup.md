# Configuração de Variáveis de Ambiente (API Key)

Para que a funcionalidade de criação de tarefas por voz funcione, o sistema precisa se comunicar com a API do Gemini. Para manter essa comunicação segura, a chave da API (API Key) não fica no código e deve ser injetada via variável de ambiente.

## Passo a Passo

### 1. Obtenha sua API Key do Gemini
1. Acesse o [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Faça login com sua conta do Google (você mencionou que já tem a assinatura Pro, então a cota será aplicada na mesma conta).
3. Clique em **"Create API key"** (Criar chave de API).
4. Selecione um projeto ou crie um novo para gerar a chave.
5. Copie a chave gerada (ela começa com `AIza...`).

### 2. Configure o arquivo local
1. Na raiz do projeto Orbit, criamos um arquivo chamado `.env.local` (ele já foi criado para você).
2. Abra o arquivo `.env.local` no seu editor de código.
3. Cole a sua chave entre as aspas:
   ```env
   GEMINI_API_KEY="AIzaSySuaChaveCopiadaAqui..."
   ```
4. Salve o arquivo.

### 3. Reinicie o servidor
Se você estiver com o servidor de desenvolvimento rodando (`npm run dev` ou `pnpm dev`), será necessário **pará-lo e iniciá-lo novamente** para que ele leia as novas variáveis do arquivo `.env.local`.

---
*Nota: O arquivo `.env.local` já está adicionado ao `.gitignore` do Next.js por padrão, garantindo que sua chave nunca seja exposta ou commitada acidentalmente no repositório público/Git.*

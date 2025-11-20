# Guia de Deploy no Vercel

## Pré-requisitos
1. Conta no Vercel (https://vercel.com)
2. Projeto configurado com Supabase

## Passos para Deploy

### 1. Login no Vercel CLI
```bash
vercel login
```
Isso abrirá o navegador para autenticação. Siga as instruções.

### 2. Deploy
```bash
vercel
```
Na primeira vez, você será questionado sobre:
- Link a um projeto existente? (Responda `N` para criar um novo)
- Nome do projeto
- Diretório

### 3. Deploy para Produção
```bash
vercel --prod
```

### 4. Configurar Variáveis de Ambiente no Vercel

Após o primeiro deploy, configure as variáveis de ambiente:

1. Acesse o dashboard da Vercel: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**
4. Adicione as seguintes variáveis:

```
VITE_SUPABASE_URL = seu_url_do_supabase
VITE_SUPABASE_ANON_KEY = sua_chave_anonima_do_supabase
VITE_SUPABASE_REDIRECT_URL = https://seu-dominio.vercel.app (opcional)
```

⚠️ **Importante**: Após adicionar as variáveis de ambiente, faça um novo deploy para que elas sejam aplicadas.

### 5. Redefinir Deploy (se necessário)
```bash
vercel --prod --force
```

## Observações

- O arquivo `vercel.json` já está configurado para um projeto Vite/React SPA
- As variáveis de ambiente precisam ser configuradas no painel da Vercel
- O domínio será fornecido pela Vercel automaticamente (ex: seu-projeto.vercel.app)


# SESAU Contratos

Aplicativo web para busca de contratos da Secretaria de Saúde do Recife (SESAU).

## 📋 Sobre o Projeto

Este aplicativo permite a busca de contratos por:
- Nome da empresa (credor)
- Número do contrato

Exibe informações detalhadas como:
- Nome da secretaria executiva
- Número do SEI
- Gestor
- Objeto resumido
- Datas de vigência
- Valores (anual e mensal)
- Termo atual
- Dias para vencimento
- Status da vigência

## 🚀 Tecnologias

- **React** - Biblioteca UI
- **Vite** - Build tool
- **TailwindCSS** - Estilização
- **Lucide React** - Ícones
- **PapaParse** - Parse de CSV

## 💻 Desenvolvimento Local

### Pré-requisitos

- Node.js (versão 16 ou superior)
- npm ou yarn

### Instalação

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build de produção
npm run preview
```

## 🌐 Deploy na Vercel

### Opção 1: Deploy via Interface Web (Recomendado)

1. **Criar conta na Vercel**
   - Acesse [vercel.com](https://vercel.com)
   - Faça login com sua conta GitHub, GitLab ou Bitbucket

2. **Importar o projeto**
   - Clique em "Add New Project"
   - Selecione o repositório do projeto
   - A Vercel detectará automaticamente que é um projeto Vite

3. **Configurar o projeto**
   - As configurações já estão definidas no arquivo `vercel.json`
   - Clique em "Deploy"

4. **Pronto!**
   - Sua aplicação estará disponível em `https://seu-projeto.vercel.app`
   - Cada push para a branch principal criará um novo deploy automaticamente

### Opção 2: Deploy via CLI

```bash
# Instalar Vercel CLI globalmente
npm install -g vercel

# Fazer login na Vercel
vercel login

# Deploy do projeto
vercel

# Deploy para produção
vercel --prod
```

### Configurações do Deploy

O arquivo `vercel.json` já está configurado com:
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Framework**: Vite
- **Rewrites**: Configurado para SPA (Single Page Application)
- **Security Headers**: Headers de segurança (X-Frame-Options, CSP, etc.)
- **Cache Optimization**: Cache agressivo para assets estáticos (1 ano)
- **Performance**: Otimizações de compressão e entrega

### Otimizações Implementadas

#### SEO e Metadados
- ✅ Título e descrição otimizados
- ✅ Meta tags Open Graph para redes sociais
- ✅ Meta tags Twitter Card
- ✅ Keywords relevantes
- ✅ Idioma configurado para pt-BR

#### Segurança
- ✅ X-Content-Type-Options: nosniff
- ✅ X-Frame-Options: DENY (proteção contra clickjacking)
- ✅ X-XSS-Protection: habilitado
- ✅ Referrer-Policy: strict-origin-when-cross-origin
- ✅ Permissions-Policy: restrições de APIs sensíveis

#### Performance
- ✅ Cache de 1 ano para assets estáticos (/assets/*)
- ✅ Cache de 1 ano para imagens
- ✅ Compressão automática pela Vercel
- ✅ Mobile-first com viewport otimizado

### Checklist Pré-Deploy

Antes de fazer o deploy, verifique:

- [ ] Build local funciona sem erros (`npm run build`)
- [ ] Preview local funciona corretamente (`npm run preview`)
- [ ] Dados do CSV estão atualizados
- [ ] Repositório Git está atualizado
- [ ] `.gitignore` está configurado corretamente
- [ ] Variáveis de ambiente (se houver) estão documentadas

### Variáveis de Ambiente

Se você precisar adicionar variáveis de ambiente:

1. No dashboard da Vercel, vá em "Settings" > "Environment Variables"
2. Adicione suas variáveis
3. Faça um novo deploy

## 📱 Acesso Mobile

O aplicativo é totalmente responsivo e pode ser acessado via navegador mobile através do link fornecido pela Vercel.

## 🔄 Atualizações Automáticas

Cada push para o repositório Git irá:
- Criar um preview deployment automaticamente
- Atualizar a produção (se for push na branch principal)
- Gerar uma URL única para cada deploy

## 🔧 Troubleshooting

### Build falha na Vercel

**Problema**: O build funciona localmente mas falha na Vercel

**Soluções**:
1. Verifique se a versão do Node.js está correta (Settings > General > Node.js Version)
2. Limpe o cache do build (Deployments > ... > Redeploy > Clear cache)
3. Verifique se todas as dependências estão no `package.json`

### Página em branco após deploy

**Problema**: A aplicação mostra uma página em branco

**Soluções**:
1. Verifique o console do navegador para erros
2. Confirme que o `outputDirectory` está configurado como `dist`
3. Verifique se o arquivo CSV está acessível

### Erro 404 ao recarregar página

**Problema**: Ao recarregar a página, aparece erro 404

**Solução**: O arquivo `vercel.json` já está configurado com rewrites para SPA. Se o problema persistir, verifique se o arquivo está no repositório.

### Headers de segurança não aparecem

**Problema**: Headers de segurança não estão sendo aplicados

**Solução**: Use as DevTools do navegador (Network tab) para verificar os headers. Pode levar alguns minutos após o deploy para propagar.


/**
 * Gera um slug a partir de um texto
 * Remove acentos, converte para minúsculas e substitui espaços por hífens
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]+/g, '-') // Substitui caracteres especiais por hífen
    .replace(/^-+|-+$/g, ''); // Remove hífens no início e fim
}

/**
 * Verifica se um identificador é um UUID válido
 */
export function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Gera a URL do serviço usando slug
 */
export function getServiceUrl(service: { id: string; slug?: string | null }): string {
  return `/servico/${service.slug || service.id}`;
}

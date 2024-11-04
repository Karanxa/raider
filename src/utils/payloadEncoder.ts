export type EncodingType = 'base64' | 'url' | 'html' | 'unicode' | 'hex';

export const encodePayload = (payload: string, encodingType: EncodingType): string => {
  switch (encodingType) {
    case 'base64':
      return btoa(payload);
    case 'url':
      return encodeURIComponent(payload);
    case 'html':
      return payload.replace(/[&<>"']/g, (match) => {
        const entities: { [key: string]: string } = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;'
        };
        return entities[match];
      });
    case 'unicode':
      return payload.split('').map(char => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`).join('');
    case 'hex':
      return payload.split('').map(char => `\\x${char.charCodeAt(0).toString(16).padStart(2, '0')}`).join('');
    default:
      return payload;
  }
};
export const encodeDocumentState = (state) => {
  let binary = '';
  state.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

export const decodeDocumentState = (encodedState) => {
  const binary = atob(encodedState);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
};

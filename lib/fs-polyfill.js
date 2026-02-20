// Dummy FS for Web compatibility
export const promises = {};
export const readFileSync = () => { };
export const writeFileSync = () => { };
export const existsSync = () => false;
export default {
    promises,
    readFileSync,
    writeFileSync,
    existsSync,
};

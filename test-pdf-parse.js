import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParseModule = require('pdf-parse');

console.log('pdfParseModule type:', typeof pdfParseModule);
console.log('pdfParseModule keys:', Object.keys(pdfParseModule));
console.log('pdfParseModule.default type:', typeof pdfParseModule.default);
console.log('Is function?', typeof pdfParseModule === 'function');
console.log('Has default?', typeof pdfParseModule.default === 'function');

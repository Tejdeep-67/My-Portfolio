// Dumps the glyph outlines of a word in a script font as JSON commands.
// usage: node outline.mjs <font.ttf> <text> <size> [x] [y] > out.json
// x, y move the baseline start (used to put the surname on a second line)
import fs from 'node:fs'
import opentype from 'opentype.js'

const [fontFile, text = 'Tejdeep', size = '200', x = '0', y = '0'] = process.argv.slice(2)
const buf = fs.readFileSync(fontFile)
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength))
const path = font.getPath(text, Number(x), Number(y), Number(size), { kerning: true })
const box = path.getBoundingBox()
console.log(JSON.stringify({ text, size: Number(size), box, commands: path.commands, d: path.toPathData(2) }))

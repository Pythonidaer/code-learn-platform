/**
 * Replaces markdown inline code `like this` with **like this** in questions.ts,
 * skipping code templates and TS template-literal array entries (examples/constraints).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const filePath = path.join(__dirname, '..', 'src', 'data', 'questions.ts')

const excludedField =
  /^\s*(starterCode|solutionCode|brokenCode|fixCode|componentCode|brokenComponentCode|code):\s*`/

function tickPairsTransform(line) {
  return line.replace(/`([^`\n]+)`/g, '**$1**')
}

function closesTemplateSameLine(line) {
  const fieldMatch = line.match(excludedField)
  if (!fieldMatch) return false
  const openIdx = line.indexOf('`', fieldMatch.index + fieldMatch[0].length - 1)
  if (openIdx === -1) return false
  const afterOpen = line.slice(openIdx + 1)
  const tickCount = (afterOpen.match(/`/g) ?? []).length
  return tickCount >= 1 && /`,\s*$/.test(line)
}

function shouldSkipTransform(line) {
  const t = line.trimStart()
  // TS template literal used as a standalone examples/constraints array element
  if (/^`[^`\n]*`[,]?\s*$/.test(t)) return true
  // Opening bracket on same line starts with a template literal (not a quoted string)
  if (/examples:\s*\[\s*`/.test(line)) return true
  if (/constraints:\s*\[\s*`/.test(line)) return true
  return false
}

const lines = fs.readFileSync(filePath, 'utf8').split('\n')
let inExcludedTemplate = false
const out = []

for (const line of lines) {
  if (!inExcludedTemplate && excludedField.test(line)) {
    out.push(line)
    if (!closesTemplateSameLine(line)) inExcludedTemplate = true
    continue
  }
  if (inExcludedTemplate) {
    out.push(line)
    if (/`,\s*$/.test(line)) inExcludedTemplate = false
    continue
  }
  if (shouldSkipTransform(line)) {
    out.push(line)
    continue
  }
  out.push(tickPairsTransform(line))
}

fs.writeFileSync(filePath, out.join('\n'))
console.log('Updated', filePath)

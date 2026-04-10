#!/usr/bin/env node
// update-archive.js
// Computes today's Worgle answer (in IST timezone) and appends it to archive.json
// Used by the daily GitHub Action

const fs = require('fs');
const path = require('path');

const SOLUTIONS = JSON.parse(fs.readFileSync(path.join(__dirname, 'solutions.json'), 'utf8'));
const EPOCH = new Date(2021, 5, 19); // June 19, 2021
const INDEX_OFFSET = 207;

function getTodayIST() {
  // Force IST by parsing the UTC date with IST offset
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  return new Date(utcMs + istOffset);
}

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getAnswerForDate(targetDate) {
  const epochMs = new Date(2021, 5, 19, 0, 0, 0, 0).getTime();
  const targetMs = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0).getTime();
  const dayOffset = Math.round((targetMs - epochMs) / 86400000);
  const rawIndex = dayOffset - INDEX_OFFSET;
  const index = ((rawIndex % SOLUTIONS.length) + SOLUTIONS.length) % SOLUTIONS.length;
  return SOLUTIONS[index];
}

// Main
const archivePath = path.join(__dirname, 'archive.json');
const archive = JSON.parse(fs.readFileSync(archivePath, 'utf8'));

const today = getTodayIST();
const todayStr = formatDate(today);

// Check if today's entry already exists
const lastEntry = archive[archive.length - 1];
if (lastEntry && lastEntry.date === todayStr) {
  console.log(`Today's entry already exists: ${todayStr} -> ${lastEntry.word}`);
  console.log('No update needed.');
  process.exit(0);
}

// Compute the answer
const word = getAnswerForDate(today);
const puzzleNum = lastEntry ? lastEntry.puzzle + 1 : 1;

const newEntry = {
  date: todayStr,
  word: word,
  puzzle: puzzleNum,
};

archive.push(newEntry);
fs.writeFileSync(archivePath, JSON.stringify(archive, null, 2));

console.log(`Added new entry: ${todayStr} -> ${word} (Puzzle #${puzzleNum})`);
console.log(`Archive now has ${archive.length} entries.`);

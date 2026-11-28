'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
test('all app transitions remain enabled regardless of device reduced-motion preference',()=>{
 assert.doesNotMatch(html,/prefers-reduced-motion/i);
 assert.match(html,/#more circle:first-child,#more circle:last-child\{opacity:1;transition: opacity 2s ease-in-out;\}/);
 assert.match(html,/#app:not\(\.scene-home\) #thread-actions\{\s*animation:motion2Rise \.38s/);
 assert.match(html,/animation:cursorBlinkV4 1\.06s linear infinite/);
});

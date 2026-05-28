const fs = require('fs');
const path = require('path');
const lucide = require('lucide-react');

function findLucideImports(dir) {
    let files = fs.readdirSync(dir);
    for (let file of files) {
        let fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            findLucideImports(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let match = content.match(/import\s+{([^}]+)}\s+from\s+['"]lucide-react['"]/m);
            if (match) {
                let imports = match[1].split(/[,\n]/).map(s => s.trim()).filter(s => s);
                let missing = imports.filter(i => {
                    let name = i.split(' as ')[0].trim();
                    return !lucide[name];
                });
                if (missing.length > 0) {
                    console.log(`Missing in ${fullPath}: ${missing.join(', ')}`);
                }
            }
        }
    }
}
findLucideImports('./src');

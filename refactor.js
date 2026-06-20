const fs = require('fs');
const path = require('path');

const electronDir = path.join(__dirname, 'electron');

// Get all files recursively
function getFiles(dir) {
    const dirents = fs.readdirSync(dir, { withFileTypes: true });
    const files = dirents.map((dirent) => {
        const res = path.resolve(dir, dirent.name);
        return dirent.isDirectory() ? getFiles(res) : res;
    });
    return Array.prototype.concat(...files);
}

const allFiles = getFiles(electronDir).filter(f => f.endsWith('.js') && !f.endsWith('.cjs'));

// Rename and update requires
allFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // Update requires: require('./something') -> require('./something.cjs')
    // We can use a regex for require arguments that are local paths.
    content = content.replace(/require\(['"](\.[^'"]+)['"]\)/g, (match, p1) => {
        if (p1.endsWith('.js')) {
            return `require('${p1.replace('.js', '.cjs')}')`;
        }
        if (!p1.endsWith('.json') && !p1.endsWith('.cjs')) {
            return `require('${p1}.cjs')`;
        }
        return match;
    });

    // Also update preload.js to preload.cjs
    content = content.replace(/preload\.js/g, 'preload.cjs');

    const newPath = file.replace(/\.js$/, '.cjs');
    fs.writeFileSync(file, content, 'utf8');
    fs.renameSync(file, newPath);
    console.log(`Renamed and updated: ${newPath}`);
});

// Update package.json
const pkgPath = path.join(__dirname, 'package.json');
const pkgStr = fs.readFileSync(pkgPath, 'utf8');
const pkg = JSON.parse(pkgStr);
pkg.type = 'module';
pkg.main = 'electron/main.cjs';
if (pkg.scripts.migrate) pkg.scripts.migrate = pkg.scripts.migrate.replace('.js', '.cjs');
if (pkg.scripts.seed) pkg.scripts.seed = pkg.scripts.seed.replace('.js', '.cjs');
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');
console.log('Updated package.json');
